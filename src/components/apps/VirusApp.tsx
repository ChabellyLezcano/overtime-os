'use client';

import React from 'react';

const VirusApp: React.FC = () => {
  return (
    <div className="flex h-full w-full items-start justify-center p-3 sm:p-4">
      {/* Columna interior, centrada y con ancho contenido */}
      <div className="text-body flex w-full flex-col gap-4 text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-heading-sm text-rose-300">
              Overtime Daemon – Status: Active
            </h2>
            <p className="text-xs text-slate-400">
              You found the control panel of the overtime daemon. It happily prevents
              shutdown as long as you keep &quot;just doing one more thing&quot;.
            </p>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-rose-500/60 bg-rose-500/10 shadow-[0_0_16px_rgba(248,113,113,0.35)] sm:h-11 sm:w-11">
            <span className="text-md select-none sm:text-3xl">😈</span>
          </div>
        </div>

        {/* Warning card */}
        <div className="space-y-1.5 rounded-2xl border border-rose-500/70 bg-slate-900/85 p-3 shadow-[0_0_14px_rgba(248,113,113,0.25)] sm:p-4">
          <p className="text-md font-semibold tracking-[0.16em] text-rose-300 uppercase">
            Warning
          </p>
          <p className="text-sm text-slate-100">
            To kill this daemon you will eventually need to execute a terminal command
            containing the full kill code. Notes, media and mini-games hide the fragments.
          </p>
        </div>

        {/* Flavor text */}
        <p className="text-xs text-slate-400">
          Keep exploring. The daemon loves when you wander around instead of going home.
        </p>
      </div>
    </div>
  );
};

export default VirusApp;
