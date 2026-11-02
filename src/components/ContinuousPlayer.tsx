import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Repeat, 
  Sparkles,
  Headphones
} from 'lucide-react';
import { WordItem } from '../types/goldlist';
import { sound } from '../services/sound';

interface ContinuousPlayerProps {
  words: WordItem[];
  pageTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onWordChange?: (wordId: string) => void;
}

export const ContinuousPlayer: React.FC<ContinuousPlayerProps> = ({
  words,
  pageTitle,
  isOpen,
  onClose,
  onWordChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'page' | 'word'>('page');
  const [speed, setSpeed] = useState<number>(1.0);
  const isPlayingRef = useRef(isPlaying);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const currentWord = words[currentIndex] || words[0];

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const playWordSequence = async (index: number) => {
    if (!isPlayingRef.current || words.length === 0) return;
    const word = words[index];
    if (!word) return;

    if (onWordChange) {
      onWordChange(word.id);
    }

    try {
      // 1. Play English
      await sound.playPronunciation(word.text, word.audioURL);

      // Wait 1.5 seconds for listener to digest
      await new Promise((res) => {
        timeoutRef.current = setTimeout(res, 1400 / speed);
      });

      if (!isPlayingRef.current) return;

      // 2. Play Chinese
      const zh = word.translations.slice(0, 2).join('，');
      await sound.speakChinese(zh);

      // Wait 1.2 seconds before next word
      await new Promise((res) => {
        timeoutRef.current = setTimeout(res, 1200 / speed);
      });

      if (!isPlayingRef.current) return;

      // 3. Advance to next
      if (repeatMode === 'word') {
        playWordSequence(index);
      } else {
        const nextIdx = (index + 1) % words.length;
        setCurrentIndex(nextIdx);
        playWordSequence(nextIdx);
      }
    } catch (err) {
      console.warn('Playback sequence error:', err);
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      clearTimer();
      sound.stopAllAudio();
    } else {
      setIsPlaying(true);
      isPlayingRef.current = true;
      playWordSequence(currentIndex);
    }
  };

  const handleNext = () => {
    clearTimer();
    sound.stopAllAudio();
    const nextIdx = (currentIndex + 1) % words.length;
    setCurrentIndex(nextIdx);
    if (isPlaying) {
      playWordSequence(nextIdx);
    }
  };

  const handlePrev = () => {
    clearTimer();
    sound.stopAllAudio();
    const prevIdx = (currentIndex - 1 + words.length) % words.length;
    setCurrentIndex(prevIdx);
    if (isPlaying) {
      playWordSequence(prevIdx);
    }
  };

  useEffect(() => {
    return () => {
      clearTimer();
      sound.stopAllAudio();
    };
  }, []);

  if (!isOpen || words.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-xl transition-all duration-300">
      <div className="bg-[#24211e]/95 backdrop-blur-xl text-stone-100 rounded-3xl shadow-2xl border border-amber-600/30 p-4 sm:p-5">
        {/* Header strip */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-md bg-amber-500/20 text-amber-400">
              <Headphones className="w-3.5 h-3.5 animate-pulse" />
            </span>
            <span className="font-medium text-amber-300">手账随身听 · 连播磨耳朵</span>
            <span className="text-stone-400 font-serif">({pageTitle})</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized((prev) => !prev)}
              className="text-stone-400 hover:text-white p-1"
              title={isMinimized ? '展开' : '折叠'}
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                clearTimer();
                sound.stopAllAudio();
                onClose();
              }}
              className="text-stone-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Player Body (hidden if minimized) */}
        {!isMinimized ? (
          <div className="space-y-4">
            {/* Word Display */}
            <div className="flex items-center justify-between px-2">
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide truncate">
                    {currentWord.text}
                  </span>
                  <span className="text-xs font-mono text-amber-400/80">
                    #{currentIndex + 1}/{words.length}
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-stone-300 truncate">
                  {currentWord.translations.join('； ')}
                </div>
              </div>

              <div className="text-right text-xs text-stone-400 pl-3">
                <span className="px-2 py-0.5 rounded-full bg-stone-800 border border-stone-700 text-[10px] text-amber-300">
                  英音 ➔ 停顿 ➔ 中文
                </span>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-between pt-1">
              {/* Repeat Mode */}
              <button
                onClick={() => setRepeatMode((prev) => (prev === 'page' ? 'word' : 'page'))}
                className={`p-2 rounded-xl text-xs flex items-center space-x-1 transition-colors ${
                  repeatMode === 'word' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-400 hover:text-white'
                }`}
                title={repeatMode === 'word' ? '单词循环' : '整页循环'}
              >
                <Repeat className="w-4 h-4" />
                <span className="text-[10px] hidden sm:inline">{repeatMode === 'word' ? '单词' : '整页'}</span>
              </button>

              {/* Main Playback Buttons */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePrev}
                  className="p-2 rounded-full hover:bg-stone-800 text-stone-300 hover:text-white transition-colors"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={handleTogglePlay}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 flex items-center justify-center shadow-lg shadow-amber-600/30 transition-all transform active:scale-95"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={handleNext}
                  className="p-2 rounded-full hover:bg-stone-800 text-stone-300 hover:text-white transition-colors"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Speed toggle */}
              <button
                onClick={() => {
                  const speeds = [0.8, 1.0, 1.2];
                  const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
                  setSpeed(next);
                }}
                className="px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs text-stone-300 font-mono transition-colors"
                title="调整播放语速"
              >
                {speed}x
              </button>
            </div>
          </div>
        ) : (
          /* Minimized pill */
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 truncate">
              <span className="font-bold text-white truncate">{currentWord.text}</span>
              <span className="text-stone-400 truncate text-[11px]">{currentWord.translations[0]}</span>
            </div>
            <button
              onClick={handleTogglePlay}
              className="p-1.5 rounded-full bg-amber-500 text-stone-900 ml-2"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
