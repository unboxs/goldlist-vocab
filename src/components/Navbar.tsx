import React from 'react';
import { BookOpen, Sparkles, LayoutDashboard, Database, HelpCircle, Settings, PenTool, Moon, Sun, Star } from 'lucide-react';

export type NavTab = 'dashboard' | 'notebook' | 'practice' | 'vault';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenGuide: () => void;
  onOpenSettings: () => void;
  masteredCount: number;
  totalWords: number;
  starredCount?: number;
  theme?: 'vintage' | 'midnight';
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenGuide,
  onOpenSettings,
  masteredCount,
  totalWords,
  starredCount = 0,
  theme = 'vintage',
  onToggleTheme,
}) => {
  const percent = totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0;

  return (
    <header className={`sticky top-0 z-30 backdrop-blur-md border-b shadow-sm transition-all no-print ${
      theme === 'midnight' 
        ? 'bg-[#181513]/90 border-stone-800 text-stone-100' 
        : 'bg-[#fdfbf7]/90 border-amber-900/10 text-stone-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-600/20">
            <Sparkles className="w-5 h-5 text-amber-100" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`font-serif font-bold text-xl tracking-tight ${theme === 'midnight' ? 'text-white' : 'text-stone-900'}`}>
                GoldList
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-amber-100 text-amber-800 rounded border border-amber-200">
                Method
              </span>
            </div>
            <p className="text-[11px] text-stone-500 hidden sm:block">黄金列表法 · 词汇长时记忆手账</p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className={`flex items-center space-x-1 sm:space-x-2 p-1 rounded-xl ${
          theme === 'midnight' ? 'bg-stone-900' : 'bg-stone-200/60'
        }`}>
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentTab === 'dashboard'
                ? theme === 'midnight' ? 'bg-stone-800 text-white shadow-sm' : 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-amber-600" />
            <span>今日看板</span>
          </button>

          <button
            onClick={() => onSelectTab('notebook')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentTab === 'notebook'
                ? theme === 'midnight' ? 'bg-stone-800 text-white shadow-sm' : 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>黄金手账</span>
          </button>

          <button
            onClick={() => onSelectTab('practice')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentTab === 'practice'
                ? theme === 'midnight' ? 'bg-stone-800 text-white shadow-sm' : 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <PenTool className="w-4 h-4 text-amber-600" />
            <span>手账练习区</span>
          </button>

          <button
            onClick={() => onSelectTab('vault')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentTab === 'vault'
                ? theme === 'midnight' ? 'bg-stone-800 text-white shadow-sm' : 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4 text-amber-600" />
            <span>词汇金库</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Starred badge */}
          {starredCount > 0 && (
            <button
              onClick={() => onSelectTab('vault')}
              className="flex items-center space-x-1 px-2.5 py-1 bg-amber-500/10 rounded-full border border-amber-500/30 text-xs text-amber-700"
              title="查看已标记重点生词"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span className="font-bold">{starredCount}</span>
            </button>
          )}

          {/* Progress pill */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-amber-50/80 rounded-full border border-amber-200/80 text-xs text-amber-900">
            <span className="font-medium">已巩固:</span>
            <span className="font-bold text-amber-700">{masteredCount}</span>
            <span className="text-stone-400">/</span>
            <span>{totalWords}</span>
            <span className="font-semibold text-amber-600">({percent}%)</span>
          </div>

          {/* Theme toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={theme === 'midnight' ? '切换为浅色复古羊皮纸' : '切换为护眼暗色手账'}
              className="p-2 rounded-lg text-stone-500 hover:text-amber-600 hover:bg-stone-100 transition-colors"
            >
              {theme === 'midnight' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
            </button>
          )}

          {/* Guide button */}
          <button
            onClick={onOpenGuide}
            title="黄金列表法则指南"
            className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 transition-colors"
          >
            <HelpCircle className="w-5 h-5 text-stone-700" />
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            title="设置与数据备份"
            className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 transition-colors"
          >
            <Settings className="w-5 h-5 text-stone-700" />
          </button>
        </div>
      </div>
    </header>
  );
};
