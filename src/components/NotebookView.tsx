import React, { useState, useEffect } from 'react';
import { isDue } from '../services/db';
import { 
  Volume2, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  Play, 
  HelpCircle,
  Search,
  Filter,
  Printer,
  Star,
  FileText,
  Headphones,
  Bookmark
} from 'lucide-react';
import { GoldListPage, WordItem } from '../types/goldlist';
import { sound } from '../services/sound';

interface NotebookViewProps {
  currentPageId: number;
  pages: GoldListPage[];
  words: WordItem[];
  cooldownDays: number;
  onSelectPage: (pageId: number) => void;
  onStartDistillation: (pageId: number) => void;
  onStartPractice?: (pageId: number) => void;
  onToggleStar?: (wordId: string) => void;
  onUpdateNotes?: (wordId: string, notes: string) => void;
  onLaunchPlayer?: (pageId: number) => void;
  onOpenGuide: () => void;
}

export const NotebookView: React.FC<NotebookViewProps> = ({
  currentPageId,
  pages,
  words,
  cooldownDays,
  onSelectPage,
  onStartDistillation,
  onStartPractice,
  onToggleStar,
  onUpdateNotes,
  onLaunchPlayer,
  onOpenGuide,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'needs-distill' | 'mastered'>('all');
  const [pageSearch, setPageSearch] = useState('');
  const [editingNotesWordId, setEditingNotesWordId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');
  const now = Date.now();

  const currentPage = pages.find((p) => p.id === currentPageId) || pages[0];
  const pageWords = words.filter((w) => w.pageId === currentPageId);

  // Group page words by their current stage
  const headlistWords = pageWords.filter((w) => w.stage === 'headlist');
  const d1Words = pageWords.filter((w) => w.stage === 'd1');
  const d2Words = pageWords.filter((w) => w.stage === 'd2');
  const d3Words = pageWords.filter((w) => w.stage === 'd3');
  const masteredWords = pageWords.filter((w) => w.stage === 'mastered');

  // Cooldown status for the page
  const nonMastered = pageWords.filter((w) => w.stage !== 'mastered');
  const eligibleWords = nonMastered.filter((w) => isDue(w, pages.find((p) => p.id === currentPageId), now));
  const nearestTime = nonMastered.length > 0 ? Math.min(...nonMastered.map(w => w.nextEligibleAt)) : 0;
  const isReady = eligibleWords.length > 0 && nonMastered.length > 0;
  const daysLeft = Math.max(0, Math.ceil((nearestTime - now) / (24 * 60 * 60 * 1000)));

  // Filtered pages list for quick selector
  const filteredPages = pages.filter((p) => {
    const pw = words.filter((w) => w.pageId === p.id);
    const pNonMastered = pw.filter((w) => w.stage !== 'mastered');
    const pEligible = pNonMastered.filter((w) => isDue(w, p, now));
    
    if (filterMode === 'needs-distill') {
      return pEligible.length > 0;
    }
    if (filterMode === 'mastered') {
      return pw.length > 0 && pNonMastered.length === 0;
    }
    return true;
  });

  const handlePlayWord = (word: WordItem, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playPronunciation(word.text, word.audioURL);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Controls: Page Navigation & Switcher */}
      <div className="bg-[#fdfbf7] p-4 rounded-2xl border border-amber-900/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Prev / Next buttons */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-between md:justify-start">
          <button
            onClick={() => onSelectPage(Math.max(1, currentPageId - 1))}
            disabled={currentPageId <= 1}
            className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent text-stone-700 transition-colors flex items-center space-x-1 text-xs font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">上一页</span>
          </button>

          <div className="flex items-center space-x-2">
            <span className="font-serif font-bold text-lg text-stone-900">
              {currentPage?.title || `第 ${currentPageId} 页`}
            </span>
            <span className="text-xs text-stone-400">/ 共 {pages.length} 页</span>
          </div>

          <button
            onClick={() => onSelectPage(Math.min(pages.length, currentPageId + 1))}
            disabled={currentPageId >= pages.length}
            className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent text-stone-700 transition-colors flex items-center space-x-1 text-xs font-medium"
          >
            <span className="hidden sm:inline">下一页</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Page status pill & Action */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
          {nonMastered.length === 0 && pageWords.length > 0 ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>本页 20 词已全部进驻长时记忆金库！</span>
            </span>
          ) : isReady ? (
            <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{eligibleWords.length} 词已满休眠期，可蒸馏</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 text-xs font-medium border border-stone-200">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>潜意识沉淀中（还剩 {daysLeft} 天）</span>
            </span>
          )}

          {/* Continuous Player button */}
          {onLaunchPlayer && (
            <button
              onClick={() => onLaunchPlayer(currentPageId)}
              className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-semibold text-xs flex items-center space-x-1.5 transition-all shadow-sm"
              title="连续自动朗读播放本页 20 词，适合闭目磨耳朵或边听边手写"
            >
              <Headphones className="w-3.5 h-3.5 text-amber-700" />
              <span>随身听连播</span>
            </button>
          )}

          {/* Print A4 worksheet button */}
          <button
            onClick={() => window.print()}
            className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 text-xs flex items-center space-x-1 transition-all shadow-sm"
            title="打印或导出本页为标准 A4 四象限纸模，用于真实纸笔手抄"
          >
            <Printer className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden sm:inline">打印 A4 手账</span>
          </button>

          {/* Practice button */}
          {onStartPractice && (
            <button
              onClick={() => onStartPractice(currentPageId)}
              className="py-2 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 font-medium text-xs flex items-center space-x-1.5 transition-all shadow-sm"
              title="针对本页单词进行听音拼写或手写练习"
            >
              <span>✍️ 练习本页</span>
            </button>
          )}

          {nonMastered.length > 0 && (
            <button
              onClick={() => onStartDistillation(currentPageId)}
              className="py-2 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs shadow-md shadow-amber-900/10 flex items-center space-x-1.5 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>开启沉浸蒸馏</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Jump Page Strip */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 text-xs scrollbar-thin">
        <span className="text-stone-400 font-medium whitespace-nowrap pl-1">快速翻页:</span>
        {pages.slice(0, 30).map((p) => {
          const isSelected = p.id === currentPageId;
          const pw = words.filter((w) => w.pageId === p.id);
          const pNonMastered = pw.filter((w) => w.stage !== 'mastered');
          const isDone = pw.length > 0 && pNonMastered.length === 0;

          return (
            <button
              key={p.id}
              onClick={() => onSelectPage(p.id)}
              className={`px-3 py-1.5 rounded-lg font-mono font-medium whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-amber-700 text-white shadow-sm'
                  : isDone
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              P{p.id} {isDone && '✓'}
            </button>
          );
        })}
        {pages.length > 30 && (
          <div className="flex items-center space-x-1">
            <span className="text-stone-400">...</span>
            <input
              type="number"
              min="1"
              max={pages.length}
              placeholder="跳转页码"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = parseInt((e.target as HTMLInputElement).value);
                  if (val >= 1 && val <= pages.length) {
                    onSelectPage(val);
                  }
                }
              }}
              className="w-20 px-2 py-1 text-xs border border-stone-300 rounded-lg bg-white"
            />
          </div>
        )}
      </div>

      {/* THE CLASSIC 4-QUADRANT NOTEBOOK CANVAS */}
      <div className="relative rounded-3xl bg-[#fdfbf7] border-2 border-[#dcd3c3] shadow-notebook-lg overflow-hidden transition-all">
        {/* 4 Quadrants Grid: gap-px exposes the background as the dividers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-stone-300/80">
          {/* ================= QUADRANT A: TOP LEFT (HEADLIST) ================= */}
          <div className="p-6 sm:p-8 space-y-4 bg-[#fcfaf5] min-h-[280px] lg:min-h-[500px]">
            {/* Header of Quadrant A */}
            <div className="flex items-center justify-between border-b-2 border-amber-800/30 pb-3.5">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-serif font-bold text-lg sm:text-xl text-amber-950">
                    象限 A · 原始列表 (Headlist)
                  </span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-mono text-xs font-bold border border-amber-200">
                    20 词
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  初始接触 · 纯净手抄与跟读发音，不施加死记压力
                </p>
              </div>
              <span className="text-xs text-amber-900/60 font-serif italic">Top Left</span>
            </div>

            {/* Word list: Perfectly aligned ruled lines */}
            <div className="divide-y divide-amber-900/10">
              {pageWords.map((word, index) => {
                const isMastered = word.stage === 'mastered';
                const isDistilledAway = word.stage !== 'headlist' && !isMastered;

                return (
                  <div
                    key={word.id}
                    className={`flex items-start justify-between py-2.5 px-2 rounded-lg transition-all group ${
                      isMastered
                        ? 'bg-emerald-50/50 text-emerald-950'
                        : isDistilledAway
                        ? 'opacity-65 bg-stone-100/30 line-through text-stone-400'
                        : 'hover:bg-amber-100/40 text-stone-900'
                    }`}
                  >
                    <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                      <span className="font-mono text-xs font-semibold text-stone-400 w-5 flex-shrink-0 pt-1">
                        {index + 1}.
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-serif font-bold text-stone-900 text-base sm:text-lg tracking-normal">
                            {word.text}
                          </span>
                          <button
                            onClick={(e) => handlePlayWord(word, e)}
                            className="text-amber-700/80 hover:text-amber-900 p-2 hover:bg-amber-200/50 rounded-full transition-colors"
                            title="播放原声发音"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>

                          {/* Star toggle */}
                          {onToggleStar && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleStar(word.id);
                              }}
                              className="p-2 hover:bg-amber-100 rounded-full transition-colors"
                              title={word.isStarred ? '取消重点生词标记' : '标记为重点生词 (Star)'}
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  word.isStarred ? 'fill-amber-400 text-amber-500' : 'text-stone-300 hover:text-amber-500'
                                }`}
                              />
                            </button>
                          )}

                          {/* Custom note button */}
                          {onUpdateNotes && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingNotesWordId(editingNotesWordId === word.id ? null : word.id);
                                setTempNote(word.notes || '');
                              }}
                              className="p-1 hover:bg-amber-100 rounded-full transition-colors"
                              title="添加或修改我的私家助记笔记/例句"
                            >
                              <FileText
                                className={`w-3.5 h-3.5 ${
                                  word.notes ? 'text-amber-700 fill-amber-100' : 'text-stone-300 hover:text-stone-600'
                                }`}
                              />
                            </button>
                          )}
                        </div>

                        <div className="text-xs sm:text-sm text-stone-600 font-sans leading-relaxed">
                          {word.translations.join('； ')}
                        </div>

                        {/* Existing note view */}
                        {word.notes && editingNotesWordId !== word.id && (
                          <div className="text-xs text-amber-950 bg-amber-50/90 px-2.5 py-1 rounded-lg border border-amber-200/90 font-serif italic flex items-center justify-between">
                            <span>📝 <strong>助记/例句:</strong> {word.notes}</span>
                          </div>
                        )}

                        {/* Editing note form */}
                        {editingNotesWordId === word.id && (
                          <div className="mt-2 p-2.5 bg-white rounded-xl border-2 border-amber-400 shadow-md space-y-2">
                            <textarea
                              rows={2}
                              value={tempNote}
                              onChange={(e) => setTempNote(e.target.value)}
                              placeholder="写下属于你的例句短语或助记口诀..."
                              className="w-full text-xs p-2 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20 text-stone-800"
                            />
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => setEditingNotesWordId(null)}
                                className="px-2.5 py-1 text-xs text-stone-500 hover:bg-stone-100 rounded-lg"
                              >
                                取消
                              </button>
                              <button
                                onClick={() => {
                                  onUpdateNotes?.(word.id, tempNote.trim());
                                  setEditingNotesWordId(null);
                                }}
                                className="px-3 py-1 bg-amber-700 text-white text-xs font-medium rounded-lg hover:bg-amber-800"
                              >
                                保存笔记
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 pl-2 pt-1">
                      {isMastered && (
                        <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                          长时掌握 ✓
                        </span>
                      )}
                      {word.stage === 'd1' && (
                        <span className="text-[11px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-medium border border-orange-200">
                          铜级 →
                        </span>
                      )}
                      {word.stage === 'd2' && (
                        <span className="text-[11px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-medium border border-slate-300">
                          银级 →
                        </span>
                      )}
                      {word.stage === 'd3' && (
                        <span className="text-[11px] bg-yellow-100 text-yellow-900 px-2 py-0.5 rounded-full font-medium border border-yellow-300">
                          金级 →
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================= QUADRANT B: TOP RIGHT (1st DISTILLATION / BRONZE) ================= */}
          <div className="p-6 sm:p-8 space-y-4 bg-[#fcfaf5] min-h-[280px] lg:min-h-[500px]">
            {/* Header of Quadrant B */}
            <div className="flex items-center justify-between border-b-2 border-orange-800/30 pb-3.5">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-serif font-bold text-lg sm:text-xl text-orange-950">
                    象限 B · 铜级蒸馏 (1st Distillation)
                  </span>
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded font-mono text-xs font-bold border border-orange-200">
                    目标 ~14 词
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  休眠后第 1 次提炼 · 过滤留存 ~70% 未自然记住词汇
                </p>
              </div>
              <span className="text-xs text-orange-900/60 font-serif italic">Top Right</span>
            </div>

            {/* List */}
            {d1Words.length > 0 || pageWords.some(w => ['d2', 'd3'].includes(w.stage)) ? (
              <div className="divide-y divide-amber-900/10">
                {pageWords
                  .filter((w) => ['d1', 'd2', 'd3'].includes(w.stage) || (w.stage === 'mastered' && w.reviewCount >= 1))
                  .map((word, idx) => (
                    <div
                      key={word.id}
                      className="flex items-start justify-between py-2.5 px-2 rounded-lg hover:bg-orange-50/60 transition-all group"
                    >
                      <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                        <span className="font-mono text-xs font-semibold text-orange-400 w-5 flex-shrink-0 pt-1">
                          {idx + 1}.
                        </span>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-serif font-bold text-stone-900 text-base sm:text-lg">
                              {word.text}
                            </span>
                            <button
                              onClick={(e) => handlePlayWord(word, e)}
                              className="text-orange-700/80 hover:text-orange-900 p-1 hover:bg-orange-200/50 rounded-full"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                            {word.translations.join('； ')}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 pl-2 pt-1">
                        {word.stage === 'mastered' ? (
                          <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">已掌握</span>
                        ) : word.stage === 'd2' ? (
                          <span className="text-[11px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-medium">转入银级</span>
                        ) : (
                          <span className="text-[11px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-medium">铜级留存</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-2 border-2 border-dashed border-stone-200/80 rounded-2xl">
                <Clock className="w-8 h-8 text-stone-300" />
                <p className="text-xs sm:text-sm font-serif italic text-stone-500 max-w-xs">
                  休眠期结束并完成第 1 次蒸馏后，未自然记住的 70% 词汇将工整誊写至此。
                </p>
              </div>
            )}
          </div>

          {/* ================= QUADRANT D: BOTTOM LEFT (3rd DISTILLATION / GOLD) ================= */}
          <div className="p-6 sm:p-8 space-y-4 bg-[#fcfaf5] min-h-[280px] lg:min-h-[500px]">
            {/* Header of Quadrant D */}
            <div className="flex items-center justify-between border-b-2 border-yellow-800/30 pb-3.5">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-serif font-bold text-lg sm:text-xl text-yellow-950">
                    象限 D · 金级蒸馏 (3rd Distillation)
                  </span>
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-900 rounded font-mono text-xs font-bold border border-yellow-300">
                    目标 ~7 词
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  休眠后第 3 次精炼 · 高抗遗忘终极攻坚池
                </p>
              </div>
              <span className="text-xs text-yellow-900/60 font-serif italic">Bottom Left</span>
            </div>

            {/* List */}
            {d3Words.length > 0 || pageWords.some(w => w.stage === 'mastered' && w.reviewCount >= 3) ? (
              <div className="divide-y divide-amber-900/10">
                {pageWords
                  .filter((w) => w.stage === 'd3' || (w.stage === 'mastered' && w.reviewCount >= 3))
                  .map((word, idx) => (
                    <div
                      key={word.id}
                      className="flex items-start justify-between py-2.5 px-2 rounded-lg hover:bg-yellow-50/60 transition-all group"
                    >
                      <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                        <span className="font-mono text-xs font-semibold text-yellow-600 w-5 flex-shrink-0 pt-1">
                          {idx + 1}.
                        </span>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-serif font-bold text-stone-900 text-base sm:text-lg">
                              {word.text}
                            </span>
                            <button
                              onClick={(e) => handlePlayWord(word, e)}
                              className="text-yellow-700/80 hover:text-yellow-900 p-1 hover:bg-yellow-200/50 rounded-full"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                            {word.translations.join('； ')}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 pl-2 pt-1">
                        {word.stage === 'mastered' ? (
                          <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">深度巩固</span>
                        ) : (
                          <span className="text-[11px] bg-yellow-100 text-yellow-900 px-2 py-0.5 rounded-full font-medium">金级攻坚</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-2 border-2 border-dashed border-stone-200/80 rounded-2xl">
                <Sparkles className="w-8 h-8 text-stone-300" />
                <p className="text-xs sm:text-sm font-serif italic text-stone-500 max-w-xs">
                  历经两次休眠蒸馏后，最具挑战性的少数高难度词汇将入驻金级象限。
                </p>
              </div>
            )}
          </div>

          {/* ================= QUADRANT C: BOTTOM RIGHT (2nd DISTILLATION / SILVER) ================= */}
          <div className="p-6 sm:p-8 space-y-4 bg-[#fcfaf5] min-h-[280px] lg:min-h-[500px]">
            {/* Header of Quadrant C */}
            <div className="flex items-center justify-between border-b-2 border-slate-700/30 pb-3.5">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-serif font-bold text-lg sm:text-xl text-slate-900">
                    象限 C · 银级蒸馏 (2nd Distillation)
                  </span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-mono text-xs font-bold border border-slate-300">
                    目标 ~10 词
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  休眠后第 2 次精炼 · 再次提取 ~70% 难词
                </p>
              </div>
              <span className="text-xs text-slate-900/60 font-serif italic">Bottom Right</span>
            </div>

            {/* List */}
            {d2Words.length > 0 || pageWords.some(w => ['d3'].includes(w.stage) || (w.stage === 'mastered' && w.reviewCount >= 2)) ? (
              <div className="divide-y divide-amber-900/10">
                {pageWords
                  .filter((w) => ['d2', 'd3'].includes(w.stage) || (w.stage === 'mastered' && w.reviewCount >= 2))
                  .map((word, idx) => (
                    <div
                      key={word.id}
                      className="flex items-start justify-between py-2.5 px-2 rounded-lg hover:bg-slate-100/60 transition-all group"
                    >
                      <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                        <span className="font-mono text-xs font-semibold text-slate-500 w-5 flex-shrink-0 pt-1">
                          {idx + 1}.
                        </span>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-serif font-bold text-stone-900 text-base sm:text-lg">
                              {word.text}
                            </span>
                            <button
                              onClick={(e) => handlePlayWord(word, e)}
                              className="text-slate-700/80 hover:text-slate-900 p-1 hover:bg-slate-200/50 rounded-full"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                            {word.translations.join('； ')}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 pl-2 pt-1">
                        {word.stage === 'mastered' ? (
                          <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">已掌握</span>
                        ) : word.stage === 'd3' ? (
                          <span className="text-[11px] bg-yellow-100 text-yellow-900 px-2 py-0.5 rounded-full font-medium">转入金级</span>
                        ) : (
                          <span className="text-[11px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-medium">银级留存</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-2 border-2 border-dashed border-stone-200/80 rounded-2xl">
                <Sparkles className="w-8 h-8 text-stone-300" />
                <p className="text-xs sm:text-sm font-serif italic text-stone-500 max-w-xs">
                  第二轮休眠后，从铜级列表提炼出难点单词，进入银级象限。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
