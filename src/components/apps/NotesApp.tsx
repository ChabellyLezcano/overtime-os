'use client';

import React, { useState } from 'react';

const NotesApp: React.FC = () => {
  const [ack, setAck] = useState(false);

  return (
    <div className="w-full h-full p-4 text-xs md:text-md text-slate-100 space-y-3">
      <h2 className="text-md font-semibold text-amber-300">
        Release Notes – OvertimeOS v1.0
      </h2>

      <p className="text-slate-300">
        Dear <span className="font-mono">overworked_dev</span>,
      </p>

      <p className="text-slate-300">
        This build ships with a &quot;harmless&quot; background daemon that
        keeps your system alive after 17:00, just in case you felt like working
        more &quot;for fun&quot;.
      </p>

      <ul className="list-disc list-inside text-slate-300 space-y-1">
        <li>Prevents shutdown when there are &quot;pending tasks&quot;.</li>
        <li>Randomly opens apps to make you &quot;just check one more thing&quot;.</li>
        <li>Feeds on unpaid overtime and cold coffee.</li>
      </ul>

      <div className="mt-2 bg-slate-900/70 border border-amber-400/70 rounded-xl p-3 space-y-1">
        <p className="text-[11px] uppercase tracking-[0.16em] text-amber-300 font-semibold">
          Hidden dev note
        </p>
        <p className="text-slate-100 text-xs md:text-md">
          First fragment of the kill code:
          <span className="font-mono text-amber-300"> KILL-OVERTIME-NOTES</span>.
        </p>
      </div>

      <button
        type="button"
        className={`mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] md:text-xs font-semibold shadow-md transition ${
          ack
            ? 'bg-emerald-400/90 text-slate-950 shadow-emerald-500/40'
            : 'bg-amber-400/90 hover:bg-amber-300 text-slate-950 shadow-amber-400/40'
        }`}
        onClick={() => setAck(true)}
      >
        {ack ? '✓ Noted. No more free hours.' : '✓ I actually read this dev note'}
      </button>
    </div>
  );
};

export default NotesApp;
