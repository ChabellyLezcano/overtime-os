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
    }, 1000); // Check every second so the minute updates as soon as it changes

    return () => clearInterval(interval);
  }, []);

  const displayMinutes = String(elapsedMinutes % 60).padStart(2, '0');
  const displayTime = `17:${displayMinutes}`;

  return (
    <header className="relative h-10 sm:h-12 px-3 sm:px-4 flex items-center justify-between bg-slate-950/80 border-b border-slate-800/70 backdrop-blur-md text-[11px] text-slate-100 shadow-[0_0_0_1px_rgba(15,23,42,0.7)]">
      {/* Left side: branding */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-[11px] tracking-[0.22em] uppercase text-slate-50">
          OvertimeOS
        </span>
        <span className="hidden sm:inline text-[10px] text-slate-400">
          &quot;No more unpaid overtime&quot; edition
        </span>
      </div>

      {/* Right side: user + clock */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-full bg-slate-900/70 border border-slate-700/70 shadow-sm">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[10px] text-slate-300">
            overworked_dev
          </span>
        </div>

        <span
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-900/70 border border-slate-700/70 shadow-sm text-[10px] sm:text-[11px] cursor-help"
          title="Clock-out time stuck at 17:00. Minutes show how long you've been 'overtime' in this session."
        >
          <span className="text-xs">🕔</span>
          <span className="tabular-nums tracking-wide">{displayTime}</span>
        </span>
      </div>
    </header>
  );
};

export default Taskbar;
