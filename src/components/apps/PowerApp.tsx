// src/components/apps/PowerApp.tsx
'use client';

import React from 'react';
import { useWindowManager } from '@/context/WindowManagerContext';

const PowerApp: React.FC = () => {
  const { daemonKilled, powerOff } = useWindowManager();

  const label = daemonKilled ? 'Power off now' : 'Power off disabled';
  const helper = daemonKilled
    ? 'All puzzles are done. You can finally shut down OvertimeOS and go home.'
    : 'The overtime daemon is still active. Beat all mini-games and run the final terminal command to unlock shutdown.';

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/95 text-md-slate-50">
      <div className="flex flex-col items-center gap-3 mb-4 text-md-center px-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center shadow-[0_0_16px_rgba(148,163,184,0.6)]">
            <span className="text-md-2xl text-md-rose-400">⏻</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-slate-950 bg-slate-950 flex items-center justify-center text-md-[9px]">
            {daemonKilled ? (
              <span className="text-md-emerald-400">✓</span>
            ) : (
              <span className="text-md-amber-400">!</span>
            )}
          </div>
        </div>

        <div className="space-y-1 max-w-md">
          <p className="text-md-[11px] uppercase tracking-[0.18em] text-md-slate-400 font-semibold">
            Power control
          </p>
          <p className="text-md sm:text-md-sm font-semibold">
            {daemonKilled
              ? 'You are free to clock out'
              : 'Shutdown blocked by overtime daemon'}
          </p>
          <p className="text-md-[11px] text-md-slate-400">{helper}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={daemonKilled ? powerOff : undefined}
        disabled={!daemonKilled}
        className={`inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full text-md-[11px] sm:text-md font-semibold transition shadow-lg
          ${
            daemonKilled
              ? 'bg-emerald-500 hover:bg-emerald-400 text-md-slate-950 shadow-emerald-500/50'
              : 'bg-slate-800/90 text-md-slate-500 cursor-not-allowed shadow-none'
          }`}
      >
        <span>{label}</span>
        <span className={daemonKilled ? 'text-md-slate-950' : 'text-md-slate-500'}>⏻</span>
      </button>
    </div>
  );
};

export default PowerApp;
