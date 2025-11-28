// src/components/apps/PowerApp.tsx
'use client';

import React from 'react';
import { useWindowManager } from '@/context/WindowManagerContext';

const PowerApp: React.FC = () => {
  const { daemonKilled, powerOff } = useWindowManager();

  const helper = daemonKilled
    ? 'All puzzles are done. You can finally shut down OvertimeOS and go home.'
    : 'The overtime daemon is still active. Beat all mini-games and run the final terminal command to unlock shutdown.';

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/95 px-4 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.85)] sm:px-6 sm:py-6">
      {/* Icon + status */}
      <div className="mb-4 flex flex-col items-center gap-3 text-center">
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 shadow-[0_0_18px_rgba(148,163,184,0.7)] sm:h-14 sm:w-14">
            <button
              type="button"
              onClick={daemonKilled ? powerOff : undefined}
              disabled={!daemonKilled}
              className="text-2xl text-rose-400 sm:text-3xl"
            >
              ⏻
            </button>
          </div>
          <div className="absolute -right-1 -bottom-1 flex h-4 w-4 items-center justify-center rounded-full border border-slate-950 bg-slate-950 text-[9px]">
            {daemonKilled ? (
              <span className="text-emerald-400">✓</span>
            ) : (
              <span className="text-amber-400">!</span>
            )}
          </div>
        </div>

        <div className="max-w-sm space-y-1">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase sm:text-xs">
            Power control
          </p>
          <p className="text-sm font-semibold text-slate-50 sm:text-base">
            {daemonKilled
              ? 'You are free to clock out'
              : 'Shutdown blocked by overtime daemon'}
          </p>
          <p className="text-[11px] leading-relaxed text-slate-300 sm:text-xs">
            {helper}
          </p>
        </div>
      </div>

      {/* Small helper text at bottom */}
      <p className="mt-3 text-center text-[10px] text-slate-500">
        {daemonKilled
          ? 'All apps will close and OvertimeOS will fade to black when you power off.'
          : 'Complete all mini-games and execute the shutdown command in the Terminal to unlock this button.'}
      </p>
    </div>
  );
};

export default PowerApp;
