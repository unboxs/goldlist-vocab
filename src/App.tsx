import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { TodayDashboard } from './components/TodayDashboard';
import { NotebookView } from './components/NotebookView';
import { WordVault } from './components/WordVault';
import { DistillSession } from './components/DistillSession';
import { GoldListGuideModal } from './components/GoldListGuideModal';
import { SettingsModal } from './components/SettingsModal';
import { db, DEFAULT_SETTINGS } from './services/db';
import { WordItem, GoldListPage, AppSettings, AppStats } from './types/goldlist';
import { Sparkles, Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Core state
  const [words, setWords] = useState<WordItem[]>([]);
  const [pages, setPages] = useState<GoldListPage[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<AppStats>({
    totalWords: 0,
    headlistCount: 0,
    d1Count: 0,
    d2Count: 0,
    d3Count: 0,
    masteredCount: 0,
    pagesCount: 0,
    completedDistillations: 0,
  });

  // UI state
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedPageId, setSelectedPageId] = useState<number>(1);
  const [isDistilling, setIsDistilling] = useState(false);
  const [distillPageId, setDistillPageId] = useState<number>(1);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load database
  const refreshData = async () => {
    try {
      const allWords = await db.getAllWords();
      const allPages = await db.getAllPages();
      const appSettings = await db.getSettings();
      const appStats = await db.getStats();

      setWords(allWords);
      setPages(allPages);
      setSettings(appSettings);
      setStats(appStats);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        setIsLoading(true);
        await db.init();
        await refreshData();
      } catch (err: unknown) {
        console.error('App init error:', err);
        setInitError((err as Error)?.message || '无法初始化词库数据');
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  const handleStartDistillation = (pageId: number) => {
    setDistillPageId(pageId);
    setIsDistilling(true);
  };

  const handleFinishDistillation = async () => {
    setIsDistilling(false);
    await refreshData();
  };

  const handleGoToPageFromVault = (pageId: number) => {
    setSelectedPageId(pageId);
    setCurrentTab('notebook');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f2eb] flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white mx-auto shadow-lg shadow-amber-600/30 animate-pulse">
            <Sparkles className="w-7 h-7 text-amber-100" />
          </div>
          <h2 className="text-xl font-serif font-bold text-stone-900">
            GoldList 黄金手账加载中
          </h2>
          <p className="text-xs text-stone-500">
            正在载入 2,503 词库与四象限记忆索引...
          </p>
          <div className="flex justify-center">
            <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-[#f5f2eb] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow text-center space-y-3">
          <h3 className="text-red-600 font-bold">词库载入异常</h3>
          <p className="text-xs text-stone-600">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f2eb] flex flex-col">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        masteredCount={stats.masteredCount}
        totalWords={stats.totalWords}
      />

      {/* Main Tab Content */}
      <main className="flex-1 pb-16">
        {currentTab === 'dashboard' && (
          <TodayDashboard
            stats={stats}
            pages={pages}
            words={words}
            cooldownDays={settings.cooldownDays}
            targetWeeks={settings.targetWeeks}
            dailyPagesGoal={settings.dailyPagesGoal}
            onOpenNotebookPage={(pid) => {
              setSelectedPageId(pid);
              setCurrentTab('notebook');
            }}
            onStartDistillation={handleStartDistillation}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        )}

        {currentTab === 'notebook' && (
          <NotebookView
            currentPageId={selectedPageId}
            pages={pages}
            words={words}
            cooldownDays={settings.cooldownDays}
            onSelectPage={setSelectedPageId}
            onStartDistillation={handleStartDistillation}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        )}

        {currentTab === 'vault' && (
          <WordVault
            words={words}
            onGoToPage={handleGoToPageFromVault}
          />
        )}
      </main>

      {/* Distillation Flashcard Session Modal */}
      {isDistilling && (
        <DistillSession
          pageId={distillPageId}
          pages={pages}
          words={words}
          cooldownDays={settings.cooldownDays}
          autoPlayAudio={settings.autoPlayAudio}
          onFinish={handleFinishDistillation}
          onOpenGuide={() => setIsGuideOpen(true)}
        />
      )}

      {/* Gold List Guide Modal */}
      <GoldListGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          refreshData();
        }}
        onDataReset={refreshData}
      />
    </div>
  );
};
export default App;
