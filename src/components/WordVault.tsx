import React, { useState, useMemo } from 'react';
import { Search, Volume2, Filter, ExternalLink, Sparkles, CheckCircle2, BookOpen } from 'lucide-react';
import { WordItem, DistillationStage } from '../types/goldlist';
import { sound } from '../services/sound';

interface WordVaultProps {
  words: WordItem[];
  onGoToPage: (pageId: number) => void;
}

export const WordVault: React.FC<WordVaultProps> = ({ words, onGoToPage }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<DistillationStage | 'all'>('all');
  const [visibleCount, setVisibleCount] = useState(50);

  // Filtered list
  const filteredWords = useMemo(() => {
    let result = words;
    if (stageFilter !== 'all') {
      result = result.filter((w) => w.stage === stageFilter);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (w) =>
          w.text.toLowerCase().includes(q) ||
          w.translations.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [words, stageFilter, searchTerm]);

  const handlePlay = (word: WordItem, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playPronunciation(word.text, word.audioURL);
  };

  const getStageBadge = (stage: DistillationStage) => {
    switch (stage) {
      case 'mastered':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">长时金库</span>;
      case 'headlist':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-900">原始列表</span>;
      case 'd1':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-800">铜级 D1</span>;
      case 'd2':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-800">银级 D2</span>;
      case 'd3':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-900">金级 D3</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 flex items-center space-x-2">
            <span>2,503 词汇金库检索</span>
            <span className="text-xs px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full font-mono">
              {words.length} 词
            </span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            实时检索你在 Bilingo 中学过的每一个单词，听取原生发音并定位其在手账本中的位置。
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#fdfbf7] p-4 rounded-2xl border border-amber-900/10 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索英文单词或中文释义 (如 shiny, fountain, 喷泉)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setVisibleCount(50);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-800"
            />
          </div>

          {/* Stage Filters */}
          <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
            {[
              { id: 'all', label: '全部' },
              { id: 'mastered', label: '💎 永久金库' },
              { id: 'headlist', label: '📜 原始' },
              { id: 'd1', label: '🥉 铜级' },
              { id: 'd2', label: '🥈 银级' },
              { id: 'd3', label: '🥇 金级' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setStageFilter(f.id as DistillationStage | 'all');
                  setVisibleCount(50);
                }}
                className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
                  stageFilter === f.id
                    ? 'bg-amber-700 text-white font-medium shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
          <span>共找到 <strong className="text-stone-800">{filteredWords.length}</strong> 个词汇</span>
        </div>
      </div>

      {/* Word Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredWords.slice(0, visibleCount).map((word) => (
          <div
            key={word.id}
            className="p-4 bg-[#fdfbf7] rounded-2xl border border-amber-900/10 hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1 pr-2">
                <div className="flex items-center space-x-2">
                  <span className="font-serif font-bold text-stone-900 text-base">
                    {word.text}
                  </span>
                  <button
                    onClick={(e) => handlePlay(word, e)}
                    className="p-1 rounded-full text-amber-700 hover:text-amber-900 hover:bg-amber-100/50 transition-colors"
                    title="播放发音"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-stone-600 line-clamp-2">
                  {word.translations.join('; ')}
                </div>
              </div>

              <div className="flex-shrink-0">
                {getStageBadge(word.stage)}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[11px] text-stone-400">
              <span>复习次数: {word.reviewCount} 次</span>
              <button
                onClick={() => onGoToPage(word.pageId)}
                className="text-amber-700 hover:text-amber-900 font-medium flex items-center space-x-1"
              >
                <span>前往第 {word.pageId} 页</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {visibleCount < filteredWords.length && (
        <div className="text-center pt-4">
          <button
            onClick={() => setVisibleCount((prev) => prev + 60)}
            className="px-6 py-2.5 rounded-xl bg-white border border-stone-200 hover:border-amber-400 text-stone-700 font-medium text-xs shadow-sm transition-all"
          >
            加载更多 ({visibleCount} / {filteredWords.length})
          </button>
        </div>
      )}
    </div>
  );
};
