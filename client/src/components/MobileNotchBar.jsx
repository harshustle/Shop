import React from 'react';
import { Wifi, Battery } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const MobileNotchBar = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="w-full bg-[var(--app-notch-bg)] text-[var(--app-notch-text)] transition-colors duration-200 select-none border-b border-black/[0.04] dark:border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-8 flex items-center justify-between text-[11px] font-bold">
        {/* Left: Time (9:41 like in iOS reference) */}
        <div className="flex items-center gap-2">
          <span className="font-black tracking-tight text-xs">9:41</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse hidden sm:inline-block" title="Live System Online"></span>
        </div>

        {/* Center: Dynamic Island / Camera Notch Pill */}
        <div className="flex items-center justify-center">
          <div className="w-24 sm:w-28 h-4 bg-black rounded-full flex items-center justify-between px-2.5 shadow-xs">
            <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700/60" />
            <div className="w-8 h-1 rounded-full bg-slate-900/80" />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-950/80" />
          </div>
        </div>

        {/* Right: Cellular, Wifi, Battery + Compact Theme Switcher */}
        <div className="flex items-center gap-2.5">
          {/* 3-Theme Quick Switcher */}
          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/10 p-0.5 rounded-full border border-black/5 dark:border-white/10">
            <button
              type="button"
              onClick={() => setTheme('white')}
              title="White Mode"
              className={`w-4 h-4 rounded-full flex items-center justify-center transition text-[9px] ${
                theme === 'white' ? 'bg-white shadow-xs scale-110 text-slate-900' : 'opacity-60 hover:opacity-100'
              }`}
            >
              ⚪
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              title="Dark Mode"
              className={`w-4 h-4 rounded-full flex items-center justify-center transition text-[9px] ${
                theme === 'dark' ? 'bg-slate-900 shadow-xs scale-110 text-white' : 'opacity-60 hover:opacity-100'
              }`}
            >
              ⚫
            </button>
            <button
              type="button"
              onClick={() => setTheme('yellow')}
              title="Yellow Mode"
              className={`w-4 h-4 rounded-full flex items-center justify-center transition text-[9px] ${
                theme === 'yellow' ? 'bg-amber-400 shadow-xs scale-110 text-slate-900' : 'opacity-60 hover:opacity-100'
              }`}
            >
              🟡
            </button>
          </div>

          {/* Signal bars */}
          <div className="flex items-end gap-0.5 h-2.5">
            <span className="w-0.5 h-1 bg-current rounded-xs opacity-60"></span>
            <span className="w-0.5 h-1.5 bg-current rounded-xs opacity-75"></span>
            <span className="w-0.5 h-2 bg-current rounded-xs"></span>
            <span className="w-0.5 h-2.5 bg-current rounded-xs"></span>
          </div>

          {/* Wifi Icon */}
          <Wifi size={12} className="stroke-[2.5]" />

          {/* Battery Icon */}
          <div className="flex items-center">
            <div className="w-4 h-2.5 border border-current rounded-xs p-[1px] flex items-center">
              <div className="h-full w-full bg-current rounded-2xs"></div>
            </div>
            <div className="w-0.5 h-1 bg-current rounded-r-2xs -ml-[0.5px]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileNotchBar;
