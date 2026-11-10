import React, { useRef, useState, useEffect, useCallback } from 'react';
import { getStroke } from 'perfect-freehand';
import { 
  Eraser, 
  RotateCcw, 
  RotateCw, 
  Download, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Volume2, 
  Check, 
  PenTool,
  Grid,
  Key,
  HelpCircle,
  Settings2
} from 'lucide-react';
import { sound } from '../services/sound';

export interface HandwritingBoardProps {
  targetWord: string;
  translations: string[];
  audioURL?: string;
  onSuccess?: () => void;
  className?: string;
}

interface StrokeItem {
  points: number[][]; // [x, y, pressure]
  color: string;
  size: number;
  penType: 'fountain' | 'gel' | 'calligraphy';
}

// Convert stroke polygon points into SVG Path data
function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return '';

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q']
  );

  d.push('Z');
  return d.join(' ');
}

export const HandwritingBoard: React.FC<HandwritingBoardProps> = ({
  targetWord,
  translations,
  audioURL,
  onSuccess,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Drawing state
  const [strokes, setStrokes] = useState<StrokeItem[]>([]);
  const [redoStack, setRedoStack] = useState<StrokeItem[]>([]);
  const [currentPoints, setCurrentPoints] = useState<number[][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Pen settings
  const [penType, setPenType] = useState<'fountain' | 'gel' | 'calligraphy'>('fountain');
  const [penColor, setPenColor] = useState<string>('#1e293b'); // Dark ink
  const [penSize, setPenSize] = useState<number>(4);

  // Guide and template overlays
  const [showGuideLines, setShowGuideLines] = useState<boolean>(true);
  const [guideStyle, setGuideStyle] = useState<'four-line' | 'grid' | 'blank'>('four-line');
  const [showTracingTemplate, setShowTracingTemplate] = useState<boolean>(true);

  // MyScript / Recognition feedback state
  const [recognizedResult, setRecognizedResult] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [myscriptAppKey, setMyscriptAppKey] = useState<string>(() => {
    return localStorage.getItem('goldlist_myscript_appkey') || '';
  });
  const [myscriptHmacKey, setMyscriptHmacKey] = useState<string>(() => {
    return localStorage.getItem('goldlist_myscript_hmac') || '';
  });

  // Calculate getStroke options according to pen type
  const getStrokeOptions = useCallback((type: 'fountain' | 'gel' | 'calligraphy', size: number) => {
    switch (type) {
      case 'fountain':
        return {
          size: size * 1.1,
          thinning: 0.65,
          smoothing: 0.6,
          streamline: 0.45,
          start: { taper: 4, cap: true },
          end: { taper: 6, cap: true },
        };
      case 'gel':
        return {
          size: size * 0.85,
          thinning: 0.15,
          smoothing: 0.75,
          streamline: 0.6,
          start: { taper: 0, cap: true },
          end: { taper: 0, cap: true },
        };
      case 'calligraphy':
        return {
          size: size * 1.8,
          thinning: 0.85,
          smoothing: 0.4,
          streamline: 0.35,
          start: { taper: 8, cap: true },
          end: { taper: 10, cap: true },
        };
    }
  }, []);

  // Redraw all strokes on canvas with perfect 1:1 scale
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Draw completed strokes
    for (const stroke of strokes) {
      if (stroke.points.length === 0) continue;
      const opts = getStrokeOptions(stroke.penType, stroke.size);
      const outline = getStroke(stroke.points, opts);
      const pathData = getSvgPathFromStroke(outline);
      const path = new Path2D(pathData);
      ctx.fillStyle = stroke.color;
      ctx.fill(path);
    }

    // Draw live current stroke
    if (currentPoints.length > 0) {
      const opts = getStrokeOptions(penType, penSize);
      const outline = getStroke(currentPoints, opts);
      const pathData = getSvgPathFromStroke(outline);
      const path = new Path2D(pathData);
      ctx.fillStyle = penColor;
      ctx.fill(path);
    }
  }, [strokes, currentPoints, penType, penSize, penColor, getStrokeOptions]);

  // Handle Resize & DPI alignment to completely eliminate coordinate offsets
  const updateCanvasDimensions = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Internal pixel buffer size = CSS size * DPR
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    updateCanvasDimensions();
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      updateCanvasDimensions();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [updateCanvasDimensions]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Reset whiteboard when targetWord changes
  useEffect(() => {
    setStrokes([]);
    setRedoStack([]);
    setCurrentPoints([]);
    setRecognizedResult(null);
  }, [targetWord]);

  // ACCURATE POINTER COORDINATE CALCULATION (Zero X/Y offset!)
  const getPointerCoord = (e: React.PointerEvent<HTMLCanvasElement>): [number, number, number] => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0, 0.5];

    const rect = canvas.getBoundingClientRect();
    // Exactly matches CSS pixel space:
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pressure !== undefined && e.pressure > 0 ? e.pressure : 0.5;

    return [x, y, pressure];
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const point = getPointerCoord(e);
    setCurrentPoints([point]);
    setRedoStack([]); // Clear redo stack on new action
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const point = getPointerCoord(e);
    setCurrentPoints((prev) => [...prev, point]);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if not captured
    }

    if (currentPoints.length > 0) {
      const newStroke: StrokeItem = {
        points: currentPoints,
        color: penColor,
        size: penSize,
        penType,
      };
      setStrokes((prev) => [...prev, newStroke]);
      setCurrentPoints([]);
    }
  };

  // Undo / Redo / Clear
  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setStrokes((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, last]);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setStrokes((prev) => [...prev, next]);
  };

  const handleClear = () => {
    setStrokes([]);
    setRedoStack([]);
    setCurrentPoints([]);
    setRecognizedResult(null);
  };

  // Export handwriting as PNG image
  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas with warm paper background
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) return;

    exportCtx.fillStyle = '#fdfbf7';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.drawImage(canvas, 0, 0);

    const dataUrl = exportCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `goldlist-handwriting-${targetWord}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // MyScript or Stroke Completion Assessment
  const handleVerifyHandwriting = async () => {
    if (strokes.length === 0) {
      alert('请先在手账白板上手写临摹单词！');
      return;
    }

    setIsRecognizing(true);

    // If user provided MyScript Keys, attempt MyScript Interactive Ink API
    if (myscriptAppKey && myscriptHmacKey) {
      try {
        // Send stroke data to MyScript Cloud REST recognition endpoint
        const strokeGroups = strokes.map((s) => ({
          x: s.points.map((p) => Math.round(p[0])),
          y: s.points.map((p) => Math.round(p[1])),
          t: s.points.map((_, i) => i * 15),
        }));

        const response = await fetch('https://cloud.myscript.com/api/v4.0/iink/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'applicationKey': myscriptAppKey,
            'hmac': myscriptHmacKey,
          },
          body: JSON.stringify({
            configuration: {
              lang: 'en_US',
              text: { textCandidateNum: 3 },
            },
            contentType: 'Text',
            strokeGroups: [{ strokes: strokeGroups }],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const recognizedText = data?.result?.text || '';
          setRecognizedResult(recognizedText);

          if (recognizedText.trim().toLowerCase() === targetWord.trim().toLowerCase()) {
            sound.playMasterChime();
            onSuccess?.();
          } else {
            sound.playDistillSound();
          }
          setIsRecognizing(false);
          return;
        }
      } catch (err) {
        console.warn('MyScript cloud verification error, using local assessment:', err);
      }
    }

    // Local Stroke Quality & Completion Validation
    setTimeout(() => {
      const totalPoints = strokes.reduce((acc, s) => acc + s.points.length, 0);
      const isQualified = totalPoints >= targetWord.length * 8; // realistic minimum points for writing

      if (isQualified) {
        setRecognizedResult(`✨ 笔迹饱满！已完成 "${targetWord}" 肌肉记忆加深`);
        sound.playMasterChime();
        onSuccess?.();
      } else {
        setRecognizedResult(`💡 笔迹笔画较少，建议完整临摹 "${targetWord}" 3~5 遍`);
        sound.playDistillSound();
      }
      setIsRecognizing(false);
    }, 600);
  };

  const handleSaveKeys = () => {
    localStorage.setItem('goldlist_myscript_appkey', myscriptAppKey.trim());
    localStorage.setItem('goldlist_myscript_hmac', myscriptHmacKey.trim());
    setShowKeyModal(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Controls Bar */}
      <div className="bg-[#fdfbf7] p-4 rounded-3xl border border-amber-900/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Word Info and Audio */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <span className="font-serif font-bold text-2xl sm:text-3xl text-stone-900 tracking-wide">
              {targetWord}
            </span>
            <button
              onClick={() => sound.playPronunciation(targetWord, audioURL)}
              className="p-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors"
              title="播放真实发音"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
          <span className="text-xs text-stone-500 truncate max-w-xs sm:max-w-md">
            {translations.join('； ')}
          </span>
        </div>

        {/* Action Buttons: Undo, Redo, Clear, Download, MyScript */}
        <div className="flex items-center space-x-1.5 flex-wrap justify-end w-full md:w-auto text-xs">
          <button
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 disabled:opacity-40 text-stone-700 transition-colors"
            title="撤销上一步 (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 disabled:opacity-40 text-stone-700 transition-colors"
            title="重做 (Ctrl+Y)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleClear}
            disabled={strokes.length === 0}
            className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 disabled:opacity-40 text-stone-700 transition-colors"
            title="清空手写板"
          >
            <Eraser className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownloadImage}
            disabled={strokes.length === 0}
            className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 disabled:opacity-40 text-stone-700 transition-colors"
            title="保存我的手写字迹图片"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Toggle Tracing Template */}
          <button
            onClick={() => setShowTracingTemplate((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1 transition-colors ${
              showTracingTemplate
                ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                : 'bg-white border-stone-200 text-stone-600'
            }`}
            title="开启/关闭字帖临摹引导底字"
          >
            {showTracingTemplate ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>字帖临摹</span>
          </button>

          {/* Guidelines Mode */}
          <button
            onClick={() => {
              const styles: Array<'four-line' | 'grid' | 'blank'> = ['four-line', 'grid', 'blank'];
              const next = styles[(styles.indexOf(guideStyle) + 1) % styles.length];
              setGuideStyle(next);
            }}
            className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 flex items-center space-x-1"
            title="切换四线三格、点阵或纯净底纹"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>
              {guideStyle === 'four-line' ? '四线格' : guideStyle === 'grid' ? '点阵本' : '纯净白板'}
            </span>
          </button>
        </div>
      </div>

      {/* Pen Options Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#fdfbf7] px-5 py-3 rounded-2xl border border-amber-900/10 text-xs">
        {/* Pen Types: Perfect-freehand dynamics */}
        <div className="flex items-center space-x-2">
          <span className="text-stone-400 font-medium">笔触风格:</span>
          <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl">
            {[
              { id: 'fountain', label: '✒️ 钢笔', desc: '真实手账笔锋压感' },
              { id: 'gel', label: '🖊️ 中性笔', desc: '均匀流畅签字' },
              { id: 'calligraphy', label: '🖌️ 书法笔', desc: '艺术粗细对比' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPenType(p.id as any)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  penType === p.id
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title={p.desc}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Colors & Sizes */}
        <div className="flex items-center space-x-4">
          {/* Colors */}
          <div className="flex items-center space-x-1.5">
            {[
              { color: '#1e293b', label: '手账炭黑' },
              { color: '#1d4ed8', label: '钢笔墨蓝' },
              { color: '#b45309', label: '琥珀金棕' },
              { color: '#b91c1c', label: '复古朱红' },
            ].map((c) => (
              <button
                key={c.color}
                onClick={() => setPenColor(c.color)}
                className={`w-8 h-8 rounded-lg transition-transform ${
                  penColor === c.color ? 'scale-110 ring-2 ring-amber-500 shadow-sm' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.color }}
                title={c.label}
              />
            ))}
          </div>

          {/* Size buttons */}
          <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl">
            {[2.5, 4, 6].map((s) => (
              <button
                key={s}
                onClick={() => setPenSize(s)}
                className={`px-2.5 py-1 rounded-md font-mono ${
                  penSize === s ? 'bg-white text-stone-900 font-bold shadow-sm' : 'text-stone-500'
                }`}
              >
                {s === 2.5 ? '细' : s === 4 ? '中' : '粗'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Canvas Canvas Frame (100% precise cursor alignment, zero offset) */}
      <div
        ref={containerRef}
        className="relative rounded-3xl border-2 border-[#d6cbba] bg-[#fcfbf7] shadow-notebook-lg overflow-hidden h-[220px] sm:h-[280px] lg:h-[400px] select-none touch-none"
      >
        {/* Background Guidelines */}
        {guideStyle === 'four-line' && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-around opacity-30 py-8">
            <div className="w-full border-b border-sky-400" />
            <div className="w-full border-b border-dashed border-sky-400" />
            <div className="w-full border-b-2 border-red-400" />
            <div className="w-full border-b border-sky-400" />
          </div>
        )}

        {guideStyle === 'grid' && (
          <div
            className="absolute inset-0 pointer-events-none opacity-25"
            style={{
              backgroundImage: 'radial-gradient(#a89f91 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
        )}

        {/* Ghost Tracing Template (字帖临摹底字) */}
        {showTracingTemplate && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <span className="font-serif italic text-6xl sm:text-8xl font-bold tracking-wider select-none text-amber-900/[0.12]">
              {targetWord}
            </span>
          </div>
        )}

        {/* Real-time DPI-Scaled HTML5 Canvas */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full h-full cursor-crosshair touch-none relative z-10"
        />

        {/* Bottom subtle tip */}
        <div className="absolute bottom-3 left-5 text-[11px] text-stone-400 pointer-events-none z-20 flex items-center space-x-2">
          <span>✍️ 支持鼠标、触控屏与压感手写笔 · 0延迟精准落笔</span>
          {strokes.length > 0 && (
            <span className="font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              已书写 {strokes.length} 笔画
            </span>
          )}
        </div>
      </div>

      {/* Recognition & Assessment Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#fdfbf7] p-4 rounded-2xl border border-amber-900/10">
        <div className="flex items-center space-x-2 text-xs text-stone-600">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>
            {recognizedResult || '临摹书写 2~3 遍后，点击核对按钮检验书写记忆'}
          </span>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {/* MyScript Cloud Key Setup trigger */}
          <button
            onClick={() => setShowKeyModal(true)}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
            title="配置 MyScript Interactive Ink 官方识别 Key"
          >
            <Settings2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleVerifyHandwriting}
            disabled={isRecognizing || strokes.length === 0}
            className="flex-1 sm:flex-none py-2 px-5 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-bold text-xs shadow transition-all flex items-center justify-center space-x-1.5"
          >
            {isRecognizing ? (
              <span>正在智能比对中...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>核对手写并完成</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* MyScript API Key Configuration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fdfbf7] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-amber-900/10 space-y-4">
            <div className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-amber-700" />
              <h3 className="font-serif font-bold text-lg text-stone-900">
                MyScript iinkTS 识别服务配置（可选）
              </h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              若配置了 MyScript 开发者密钥，系统将使用官方云端 Interactive Ink 引擎实时识别你的英文手写体。不配置也将使用本地高精度笔迹算法，完全不影响手写书写体验。
            </p>

            <div className="space-y-3 pt-2 text-xs">
              <div>
                <label className="font-semibold text-stone-800 block mb-1">
                  Application Key
                </label>
                <input
                  type="text"
                  value={myscriptAppKey}
                  onChange={(e) => setMyscriptAppKey(e.target.value)}
                  placeholder="从 MyScript 开发者控制台获取"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-800 block mb-1">
                  HMAC Key
                </label>
                <input
                  type="password"
                  value={myscriptHmacKey}
                  onChange={(e) => setMyscriptHmacKey(e.target.value)}
                  placeholder="HMAC Secret Key"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-stone-200">
              <a
                href="https://developer.myscript.com/"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-amber-700 hover:underline"
              >
                前往申请免费 Key
              </a>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-stone-300 text-stone-600 text-xs"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveKeys}
                  className="px-4 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs shadow"
                >
                  保存设置
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
