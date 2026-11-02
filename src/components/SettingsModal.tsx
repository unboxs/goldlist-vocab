import React, { useState } from 'react';
import { X, Sliders, HardDriveDownload, HardDriveUpload, RotateCcw, Cloud, Volume2, Calendar, Check, ExternalLink } from 'lucide-react';
import { AppSettings } from '../types/goldlist';
import { db } from '../services/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onDataReset: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onDataReset,
}) => {
  const [activeTab, setActiveTab] = useState<'study' | 'backup' | 'cloudflare'>('study');
  const [currentSettings, setCurrentSettings] = useState<AppSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    await db.updateSettings(currentSettings);
    onSaveSettings(currentSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      const jsonStr = await db.exportBackup();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `goldlist-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`导出失败: ${err}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        await db.importBackup(content);
        alert('🎉 备份数据已成功导入并恢复！');
        window.location.reload();
      } catch (err) {
        alert(`导入恢复失败，请确认文件是否正确: ${err}`);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = async () => {
    if (window.confirm('⚠️ 确定要重置所有学习进度并恢复到初始状态吗？此操作无法撤销。')) {
      await db.resetToDefault();
      onDataReset();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-[#fdfbf7] rounded-2xl max-w-2xl w-full shadow-2xl border border-amber-900/10 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-amber-700" />
            <h2 className="text-xl font-serif font-bold text-stone-900">系统设置与 Cloudflare 部署</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-stone-200 px-6 bg-stone-100/50">
          <button
            onClick={() => setActiveTab('study')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'study'
                ? 'border-amber-600 text-amber-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            学习参数与节奏
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'backup'
                ? 'border-amber-600 text-amber-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            数据备份与恢复
          </button>
          <button
            onClick={() => setActiveTab('cloudflare')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'cloudflare'
                ? 'border-amber-600 text-amber-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Cloud className="w-4 h-4 text-sky-600" />
            <span>部署到 Cloudflare</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          {activeTab === 'study' && (
            <div className="space-y-6 text-sm text-stone-700">
              {/* Cooldown period */}
              <div className="space-y-2">
                <label className="font-semibold text-stone-900 flex items-center justify-between">
                  <span>蒸馏休眠沉淀期（Cooldown Period）</span>
                  <span className="text-amber-700 font-bold">{currentSettings.cooldownDays} 天</span>
                </label>
                <p className="text-xs text-stone-500">
                  黄金列表法严格依赖此间隔让短时工作记忆衰减，沉淀长时记忆。
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {[
                    { label: '经典 14 天 (标准)', days: 14, desc: 'Uncle Davey 原版规范' },
                    { label: '快速 7 天 (推荐)', days: 7, desc: '契合数周巩固目标' },
                    { label: '冲刺 3 天', days: 3, desc: '考前高频轮转' },
                    { label: '无限制 0 天', days: 0, desc: '自由随时蒸馏' },
                  ].map((opt) => (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => setCurrentSettings({ ...currentSettings, cooldownDays: opt.days })}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        currentSettings.cooldownDays === opt.days
                          ? 'border-amber-600 bg-amber-50/80 ring-2 ring-amber-600/20 text-amber-950 font-medium'
                          : 'border-stone-200 bg-white hover:border-stone-300 text-stone-700'
                      }`}
                    >
                      <div className="font-medium text-xs">{opt.label}</div>
                      <div className="text-[10px] text-stone-500 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal planner */}
              <div className="space-y-2 pt-2 border-t border-stone-200">
                <label className="font-semibold text-stone-900 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>目标完成周数（计划周期）</span>
                  </span>
                  <span className="text-amber-700 font-bold">{currentSettings.targetWeeks} 周</span>
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="2"
                    max="12"
                    step="1"
                    value={currentSettings.targetWeeks}
                    onChange={(e) => {
                      const weeks = parseInt(e.target.value);
                      const dailyPages = Math.max(1, Math.ceil(126 / (weeks * 7)));
                      setCurrentSettings({
                        ...currentSettings,
                        targetWeeks: weeks,
                        dailyPagesGoal: dailyPages,
                      });
                    }}
                    className="flex-1 accent-amber-600 h-2 bg-stone-200 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs bg-stone-100 px-2.5 py-1 rounded-md font-mono">
                    每天建议新学 {currentSettings.dailyPagesGoal} 页 (~{currentSettings.dailyPagesGoal * 20} 词)
                  </span>
                </div>
              </div>

              {/* Audio toggle */}
              <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-semibold text-stone-900 flex items-center space-x-1.5">
                    <Volume2 className="w-4 h-4 text-amber-600" />
                    <span>卡片测试时自动播放英文发音</span>
                  </div>
                  <p className="text-xs text-stone-500">翻开单词或进入卡片时自动播放 Cloudfront 高清原生发音</p>
                </div>
                <input
                  type="checkbox"
                  checked={currentSettings.autoPlayAudio}
                  onChange={(e) =>
                    setCurrentSettings({ ...currentSettings, autoPlayAudio: e.target.checked })
                  }
                  className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSave}
                  className="px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-medium text-sm shadow flex items-center space-x-1.5 transition-all"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>保存成功</span>
                    </>
                  ) : (
                    <span>保存设置</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-6 text-sm text-stone-700">
              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1">
                <div className="font-bold text-amber-950 text-xs">本地离线数据保障</div>
                <p className="text-xs text-amber-900">
                  你的学习进度、四象限蒸馏记录完整存储在浏览器的持久化 IndexedDB 中。
                  为防止清除浏览器缓存丢失，建议定期导出备份文件，或在多台设备间随心传输。
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleExportBackup}
                  disabled={isExporting}
                  className="p-4 bg-white rounded-xl border border-stone-200 hover:border-amber-500 hover:shadow-md transition-all flex flex-col items-start space-y-2 text-left"
                >
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-800">
                    <HardDriveDownload className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-stone-900">导出数据备份 (JSON)</div>
                  <p className="text-xs text-stone-500">将所有已学单词、蒸馏状态导出为单文件</p>
                </button>

                <label className="p-4 bg-white rounded-xl border border-stone-200 hover:border-amber-500 hover:shadow-md transition-all flex flex-col items-start space-y-2 text-left cursor-pointer">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-800">
                    <HardDriveUpload className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-stone-900">恢复备份文件</div>
                  <p className="text-xs text-stone-500">选择此前导出的 JSON 文件无缝恢复</p>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="pt-4 border-t border-stone-200">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 border border-red-200 text-xs font-medium flex items-center space-x-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>重置所有数据为初始状态 (2,503 词)</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'cloudflare' && (
            <div className="space-y-4 text-sm text-stone-700">
              <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 flex items-start space-x-3">
                <Cloud className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-sky-950 text-xs">Cloudflare Pages 零成本极速部署</div>
                  <p className="text-xs text-sky-800 leading-relaxed">
                    本项目是一个标准的现代前端单页应用（SPA），已预置 <code className="bg-sky-100 px-1 py-0.5 rounded font-mono">wrangler.toml</code>、<code className="bg-sky-100 px-1 py-0.5 rounded font-mono">_headers</code> 与 <code className="bg-sky-100 px-1 py-0.5 rounded font-mono">_routes.json</code>，完美支持全球 CDN 部署。
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="font-bold text-stone-900 text-xs uppercase tracking-wider text-stone-500">
                  方式一：通过 GitHub 仓库自动部署（最省心，自动持续集成）
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-stone-600 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                  <li>将代码推送到你的 GitHub 仓库（<code className="bg-stone-200 px-1 rounded">git push origin main</code>）。</li>
                  <li>登录 <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="text-amber-700 underline font-semibold inline-flex items-center">Cloudflare 控制台 <ExternalLink className="w-3 h-3 ml-0.5" /></a>，进入 <strong>Workers & Pages</strong>。</li>
                  <li>点击 <strong>Create application</strong> &gt; <strong>Pages</strong> &gt; <strong>Connect to Git</strong>。</li>
                  <li>选择该仓库，Build settings 选择：
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5 text-stone-800">
                      <li>Framework preset: <strong>Vite</strong></li>
                      <li>Build command: <code className="bg-stone-200 px-1 rounded font-mono">pnpm build</code></li>
                      <li>Build output directory: <code className="bg-stone-200 px-1 rounded font-mono">dist</code></li>
                    </ul>
                  </li>
                  <li>点击 <strong>Save and Deploy</strong>，数秒内即完成全球上线！</li>
                </ol>
              </div>

              <div className="space-y-3 pt-2">
                <div className="font-bold text-stone-900 text-xs uppercase tracking-wider text-stone-500">
                  方式二：本地通过 Wrangler CLI 命令行一键上传
                </div>
                <div className="bg-stone-900 text-stone-100 p-3.5 rounded-xl font-mono text-xs space-y-2">
                  <div className="text-stone-400"># 1. 构建前端静态资源</div>
                  <div className="text-amber-300">pnpm build</div>
                  <div className="text-stone-400"># 2. 部署到 Cloudflare Pages</div>
                  <div className="text-amber-300">npx wrangler pages deploy dist --project-name goldlist-vocab</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-100 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-medium text-xs transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
