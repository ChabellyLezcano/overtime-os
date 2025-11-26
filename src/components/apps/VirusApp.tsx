'use client';

import React from 'react';

const VirusApp: React.FC = () => {
  return (
    <div className="w-full h-full p-4 text-xs sm:text-md text-slate-100 space-y-3">
        <div className="flex flex-row gap-2">
                 <h2 className="text-md font-semibold text-rose-400">
        Overtime Daemon – Status
      </h2>
            <span className="text-3xl sm:text-4xl select-none">😈</span>
        </div>
 
      <p className="text-slate-300">
        You found the control panel of the overtime daemon. It happily prevents
        shutdown as long as you keep &quot;just doing one more thing&quot;.
      </p>

      <div className="bg-slate-900/80 border border-rose-500/70 rounded-xl p-3 space-y-1">
        <p className="text-[11px] uppercase tracking-[0.16em] text-rose-300 font-semibold">
          Warning
        </p>
        <p className="text-slate-100 text-xs sm:text-sm">
          To kill this daemon you will eventually need to execute a terminal
          command containing the full kill code. Notes, media and mini games
          hide the fragments.
        </p>
      </div>

      <p className="text-[11px] text-slate-400">
        Keep exploring. The daemon loves when you wander around instead of going
        home.
      </p>
    </div>
  );
};

export default VirusApp;
