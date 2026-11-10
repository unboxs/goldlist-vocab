import React from 'react';
import { RotateCcw, Smartphone } from 'lucide-react';

/**
 * Full-screen overlay shown when user holds phone in portrait mode.
 * Uses CSS @media (orientation: portrait) + max-width to only target phones.
 * Pure CSS driven — no JS needed for orientation detection.
 */
export const PortraitGuard: React.FC = () => {
  return (
    <div
      className="portrait-guard fixed inset-0 z-[9999] bg-gradient-to-br from-amber-900 via-stone-900 to-stone-950 flex flex-col items-center justify-center p-8 text-center"
      aria-hidden="true"
    >
      {/* Rotating phone animation */}
      <div className="relative mb-8">
        <div className="w-20 h-32 rounded-2xl border-[3px] border-amber-400/60 flex items-center justify-center animate-[tilt_2s_ease-in-out_infinite]">
          <Smartphone className="w-10 h-10 text-amber-400/80" />
        </div>
        <RotateCcw className="absolute -bottom-3 -right-3 w-8 h-8 text-amber-500 animate-spin" style={{ animationDuration: '3s' }} />
      </div>

      <h2 className="text-2xl font-serif font-bold text-white mb-3">
        请横屏使用
      </h2>
      <p className="text-amber-200/80 text-sm max-w-xs leading-relaxed">
        GoldList 黄金手账专为横屏设计，
        <br />
        请旋转您的手机获得最佳体验 📖
      </p>
      <p className="text-stone-500 text-xs mt-6">
        Rotate your phone to landscape mode
      </p>
    </div>
  );
};
