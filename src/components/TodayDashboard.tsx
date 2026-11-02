import React from 'react';
import { 
  Sparkles, 
  Flame, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  BookOpen, 
  Calendar,
  AlertCircle,
  HelpCircle,
  Play
} from 'lucide-react';
import { AppStats, GoldListPage, WordItem } from '../types/goldlist';

interface TodayDashboardProps {
  stats: AppStats;
  pages: GoldListPage[];
  words: WordItem[];
  cooldownDays: number;
  targetWeeks: number;
  dailyPagesGoal: number;
  onOpenNotebookPage: (pageId: number) => void;
  onStartDistillation: (pageId: number) => void;
  onOpenGuide: () => void;
}

export const TodayDashboard: React.FC<TodayDashboardProps> = ({
  stats,
  pages,
  words,
  cooldownDays,
  targetWeeks,
  dailyPagesGoal,
  onOpenNotebookPage,
  onStartDistillation,
  onOpenGuide,
}) => {
  const now = Date.now();

  // Find pages ready for distillation:
  // A page has words in Headlist, D1, or D2, and either:
  // 1) Words whose nextEligibleAt <= now
  // 2) Or if it's the first time and has words that can be reviewed
  const pagesWithStatus = pages.map((page) => {
    const pageWords = words.filter((w) => w.pageId === page.id);
    const nonMastered = pageWords.filter((w) => w.stage !== 'mastered');
    const eligibleWords = nonMastered.filter((w) => w.nextEligibleAt <= now);
    
    // Nearest eligible word time
    const nextTime = nonMastered.length > 0 
      ? Math.min(...nonMastered.map(w => w.nextEligibleAt)) 
      : 0;

    return {
      ...page,
      nonMasteredCount: nonMastered.length,
      eligibleCount: eligibleWords.length,
      nextEligibleTime: nextTime,
      isReady: eligibleWords.length > 0 && nonMastered.length > 0,
      isFullyMastered: pageWords.length > 0 && nonMastered.length === 0,
    };
  });

  const readyPages = pagesWithStatus.filter((p) => p.isReady);
  const restingPages = pagesWithStatus
    .filter((p) => !p.isReady && !p.isFullyMastered && p.nonMasteredCount > 0)
    .sort((a, b) => a.nextEligibleTime - b.nextEligibleTime);

  const completedPagesCount = pagesWithStatus.filter((p) => p.isFullyMastered).length;
  const inPipelineWords = stats.d1Count + stats.d2Count + stats.d3Count;
  const masteryPercentage = stats.totalWords > 0 
    ? Math.round((stats.masteredCount / stats.totalWords) * 100) 
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Strategy Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2c2824] via-[#3a3530] to-[#201d1a] text-white p-6 sm:p-10 shadow-xl border border-stone-800">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2 space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>黄金列表强化周期 · {targetWeeks} 周计划</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-amber-50 leading-tight">
              2,503 词长时记忆沉淀中心
            </h1>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              遵循 David James 黄金法则：不靠痛苦的短时硬背，利用 <strong>{cooldownDays} 天无意识沉淀</strong> 与 <strong>四象限蒸馏</strong>，将单词深深刻入你的永久长时记忆。
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenGuide}
                className="inline-flex items-center space-x-1.5 text-xs text-amber-300 hover:text-amber-200 underline underline-offset-4"
              >
                <HelpCircle className="w-4 h-4" />
                <span>了解黄金法则为什么能带来无压力记忆</span>
              </button>
            </div>
          </div>

          {/* Quick Progress Dial */}
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col items-center text-center">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="#f59e0b"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={2 * Math.PI * 48 * (1 - masteryPercentage / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-serif font-bold text-amber-300">{masteryPercentage}%</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-wider">永久掌握</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-stone-300">
              已巩固 <span className="font-bold text-amber-400">{stats.masteredCount}</span> / {stats.totalWords} 词
            </div>
          </div>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#fdfbf7] p-5 rounded-2xl border border-amber-900/10 shadow-sm flex flex-col justify-between">
          <div className="text-stone-500 text-xs font-medium flex items-center justify-between">
            <span>📜 原始列表 (Headlist)</span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">{stats.headlistCount}</span>
            <span className="text-xs text-stone-400">词</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">初始录入与浏览阶段</p>
        </div>

        <div className="bg-[#fdfbf7] p-5 rounded-2xl border border-amber-900/10 shadow-sm flex flex-col justify-between">
          <div className="text-stone-500 text-xs font-medium flex items-center justify-between">
            <span>⚡ 蒸馏演进池 (D1~D3)</span>
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">{inPipelineWords}</span>
            <span className="text-xs text-stone-400">词</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">铜/银/金三级层层精炼</p>
        </div>

        <div className="bg-[#fdfbf7] p-5 rounded-2xl border border-amber-900/10 shadow-sm flex flex-col justify-between">
          <div className="text-stone-500 text-xs font-medium flex items-center justify-between">
            <span>💎 终极长时金库 (Mastered)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700">{stats.masteredCount}</span>
            <span className="text-xs text-stone-400">词</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">自然吸收，永不遗忘</p>
        </div>

        <div className="bg-[#fdfbf7] p-5 rounded-2xl border border-amber-900/10 shadow-sm flex flex-col justify-between">
          <div className="text-stone-500 text-xs font-medium flex items-center justify-between">
            <span>📖 封顶完成页数</span>
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">{completedPagesCount}</span>
            <span className="text-xs text-stone-400">/ {pages.length} 页</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">已完全蒸馏巩固的手账页</p>
        </div>
      </div>

      {/* Main Action Section: Ready to Distill & Today's Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Action Queue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Ready for Distillation Today */}
          <div className="bg-[#fdfbf7] rounded-3xl p-6 sm:p-8 border border-amber-900/10 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <h2 className="text-xl font-serif font-bold text-stone-900">
                    今日可蒸馏列表（Ready to Distill）
                  </h2>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  沉淀期已满的页面，此时短时记忆已消散，正是检验长时记忆留存的最佳时刻！
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-900 font-bold text-xs rounded-full border border-amber-200">
                {readyPages.length} 页就绪
              </span>
            </div>

            {readyPages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {readyPages.slice(0, 6).map((page) => (
                  <div
                    key={page.id}
                    className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80 hover:border-amber-400 transition-all shadow-sm flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-serif font-bold text-stone-900 text-base">
                          {page.title}
                        </div>
                        <div className="text-xs text-amber-800 mt-0.5">
                          {page.eligibleCount} 个词汇等待提炼蒸馏
                        </div>
                      </div>
                      <span className="p-1.5 bg-amber-200 text-amber-900 rounded-lg text-xs font-semibold">
                        就绪
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <button
                        onClick={() => onStartDistillation(page.id)}
                        className="flex-1 py-2 px-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs shadow flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>开始本页蒸馏</span>
                      </button>
                      <button
                        onClick={() => onOpenNotebookPage(page.id)}
                        className="py-2 px-3 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 font-medium text-xs transition-colors"
                      >
                        查看手账
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 px-4 bg-stone-50/60 rounded-2xl border border-dashed border-stone-200 space-y-3">
                <Clock className="w-8 h-8 text-stone-400 mx-auto" />
                <h3 className="font-medium text-stone-700 text-sm">
                  今日暂无到期的蒸馏任务
                </h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  列表正在严格经历潜意识深度沉淀期。你可以选择新开今日手账页，或者在设置中调整为加速模式。
                </p>
                {restingPages.length > 0 && (
                  <div className="pt-2">
                    <button
                      onClick={() => onStartDistillation(restingPages[0].id)}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-medium transition-colors"
                    >
                      <span>提前演练下一页（{restingPages[0].title}）</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section: Gold List Method 4-Stage Funnel */}
          <div className="bg-[#fdfbf7] rounded-3xl p-6 sm:p-8 border border-amber-900/10 shadow-sm space-y-4">
            <h2 className="text-lg font-serif font-bold text-stone-900">
              四象限蒸馏转化漏斗
            </h2>
            <div className="space-y-3">
              {[
                { label: '📜 原始列表 (Headlist)', count: stats.headlistCount, color: 'bg-amber-600', desc: '100% 原始输入' },
                { label: '🥉 第1次蒸馏 (D1 铜级)', count: stats.d1Count, color: 'bg-orange-500', desc: '未记住的 ~70% 词汇' },
                { label: '🥈 第2次蒸馏 (D2 银级)', count: stats.d2Count, color: 'bg-slate-500', desc: '再精炼的 ~70% 词汇' },
                { label: '🥇 第3次蒸馏 (D3 金级)', count: stats.d3Count, color: 'bg-yellow-500', desc: '高难度深层核心词' },
                { label: '💎 永久长时金库 (Mastered)', count: stats.masteredCount, color: 'bg-emerald-600', desc: '经休眠检验的终极巩固' },
              ].map((tier, idx) => {
                const pct = stats.totalWords > 0 ? (tier.count / stats.totalWords) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-stone-800">{tier.label}</span>
                      <span className="text-stone-500">
                        <strong className="text-stone-900">{tier.count}</strong> 词 ({Math.round(pct)}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-stone-200/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${tier.color} transition-all duration-700 rounded-full`}
                        style={{ width: `${Math.max(pct, tier.count > 0 ? 1 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Daily Recommendation & Next Resting Pages */}
        <div className="space-y-6">
          {/* Today's Recommended Study Plan */}
          <div className="bg-[#fdfbf7] rounded-3xl p-6 border border-amber-900/10 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-serif font-bold text-stone-900">今日推进建议</h2>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              为了在 <strong>{targetWeeks} 周内</strong> 完成 2,503 词的深度巩固，建议的每日节奏为：
            </p>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-amber-950">
                <span>📖 开启新页</span>
                <span>建议每天 {dailyPagesGoal} 页 (~{dailyPagesGoal * 20} 词)</span>
              </div>
              <p className="text-stone-600 text-[11px]">
                翻开未开始的手账页，跟读发音并手抄/静心阅读，不给自己背诵压力。
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-emerald-950">
                <span>⚡ 蒸馏成熟页</span>
                <span>今日待蒸馏 {readyPages.length} 页</span>
              </div>
              <p className="text-stone-600 text-[11px]">
                及时处理已过沉淀期的页面，把没有自然记住的词转录到下一象限。
              </p>
            </div>

            <button
              onClick={() => {
                // Find first unreviewed page
                const firstFresh = pages.find(p => {
                  const pw = words.filter(w => w.pageId === p.id);
                  return pw.every(w => w.reviewCount === 0);
                });
                onOpenNotebookPage(firstFresh ? firstFresh.id : 1);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-black text-white font-medium text-xs shadow flex items-center justify-center space-x-2 transition-all"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>翻开黄金手账本</span>
            </button>
          </div>

          {/* Resting Pages Timeline */}
          <div className="bg-[#fdfbf7] rounded-3xl p-6 border border-amber-900/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="font-serif font-bold text-stone-900 text-sm">潜意识沉淀中的页面</h3>
              </div>
              <span className="text-xs text-stone-400">{restingPages.length} 页</span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 text-xs">
              {restingPages.length > 0 ? (
                restingPages.slice(0, 5).map((p) => {
                  const msLeft = Math.max(0, p.nextEligibleTime - now);
                  const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
                  return (
                    <div
                      key={p.id}
                      onClick={() => onOpenNotebookPage(p.id)}
                      className="p-3 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200/80 cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-stone-800">{p.title}</div>
                        <div className="text-[10px] text-stone-500">剩余 {p.nonMasteredCount} 词需蒸馏</div>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md">
                        {daysLeft > 0 ? `还剩 ${daysLeft} 天` : '即将成熟'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-stone-400 text-xs">
                  暂无休眠中的页面
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
