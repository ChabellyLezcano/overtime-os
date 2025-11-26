'use client';

import React, { useEffect, useState } from 'react';

const STICKY_PAD_STORAGE_KEY = 'overtime-os:sticky-pad-text';
// 10 minutos en ms
const TEN_MINUTES_MS = 10 * 60 * 1000;

interface StickyPadStoredValue {
  text: string;
  savedAt: number; // timestamp (Date.now())
}

const StickyPadApp: React.FC = () => {
  // Initialize from localStorage with expiration logic
  const [text, setText] = useState<string>(() => {
    if (typeof window === 'undefined') return '';

    try {
      const raw = window.localStorage.getItem(STICKY_PAD_STORAGE_KEY);
      if (!raw) return '';

      const parsed = JSON.parse(raw) as StickyPadStoredValue | null;
      if (
        !parsed ||
        typeof parsed.text !== 'string' ||
        typeof parsed.savedAt !== 'number'
      ) {
        window.localStorage.removeItem(STICKY_PAD_STORAGE_KEY);
        return '';
      }

      const now = Date.now();
      const age = now - parsed.savedAt;

      if (age <= TEN_MINUTES_MS) {
        return parsed.text;
      }

      // Expired: clear storage and start empty
      window.localStorage.removeItem(STICKY_PAD_STORAGE_KEY);
      return '';
    } catch (err) {
      console.error('Failed to load sticky pad text', err);
      return '';
    }
  });

  // Persist content whenever it changes, with a fresh timestamp
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const value: StickyPadStoredValue = {
        text,
        savedAt: Date.now(),
      };
      window.localStorage.setItem(STICKY_PAD_STORAGE_KEY, JSON.stringify(value));
    } catch (err) {
      console.error('Failed to save sticky pad text', err);
    }
  }, [text]);

  return (
    <div className="w-full h-full flex flex-col p-3 sm:p-4 text-xs sm:text-md text-slate-100">
      {/* Header */}
      <div>
        <h2 className="text-md sm:text-base font-semibold text-emerald-300 mb-1.5">
          StickyPad – Puzzle Notes
        </h2>
        <p className="text-slate-300 text-[11px] sm:text-xs">
          Use this sticky area to write hints, kill code fragments and terminal commands.
          Notes live for about{' '}
          <span className="font-semibold">1 hour</span> after your last edit.
        </p>
      </div>

      {/* Textarea fills the rest of the window */}
      <div className="mt-3 flex-1 min-h-0">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="
            w-full h-full
            min-h-40 sm:min-h-[220px]
            rounded-xl
            bg-slate-900/80
            border border-slate-700/80
            px-3 py-2
            text-xs sm:text-md text-slate-100
            outline-none
            resize-none
            overflow-y-auto
            focus:border-emerald-400/80
          "
          placeholder="notes about the daemon, kill code fragments, weird process names..."
        />
      </div>
    </div>
  );
};

export default StickyPadApp;
