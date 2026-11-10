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
import { WordItem, GoldListPage, WordBreakdown } from '../types/goldlist';
import { sound } from '../services/sound';
import { db } from '../services/db';
import { HandwritingBoard } from './HandwritingBoard';
import confetti from 'canvas-confetti';

interface PracticeArenaProps {
  words: WordItem[];
  pages: GoldListPage[];
  initialPageId?: number;
  onGoToPage?: (pageId: number) => void;
}

type PracticeMode = 'spelling' | 'handwriting';
type PracticeScope = 'page' | 'pipeline' | 'starred' | 'all';

const getScopeWords = (words: WordItem[], pageId: number, scope: PracticeScope): WordItem[] => {
  if (scope === 'page') {
    return words.filter((w) => w.pageId === pageId);
  } else if (scope === 'starred') {
    const starred = words.filter((w) => w.isStarred);
    return starred.length > 0 ? starred : words.filter((w) => w.pageId === pageId);
  } else if (scope === 'pipeline') {
    return words.filter((w) => ['headlist', 'd1', 'd2', 'd3'].includes(w.stage));
  }
  return words;
};

// Targeted practice: skip words already spelled right on first try; if all are passed, use the full scope
const buildRound = (scopeWords: WordItem[], scope: PracticeScope): WordItem[] => {
  const unpassed = scopeWords.filter((w) => !w.practicePassed);
  const pool = unpassed.length > 0 ? unpassed : scopeWords;
  return scope === 'pipeline' || scope === 'all' ? pool.slice(0, 30) : pool;
};

export const PracticeArena: React.FC<PracticeArenaProps> = ({
  words,
  pages,
  initialPageId = 1,
  onGoToPage,
}) => {
  const [selectedPageId, setSelectedPageId] = useState<number>(initialPageId);
  const [mode, setMode] = useState<PracticeMode>('spelling');
  const [filterScope, setFilterScope] = useState<'page' | 'pipeline' | 'starred' | 'all'>('page');

  const scopeWords = getScopeWords(words, selectedPageId, filterScope);
  const passedCount = scopeWords.filter((w) => w.practicePassed).length;
  const allPassed = scopeWords.length > 0 && passedCount === scopeWords.length;

  // Round word list, rebuilt only on restart: passing a word mid-round must not shrink the list
  const [roundId, setRoundId] = useState(0);
  const practiceWords = React.useMemo(
    () => buildRound(getScopeWords(words, selectedPageId, filterScope), filterScope),
    [roundId]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentWord = practiceWords[currentIndex] || practiceWords[0];

  // Spelling state
  const [userInput, setUserInput] = useState('');
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [hintCount, setHintCount] = useState(0);
  const [missed, setMissed] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [historyResults, setHistoryResults] = useState<{ word: WordItem; passed: boolean }[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [breakdowns, setBreakdowns] = useState<Record<string, WordBreakdown> | null>(null);
  useEffect(() => {
    fetch('/data/breakdowns.json')
      .then((res) => res.json())
      .then(setBreakdowns)
      .catch((err) => console.error('Failed to load breakdowns:', err));
  }, []);
  const breakdown = currentWord && breakdowns?.[currentWord.text.trim().toLowerCase()];

  const handleTogglePeek = () => {
    if (!isAnswerRevealed) setMissed(true);
    setIsAnswerRevealed((prev) => !prev);
  };

  // Esc peeks at the answer in spelling mode
  useEffect(() => {
    if (mode !== 'spelling') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleTogglePeek();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mode, isAnswerRevealed]);

  // Reset states on word change
  useEffect(() => {
    if (!currentWord) return;
    setUserInput('');
    setIsAnswerRevealed(false);
    setFeedback('idle');
    setHintCount(0);
    setMissed(false);
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
      db.setPracticePassed(currentWord.id, !missed && hintCount === 0 && !isAnswerRevealed);

      setTimeout(() => {
        handleNextWord();
      }, 1100);
    } else {
      setFeedback('incorrect');
      setMissed(true);
      db.setPracticePassed(currentWord.id, false);
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

  const handleRestart = () => {
    setRoundId((prev) => prev + 1);
    setCurrentIndex(0);
    setIsFinished(false);
    setScore({ correct: 0, total: 0 });
    setHistoryResults([]);
  };

  const handleResetProgress = async () => {
    if (!window.confirm(`确定重置本范围 ${scopeWords.length} 个词的练习进度吗？`)) return;
    await db.resetPracticeProgress(scopeWords.map((w) => w.id));
    handleRestart();
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
            <button
              onClick={() => {
                setFilterScope('starred');
                handleRestart();
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterScope === 'starred'
                  ? 'bg-amber-700 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              ⭐ 重点生词
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
          {passedCount > 0 && (
            <div className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>
                {allPassed
                  ? '本范围词已全部一次拼对，本轮按全部词重新练习。'
                  : `已启用针对性练习：跳过 ${passedCount} 个已一次拼对的词，本轮练习 ${practiceWords.length} 个。`}
              </span>
              <button
                onClick={handleResetProgress}
                className="ml-auto px-2.5 py-1 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 font-medium transition-colors"
              >
                重置练习进度
              </button>
            </div>
          )}

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

              {/* Word breakdown: shown after a miss or a peek */}
              {missed && breakdown && (
                <div className="max-w-md mx-auto p-4 bg-amber-50 rounded-2xl border border-amber-200 text-left space-y-3">
                  <div className="text-xs font-semibold text-amber-800">拆词记忆</div>
                  {breakdown.parts.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      {breakdown.parts.map((part, i) => (
                        <span key={i} className="px-2.5 py-1 bg-white rounded-lg border border-amber-200 text-xs">
                          <strong className="font-serif text-sm text-stone-900">{part.text}</strong>
                          <span className="ml-1 text-stone-600">{part.meaning}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-stone-800">{breakdown.tip}</p>
                </div>
              )}

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
                    onClick={handleTogglePeek}
                    className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium transition-colors"
                  >
                    {isAnswerRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{isAnswerRevealed ? '隐藏答案 (Esc)' : '偷看答案 (Esc)'}</span>
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

          {/* MODE 2: Handwriting Whiteboard powered by perfect-freehand & MyScript iinkTS */}
          {mode === 'handwriting' && (
            <div className="space-y-4">
              <HandwritingBoard
                targetWord={currentWord.text}
                translations={currentWord.translations}
                audioURL={currentWord.audioURL}
                onSuccess={handleNextWord}
              />

              {/* Navigation Bar */}
              <div className="flex items-center justify-between pt-1 px-1">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 disabled:opacity-40 text-stone-700 text-xs font-medium flex items-center space-x-1 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>上一个词</span>
                </button>

                <div className="text-xs text-stone-500 font-mono">
                  {currentIndex + 1} / {practiceWords.length}
                </div>

                <button
                  onClick={handleNextWord}
                  className="px-6 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-md flex items-center space-x-1 transition-colors"
                >
                  <span>下一个词</span>
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
