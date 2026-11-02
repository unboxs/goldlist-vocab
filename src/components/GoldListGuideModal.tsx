import React from 'react';
import { X, Sparkles, BookOpen, Clock, Target, CheckCircle2, AlertCircle } from 'lucide-react';

interface GoldListGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoldListGuideModal: React.FC<GoldListGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-[#fdfbf7] rounded-2xl max-w-2xl w-full shadow-2xl border border-amber-900/10 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white p-6 sm:p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 text-amber-200 text-xs font-semibold tracking-wider uppercase mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Uncle Davey's Philosophy</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-50">
            黄金列表法（Gold List Method）指南
          </h2>
          <p className="text-amber-200/90 text-sm mt-2 max-w-lg">
            由语言学大师 David James 创立，通过避开短时机械死记、激活长时无意识记忆的科学巩固法。
          </p>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto text-stone-700">
          {/* Core Philosophy */}
          <section className="space-y-3">
            <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              <span>1. 核心理念：长时记忆才是真正的语言记忆</span>
            </h3>
            <p className="text-sm leading-relaxed text-stone-600">
              传统的死记硬背（Cramming）调用的是<strong>短时工作记忆</strong>，虽然几天内好像记住了，但很快会雪崩式遗忘，且伴随着极大压力。
              黄金列表法的宗旨是：<strong>永远不要强迫自己记住</strong>。让大脑在放松、享受的状态下接触单词，依靠潜意识的沉淀机制，将词汇自然刻入<strong>长时记忆</strong>。
            </p>
          </section>

          {/* The 4 Quadrants Notebook */}
          <section className="space-y-3">
            <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              <span>2. 经典四象限手账本结构（The 4 Quadrants）</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200">
                <div className="font-bold text-amber-900 mb-1 flex items-center justify-between">
                  <span>📜 象限 A · 原始列表 (Headlist)</span>
                  <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">20 词</span>
                </div>
                <p className="text-stone-600">每一页固定记录 20 个目标单词与中文释义。专注书写与跟读发音，不给大脑任何背诵压力。</p>
              </div>

              <div className="p-3.5 bg-orange-50/80 rounded-xl border border-orange-200">
                <div className="font-bold text-orange-900 mb-1 flex items-center justify-between">
                  <span>🥉 象限 B · 铜级蒸馏 (1st Distillation)</span>
                  <span className="text-[10px] bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded">~14 词</span>
                </div>
                <p className="text-stone-600">休眠沉淀后测试。大脑通常会自然吸收 30% 词汇，将剩余 70%（约14词）提取抄写到象限 B。</p>
              </div>

              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>🥈 象限 C · 银级蒸馏 (2nd Distillation)</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">~10 词</span>
                </div>
                <p className="text-stone-600">再经历一次休眠测试，再次过滤出 70% 未记住词汇（约10词），抄入象限 C。</p>
              </div>

              <div className="p-3.5 bg-yellow-50/80 rounded-xl border border-yellow-200">
                <div className="font-bold text-yellow-900 mb-1 flex items-center justify-between">
                  <span>🥇 象限 D · 金级蒸馏 (3rd Distillation)</span>
                  <span className="text-[10px] bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">~7 词</span>
                </div>
                <p className="text-stone-600">第三轮休眠测试。此时绝大多数单词已永久融入长时记忆，极少数深层词汇进入永久封存库。</p>
              </div>
            </div>
          </section>

          {/* Rules to follow */}
          <section className="space-y-3">
            <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              <span>3. 黄金准则与节奏（Rules）</span>
            </h3>
            <ul className="space-y-2 text-sm text-stone-600">
              <li className="flex items-start space-x-2">
                <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span><strong>必须经过沉淀休眠期：</strong> 原作要求间隔至少 14 天（让短时记忆彻底归零）。如果需要几周内快速冲刺，可在设置中调整为 7 天或 3 天。</span>
              </li>
              <li className="flex items-start space-x-2">
                <Target className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span><strong>享受 30% 吸收率：</strong> 蒸馏时如果忘记了 70%，这是完全正常且符合人类大脑生物学的！切勿焦虑，只要自然蒸馏并移到下一栏即可。</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span><strong>手脑结合与发音：</strong> 推荐在蒸馏时，准备一个真实的笔记本或白纸手写，同时点击小喇叭听真实发音。</span>
              </li>
            </ul>
          </section>

          {/* Sprint plan for User */}
          <section className="p-4 bg-amber-100/60 rounded-xl border border-amber-300/80 space-y-2">
            <div className="font-bold text-amber-950 flex items-center space-x-2 text-sm">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <span>你当前有 2,503 个学过的单词，如何在几周内彻底巩固？</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              本项目已将你的 2,503 个单词自动划分为 126 页（每页 20 词）。
              推荐策略：<strong>设置为 7 天沉淀期（冲刺模式）</strong>，每天浏览并开启 4~5 页原始列表，并在看板中处理每天成熟的蒸馏任务。大约在 4 周内，全部 2,503 词将经历多轮长时记忆沉淀，实现真正不遗忘的稳固掌握！
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-stone-100 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-medium text-sm shadow transition-colors"
          >
            开始践行黄金法则
          </button>
        </div>
      </div>
    </div>
  );
};
