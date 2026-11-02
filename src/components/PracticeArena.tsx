import React, { useState, useRef, useEffect } from 'react';
import { 
  Volume2, 
  RotateCcw, 
  Check, 
  X, 
  HelpCircle, 
  PenTool, 
  Keyboard, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Eraser, 
  Eye, 
  EyeOff,
  Lightbulb,
  Award,
  BookOpen
} from 'lucide-react';
import { WordItem, GoldListPage } from '../types/goldlist';
import { sound } from '../services/sound';
import confetti from 'canvas-confetti';

interface PracticeArenaProps {
  words: WordItem[];
  pages: GoldListPage[];
  initialPageId?: number;
  onGoToPage?: (pageId: number) => void;
}

type PracticeMode = 'spelling' | 'handwriting';

export const PracticeArena: React.FC<PracticeArenaProps> = ({
  words,
  pages,
  initialPageId = 1,
  onGoToPage,
}) => {
  const [selectedPageId, setSelectedPageId] = useState<number>(initialPageId);
  const [mode, setMode] = useState<PracticeMode>('spelling');
  const [filterScope, setFilterScope] = useState<'page' | 'pipeline' | 'all'>('page');

  // Words pool for practice
  const practiceWords = React.useMemo(() => {
    if (filterScope === 'page') {
      return words.filter((w) => w.pageId === selectedPageId);
    } else if (filterScope === 'pipeline') {
      const pipelineWords = words.filter((w) => ['headlist', 'd1', 'd2', 'd3'].includes(w.stage));
      return pipelineWords.slice(0, 30);
    } else {
      return words.slice(0, 30);
    }
  }, [words, selectedPageId, filterScope]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentWord = practiceWords[currentIndex] || practiceWords[0];

  // Spelling state
  const [userInput, setUserInput] = useState('');
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [hintCount, setHintCount] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [historyResults, setHistoryResults] = useState<{ word: WordItem; passed: boolean }[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handwriting canvas state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#1e293b'); // Dark ink
  const [penSize, setPenSize] = useState(3);
  const [showCanvasGuide, setShowCanvasGuide] = useState(true);

  // Reset states on word change
  useEffect(() => {
    if (!currentWord) return;
    setUserInput('');
    setIsAnswerRevealed(false);
    setFeedback('idle');
    setHintCount(0);
    clearCanvas();
    if (inputRef.current) {
      inputRef.current.focus();
    }
    // Auto-play audio on question mount
    sound.playPronunciation(currentWord.text, currentWord.audioURL);
  }, [currentIndex, currentWord]);

  // Check spelling
  const handleCheckSpelling = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentWord || feedback === 'correct') return;

    const cleanInput = userInput.trim().toLowerCase();
    const cleanTarget = currentWord.text.trim().toLowerCase();

    if (cleanInput === cleanTarget) {
      setFeedback('correct');
      sound.playMasterChime();
      setScore((prev) => ({ correct: prev.correct + 1, total: prev.total + 1 }));
      setHistoryResults((prev) => [...prev, { word: currentWord, passed: true }]);

      setTimeout(() => {
        handleNextWord();
      }, 1100);
    } else {
      setFeedback('incorrect');
      sound.playDistillSound();
    }
  };

  const handleNextWord = () => {
    if (currentIndex + 1 < practiceWords.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
      confetti({ particleCount: 70, spread: 60 });
    }
  };

  const handleGiveHint = () => {
    if (!currentWord) return;
    setHintCount((prev) => prev + 1);
    const target = currentWord.text;
    const revealedLength = Math.min(hintCount + 1, target.length);
    setUserInput(target.slice(0, revealedLength));
    if (inputRef.current) inputRef.current.focus();
  };

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFinished(false);
    setScore({ correct: 0, total: 0 });
    setHistoryResults([]);
  };

  if (!currentWord) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-stone-500">
        暂无待练习的单词，请选择其他练习范围。
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#fdfbf7] p-5 rounded-3xl border border-amber-900/10 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-700">
              <PenTool className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
              黄金列表强化练习区
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            动手动脑：通过听音默写、拼写自测与手写临摹，深化肌肉反射与长时神经元回路。
          </p>
        </div>

        {/* Practice Mode Toggle */}
        <div className="flex items-center space-x-2 bg-stone-100 p-1.5 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setMode('spelling')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              mode === 'spelling'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Keyboard className="w-4 h-4 text-amber-600" />
            <span>听音打字拼写</span>
          </button>

          <button
            onClick={() => setMode('handwriting')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              mode === 'handwriting'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <PenTool className="w-4 h-4 text-amber-600" />
            <span>手写手账白板</span>
          </button>
        </div>
      </div>

      {/* Scope Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#fdfbf7] px-5 py-3.5 rounded-2xl border border-amber-900/10 text-xs">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-stone-700">练习范围:</span>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => {
                setFilterScope('page');
                handleRestart();
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterScope === 'page'
                  ? 'bg-amber-700 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              当前手账页 (第 {selectedPageId} 页)
            </button>
            <button
              onClick={() => {
                setFilterScope('pipeline');
                handleRestart();
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterScope === 'pipeline'
                  ? 'bg-amber-700 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              待蒸馏攻坚池
            </button>
          </div>
        </div>

        {filterScope === 'page' && (
          <div className="flex items-center space-x-2">
            <span className="text-stone-500">切换页码:</span>
            <select
              value={selectedPageId}
              onChange={(e) => {
                setSelectedPageId(Number(e.target.value));
                handleRestart();
              }}
              className="px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-xs font-serif font-bold text-stone-800"
            >
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Practice Container */}
      {!isFinished ? (
        <div className="space-y-6">
          {/* Progress Header */}
          <div className="flex items-center justify-between text-xs text-stone-500 px-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-stone-800 font-mono">
                {currentIndex + 1} / {practiceWords.length}
              </span>
              <span>· 第 {currentWord.pageId} 页词条</span>
            </div>
            <div className="flex items-center space-x-3">
              <span>正确率: <strong className="text-emerald-700">{score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%</strong></span>
            </div>
          </div>

          {/* MODE 1: Spelling & Dictation */}
          {mode === 'spelling' && (
            <div className="bg-[#fdfbf7] rounded-3xl p-6 sm:p-10 border border-amber-900/10 shadow-notebook-lg space-y-8">
              {/* Prompt Section */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-100/70 text-amber-900 text-xs font-medium">
                  <span>听音拼写 · 盲测记忆</span>
                </div>

                {/* Pronunciation button large */}
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => sound.playPronunciation(currentWord.text, currentWord.audioURL)}
                    className="p-4 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-600/30 transition-all transform active:scale-95 group"
                    title="重新播放原声发音"
                  >
                    <Volume2 className="w-8 h-8 group-hover:scale-110 transition-transform" />
                  </button>
                  <span className="text-xs text-stone-400">点击小喇叭重听原生发音</span>
                </div>

                {/* Chinese Translations */}
                <div className="pt-2">
                  <div className="text-stone-500 text-xs font-medium">中文释义:</div>
                  <div className="text-xl sm:text-2xl font-bold text-stone-800 font-sans mt-1">
                    {currentWord.translations.join('; ')}
                  </div>
                </div>

                {/* Optional Revealed Word */}
                {isAnswerRevealed && (
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 inline-block text-center animate-fade-in">
                    <span className="text-xs text-amber-700 font-medium">正确拼写:</span>
                    <div className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-wide mt-0.5">
                      {currentWord.text}
                    </div>
                  </div>
                )}
              </div>

              {/* Input Form */}
              <form onSubmit={handleCheckSpelling} className="max-w-md mx-auto space-y-4">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => {
                      setUserInput(e.target.value);
                      if (feedback !== 'idle') setFeedback('idle');
                    }}
                    placeholder="输入正确的英文单词拼写..."
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className={`w-full px-5 py-4 text-center text-xl sm:text-2xl font-serif font-bold rounded-2xl border-2 transition-all outline-none ${
                      feedback === 'correct'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-4 ring-emerald-500/20'
                        : feedback === 'incorrect'
                        ? 'border-red-400 bg-red-50 text-red-900 ring-4 ring-red-400/20'
                        : 'border-stone-300 focus:border-amber-600 bg-white text-stone-900 focus:ring-4 focus:ring-amber-500/10'
                    }`}
                  />
                  {feedback === 'correct' && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600 flex items-center space-x-1 font-bold text-sm">
                      <Check className="w-6 h-6" />
                    </div>
                  )}
                  {feedback === 'incorrect' && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 flex items-center space-x-1 font-bold text-sm">
                      <X className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* Actions & Helpers */}
                <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                  <button
                    type="button"
                    onClick={handleGiveHint}
                    className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium transition-colors"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <span>提示首字母 ({hintCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAnswerRevealed((prev) => !prev)}
                    className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium transition-colors"
                  >
                    {isAnswerRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{isAnswerRevealed ? '隐藏答案' : '偷看答案'}</span>
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1"
                  >
                    <span>核对拼写 (Enter)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MODE 2: Handwriting Canvas */}
          {mode === 'handwriting' && (
            <div className="bg-[#fdfbf7] rounded-3xl p-6 sm:p-8 border border-amber-900/10 shadow-notebook-lg space-y-6">
              {/* Word Display Banner */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-stone-200 pb-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start space-x-3">
                    <span className="font-serif font-bold text-2xl sm:text-3xl text-stone-900 tracking-wide">
                      {currentWord.text}
                    </span>
                    <button
                      onClick={() => sound.playPronunciation(currentWord.text, currentWord.audioURL)}
                      className="p-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors"
                      title="播放发音"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm font-medium text-stone-600">
                    {currentWord.translations.join('; ')}
                  </div>
                </div>

                {/* Canvas Controls */}
                <div className="flex items-center space-x-2">
                  {/* Colors */}
                  <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl">
                    {[
                      { color: '#1e293b', label: '墨黑' },
                      { color: '#1d4ed8', label: '钢笔蓝' },
                      { color: '#b45309', label: '琥珀棕' },
                    ].map((c) => (
                      <button
                        key={c.color}
                        onClick={() => setPenColor(c.color)}
                        className={`w-6 h-6 rounded-lg transition-transform ${
                          penColor === c.color ? 'scale-110 ring-2 ring-stone-400' : 'opacity-70'
                        }`}
                        style={{ backgroundColor: c.color }}
                        title={c.label}
                      />
                    ))}
                  </div>

                  {/* Pen Size */}
                  <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl text-xs">
                    {[2, 3, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() => setPenSize(s)}
                        className={`px-2 py-1 rounded-md font-medium ${
                          penSize === s ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
                        }`}
                      >
                        {s === 2 ? '细' : s === 3 ? '中' : '粗'}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={clearCanvas}
                    className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
                    title="清空手写板"
                  >
                    <Eraser className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* The Drawing Canvas Box with Paper Guidelines */}
              <div className="relative rounded-2xl border-2 border-stone-300 bg-[#fefcf9] overflow-hidden shadow-inner">
                {/* Visual guidelines */}
                {showCanvasGuide && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-around opacity-30">
                    <div className="w-full border-b border-dashed border-sky-400 h-1/4" />
                    <div className="w-full border-b border-red-400 h-1/4" />
                    <div className="w-full border-b border-dashed border-sky-400 h-1/4" />
                  </div>
                )}

                <canvas
                  ref={canvasRef}
                  width={800}
                  height={300}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-64 sm:h-72 cursor-crosshair touch-none"
                />

                <div className="absolute bottom-3 left-4 text-[11px] text-stone-400 pointer-events-none">
                  ✍️ 在此手写临摹单词 3~5 遍，刺激运动记忆神经
                </div>
              </div>

              {/* Bottom Nav */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-100 disabled:opacity-40 text-stone-700 text-xs font-medium flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>上一个词</span>
                </button>

                <button
                  onClick={handleNextWord}
                  className="px-6 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-md flex items-center space-x-1"
                >
                  <span>抄写完成，下一个</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Finished Report Card */
        <div className="bg-[#fdfbf7] rounded-3xl p-8 sm:p-12 border border-amber-900/10 shadow-notebook-lg text-center space-y-6 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-600/30">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-bold text-stone-900">
              本次练习已顺利完成！
            </h2>
            <p className="text-xs text-stone-600">
              手抄与拼写练习极大巩固了词形反射，你正在稳步攻克全部 2,503 词。
            </p>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 grid grid-cols-2 gap-4 text-xs">
            <div className="bg-white p-3 rounded-xl">
              <span className="text-stone-400">总练习词数</span>
              <div className="text-2xl font-serif font-bold text-stone-800 mt-1">
                {practiceWords.length}
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl">
              <span className="text-stone-400">正确率</span>
              <div className="text-2xl font-serif font-bold text-emerald-700 mt-1">
                {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 100}%
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={handleRestart}
              className="flex-1 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-xs transition-colors flex items-center justify-center space-x-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>重新练习本组</span>
            </button>
            {onGoToPage && (
              <button
                onClick={() => onGoToPage(selectedPageId)}
                className="flex-1 py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs shadow transition-colors flex items-center justify-center space-x-1.5"
              >
                <BookOpen className="w-4 h-4" />
                <span>返回手账本查看</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
