import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  Volume2, 
  Check, 
  ArrowRight, 
  Sparkles, 
  RotateCcw, 
  Eye, 
  HelpCircle,
  Award
} from 'lucide-react';
import { WordItem, GoldListPage, DistillationStage } from '../types/goldlist';
import { sound } from '../services/sound';
import { db } from '../services/db';

interface DistillSessionProps {
  pageId: number;
  pages: GoldListPage[];
  words: WordItem[];
  cooldownDays: number;
  autoPlayAudio: boolean;
  onFinish: () => void;
  onOpenGuide: () => void;
}

export const DistillSession: React.FC<DistillSessionProps> = ({
  pageId,
  pages,
  words,
  cooldownDays,
  autoPlayAudio,
  onFinish,
  onOpenGuide,
}) => {
  const page = pages.find((p) => p.id === pageId);
  const now = Date.now();

  // Find candidate words in this page that need reviewing:
  // Words that are NOT mastered, sorted by stage
  const sessionCandidates = words
    .filter((w) => w.pageId === pageId && w.stage !== 'mastered')
    .sort((a, b) => {
      const stageOrder: Record<DistillationStage, number> = {
        headlist: 1,
        d1: 2,
        d2: 3,
        d3: 4,
        mastered: 5,
      };
      return stageOrder[a.stage] - stageOrder[b.stage];
    });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [sessionResults, setSessionResults] = useState<{
    word: WordItem;
    remembered: boolean;
    previousStage: DistillationStage;
  }[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentWord = sessionCandidates[currentIndex];

  // Auto-play audio when switching words
  useEffect(() => {
    if (currentWord && autoPlayAudio) {
      sound.playPronunciation(currentWord.text, currentWord.audioURL);
    }
    setIsRevealed(false);
  }, [currentIndex, currentWord, autoPlayAudio]);

  const handlePlayAudio = () => {
    if (currentWord) {
      sound.playPronunciation(currentWord.text, currentWord.audioURL);
    }
  };

  const handleDecision = async (remembered: boolean) => {
    if (!currentWord) return;

    if (remembered) {
      sound.playMasterChime();
    } else {
      sound.playDistillSound();
    }

    const previousStage = currentWord.stage;
    const updatedWord = await db.distillWord(currentWord.id, remembered, cooldownDays);

    const newResults = [
      ...sessionResults,
      {
        word: updatedWord,
        remembered,
        previousStage,
      },
    ];
    setSessionResults(newResults);

    if (currentIndex + 1 < sessionCandidates.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Finished session
      setIsCompleted(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#cd7f32', '#10b981', '#3b82f6'],
      });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsRevealed((prev) => !prev);
      } else if (e.code === 'ArrowLeft' || e.key === '1') {
        // Did not remember -> distill
        handleDecision(false);
      } else if (e.code === 'ArrowRight' || e.key === '2') {
        // Remembered -> master
        handleDecision(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isCompleted, currentWord]);

  // Stage labels
  const getStageLabel = (stage: DistillationStage) => {
    switch (stage) {
      case 'headlist':
        return { name: '原始列表 (Headlist)', next: '铜级蒸馏 (D1)', color: 'text-amber-800 bg-amber-100' };
      case 'd1':
        return { name: '第 1 次蒸馏 (D1 铜级)', next: '银级蒸馏 (D2)', color: 'text-orange-800 bg-orange-100' };
      case 'd2':
        return { name: '第 2 次蒸馏 (D2 银级)', next: '金级蒸馏 (D3)', color: 'text-slate-800 bg-slate-200' };
      case 'd3':
        return { name: '第 3 次蒸馏 (D3 金级)', next: '长时巩固金库', color: 'text-yellow-900 bg-yellow-200' };
      default:
        return { name: '永久长时记忆', next: '已巩固', color: 'text-emerald-800 bg-emerald-100' };
    }
  };

  if (!page || sessionCandidates.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-[#fdfbf7] rounded-3xl p-8 max-w-md w-full text-center space-y-4 border border-amber-900/10 shadow-2xl">
          <Sparkles className="w-12 h-12 text-amber-600 mx-auto" />
          <h2 className="text-xl font-serif font-bold text-stone-900">本页无可蒸馏词汇</h2>
          <p className="text-xs text-stone-600">
            本页中的所有单词均已进入长时记忆金库，或者无需蒸馏。
          </p>
          <button
            onClick={onFinish}
            className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-medium"
          >
            返回手账
          </button>
        </div>
      </div>
    );
  }

  const masteredInSession = sessionResults.filter((r) => r.remembered).length;
  const distilledInSession = sessionResults.filter((r) => !r.remembered).length;
  const distillRate = sessionResults.length > 0 
    ? Math.round((distilledInSession / sessionResults.length) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 overflow-y-auto">
      {/* Top Header Bar */}
      <div className="w-full max-w-2xl flex items-center justify-between text-stone-300 py-2">
        <div className="flex items-center space-x-3">
          <span className="font-serif font-bold text-white text-lg">
            {page.title}
          </span>
          <span className="text-xs text-stone-400">· 蒸馏测试模式</span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenGuide}
            className="text-stone-400 hover:text-white p-1 text-xs flex items-center space-x-1"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">黄金法则</span>
          </button>
          <button
            onClick={onFinish}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Flashcard Container */}
      {!isCompleted ? (
        <div className="w-full max-w-xl my-auto space-y-6">
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>进度: {currentIndex + 1} / {sessionCandidates.length}</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${getStageLabel(currentWord.stage).color}`}>
                当前位于: {getStageLabel(currentWord.stage).name}
              </span>
            </div>
            <div className="h-1.5 w-full bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                style={{ width: `${((currentIndex + 1) / sessionCandidates.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Card Body */}
          <div className="relative rounded-3xl bg-[#fdfbf7] p-8 sm:p-12 shadow-2xl border border-amber-900/10 min-h-[380px] flex flex-col justify-between text-center space-y-6">
            {/* Top Stage Indicator */}
            <div className="flex items-center justify-between text-stone-400 text-xs">
              <span className="font-mono">Word #{currentIndex + 1}</span>
              <span className="font-serif italic text-amber-900/60">
                GoldList Distillation
              </span>
            </div>

            {/* Target Word */}
            <div className="space-y-4 my-auto">
              <div className="flex items-center justify-center space-x-3">
                <h1 className="font-serif font-bold text-3xl sm:text-5xl text-stone-900 tracking-tight">
                  {currentWord.text}
                </h1>
                <button
                  onClick={handlePlayAudio}
                  className="p-2.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 transition-all shadow-sm"
                  title="播放发音"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* Reveal or hidden translation */}
              {isRevealed ? (
                <div className="space-y-2 pt-4 transition-all">
                  <div className="text-lg sm:text-xl font-medium text-amber-950 font-sans">
                    {currentWord.translations.join('; ')}
                  </div>
                  <p className="text-xs text-stone-500">
                    若未自然记住，将自动蒸馏誊写至：<strong>{getStageLabel(currentWord.stage).next}</strong>
                  </p>
                </div>
              ) : (
                <div className="pt-6">
                  <button
                    onClick={() => setIsRevealed(true)}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-all shadow-sm"
                  >
                    <Eye className="w-4 h-4 text-stone-500" />
                    <span>查看中文释义 (或按空格键)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Decision Buttons */}
            <div className="pt-4 border-t border-stone-200/80">
              <div className="grid grid-cols-2 gap-4">
                {/* Option 1: Need Distillation */}
                <button
                  onClick={() => handleDecision(false)}
                  className="p-3.5 rounded-2xl border-2 border-stone-200 hover:border-orange-500 hover:bg-orange-50/50 text-stone-800 transition-all flex flex-col items-center space-y-1 text-center group"
                >
                  <span className="text-xs font-bold text-stone-900 group-hover:text-orange-900 flex items-center space-x-1">
                    <span>✍️ 未记住 / 继续蒸馏</span>
                  </span>
                  <span className="text-[10px] text-stone-500">
                    移入下一级象限 (按键盘 1 / ←)
                  </span>
                </button>

                {/* Option 2: Retained in Long-term Memory */}
                <button
                  onClick={() => handleDecision(true)}
                  className="p-3.5 rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 hover:bg-emerald-100 text-emerald-950 transition-all flex flex-col items-center space-y-1 text-center group"
                >
                  <span className="text-xs font-bold text-emerald-900 flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>自然记住了！</span>
                  </span>
                  <span className="text-[10px] text-emerald-700">
                    进入长时记忆金库 (按键盘 2 / →)
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Real-time distillation monitor pill */}
          <div className="text-center text-xs text-stone-400">
            <span>当前掌握: </span>
            <strong className="text-emerald-400">{masteredInSession}</strong>
            <span className="mx-2">|</span>
            <span>已蒸馏下一级: </span>
            <strong className="text-amber-400">{distilledInSession}</strong>
            <span className="mx-2">|</span>
            <span>蒸馏率: </span>
            <span className="text-stone-300 font-mono">{distillRate}%</span>
            {distillRate >= 60 && distillRate <= 80 && (
              <span className="ml-2 text-emerald-400 font-medium">✨ 完美黄金比例</span>
            )}
          </div>
        </div>
      ) : (
        /* Completed Summary Modal Card */
        <div className="w-full max-w-lg my-auto rounded-3xl bg-[#fdfbf7] p-8 sm:p-10 shadow-2xl border border-amber-900/10 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-600/30">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="font-serif font-bold text-2xl text-stone-900">
              {page.title} 蒸馏测试完成！
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
              恭喜你遵循黄金法则完成了一轮长时记忆沉淀。大脑正在无意识中固化这些神经元链接。
            </p>
          </div>

          {/* Summary Box */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs">
            <div className="p-3 bg-white rounded-xl text-center space-y-1">
              <span className="text-stone-500">进驻长时金库</span>
              <div className="text-2xl font-serif font-bold text-emerald-600">
                {masteredInSession} 词
              </div>
            </div>
            <div className="p-3 bg-white rounded-xl text-center space-y-1">
              <span className="text-stone-500">转入下一象限</span>
              <div className="text-2xl font-serif font-bold text-amber-700">
                {distilledInSession} 词
              </div>
            </div>
          </div>

          <p className="text-[11px] text-stone-500">
            转入下一象限的词汇已启动 <strong>{cooldownDays} 天无意识休眠期</strong>，期满后将自动进入下一级测试。
          </p>

          <button
            onClick={onFinish}
            className="w-full py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs shadow-md transition-colors"
          >
            返回黄金手账本
          </button>
        </div>
      )}

      {/* Bottom spacer */}
      <div className="h-6" />
    </div>
  );
};
