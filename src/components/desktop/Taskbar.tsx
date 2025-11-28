'use client';

import React, { useEffect, useState } from 'react';

const Taskbar: React.FC = () => {
  // Minutes passed since the component was mounted
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    const startTime = Date.now();

    const interval = setInterval(() => {
      const diffMs = Date.now() - startTime;
      const minutes = Math.floor(diffMs / 60000);
      setElapsedMinutes(minutes);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const displayMinutes = String(elapsedMinutes % 60).padStart(2, '0');
  const displayTime = `17:${displayMinutes}`;

  const overtimeLabel =
    elapsedMinutes <= 0 ? 'On time' : `+${elapsedMinutes} min overtime`;

  return (
    <header className="relative z-30 h-10 border-b border-slate-800/70 bg-slate-950/85 shadow-[0_6px_24px_rgba(15,23,42,0.9)] backdrop-blur-xl sm:h-12">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between gap-3 px-3 sm:px-4">
        {/* Left: logo + name */}
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-6 w-10 items-center justify-center rounded-xl border border-slate-600/70 bg-slate-900/90 shadow-[0_0_14px_rgba(56,189,248,0.45)]">
            <span className="text-[13px] leading-none text-sky-300 select-none">OS</span>
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-[11px] font-semibold tracking-[0.18em] text-slate-50 uppercase">
              OvertimeOS
            </span>
            <span className="hidden truncate text-[10px] text-slate-400 sm:inline">
              “No more unpaid overtime” edition
            </span>
          </div>
        </div>

        {/* Right: user + clock */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User pill */}
          <div className="hidden items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/80 px-2.5 py-1 shadow-sm sm:flex">
            <span className="relative inline-flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[10px] font-medium text-slate-300">overworked_dev</span>
          </div>

          {/* Clock pill */}
          <div
            className="inline-flex cursor-help flex-col gap-0.5 rounded-full border border-slate-700/70 bg-slate-900/85 px-2.5 py-1 text-[10px] shadow-sm sm:flex-row sm:items-center sm:gap-1.5 sm:text-[11px]"
            title="Clock-out time stuck at 17:00. Minutes show how long you've been 'overtime' in this session."
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs">🕔</span>
              <span className="tracking-wide text-slate-50 tabular-nums">
                {displayTime}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 sm:border-l sm:border-slate-700/70 sm:pl-1.5">
              {overtimeLabel}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Taskbar;
