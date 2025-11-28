'use client';

import React, { useEffect, useState } from 'react';
import { copyToClipboard } from '@/utils/copyToClipboard'; // ajusta la ruta si hace falta

type Bug = {
  id: number;
  x: number; // 0–100 (percentage)
  y: number; // 0–100 (percentage)
};

const BUG_COUNT = 6;
const TARGET_SQUASHED = 12;

const STORAGE_KEY = 'bug-smasher-solved';
const SOLVED_TTL_MS = 15 * 60 * 1000; // 15 minutes
const BUGS_FRAGMENT = '+BUGS-FIXED';

const randomPosition = () => ({
  x: 5 + Math.random() * 90, // avoid too close to edges
  y: 5 + Math.random() * 90,
});

const createInitialBugs = (): Bug[] => {
  return Array.from({ length: BUG_COUNT }, (_, i) => ({
    id: i,
    ...randomPosition(),
  }));
};

const BugSmasherApp: React.FC = () => {
  const [bugs, setBugs] = useState<Bug[]>(() => createInitialBugs());
  const [squashedCount, setSquashedCount] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [recentSquashId, setRecentSquashId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Load persisted solved state on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const data = JSON.parse(raw) as { solved?: boolean; expiresAt?: number };

      if (!data?.expiresAt) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      if (Date.now() < data.expiresAt && data.solved) {
        setPuzzleSolved(true);
        // Optional: display full progress when re-entering during TTL
        setSquashedCount(TARGET_SQUASHED);
      } else {
        // Expired, clean up
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error reading bug smasher state from localStorage', error);
    }
  }, []);

  // Move bugs around periodically to make the board feel alive
  useEffect(() => {
    if (puzzleSolved) return;

    const interval = setInterval(() => {
      setBugs((prev) =>
        prev.map((bug) => ({
          ...bug,
          ...randomPosition(),
        })),
      );
    }, 900);

    return () => clearInterval(interval);
  }, [puzzleSolved]);

  // Clear recent squash highlight
  useEffect(() => {
    if (recentSquashId === null) return;
    const timeout = setTimeout(() => setRecentSquashId(null), 200);
    return () => clearTimeout(timeout);
  }, [recentSquashId]);

  // Persist solved state to localStorage with TTL
  const persistSolvedState = () => {
    if (typeof window === 'undefined') return;

    const payload = {
      solved: true,
      expiresAt: Date.now() + SOLVED_TTL_MS,
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error('Error saving bug smasher state to localStorage', error);
    }
  };

  const handleBugClick = (id: number) => {
    if (puzzleSolved) return;

    // Update squashed count and detect completion
    setSquashedCount((prev) => {
      const next = prev + 1;
      if (!puzzleSolved && next >= TARGET_SQUASHED) {
        setPuzzleSolved(true);
        persistSolvedState();
      }
      return next;
    });

    // Update streaks
    setCurrentStreak((prev) => {
      const next = prev + 1;
      setBestStreak((best) => (next > best ? next : best));
      return next;
    });

    setRecentSquashId(id);

    // Respawn that bug in a new random position
    setBugs((prev) =>
      prev.map((bug) => (bug.id === id ? { ...bug, ...randomPosition() } : bug)),
    );
  };

  const handleMissClick = () => {
    if (puzzleSolved) return;
    if (currentStreak > 0) {
      setCurrentStreak(0);
    }
  };

  const handleCopyFragment = () => {
    void copyToClipboard(BUGS_FRAGMENT, {
      setCopied,
      timeoutMs: 1500,
    });
  };

  const progressPercent = Math.min(100, (squashedCount / TARGET_SQUASHED) * 100);

  return (
    <div className="sm:text-md flex h-full w-full flex-col overflow-hidden p-3 text-xs text-slate-100 sm:p-4">
      {/* HEADER */}
      <div className="mb-3 flex items-center justify-between sm:mb-4">
        <div className="min-w-0">
          <h2 className="text-md truncate font-semibold text-amber-300 sm:text-base">
            Bug Tracker – Smasher Mode
          </h2>
          <p className="truncate text-[11px] text-slate-300">
            Squash the noisy overtime bugs that keep the daemon awake.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-[10px] text-slate-400">
          <span>Target: {TARGET_SQUASHED} bugs</span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] ${
              puzzleSolved
                ? 'border-emerald-400/80 bg-emerald-500/15 text-emerald-200'
                : 'border-amber-400/80 bg-amber-500/10 text-amber-200'
            }`}
          >
            {puzzleSolved ? 'Noise level reduced ✓' : 'Bug activity high'}
          </span>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto sm:gap-4">
        {/* STATUS STRIP */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/90 p-3 text-[11px] sm:p-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-slate-400">Bugs squashed</span>
              <span className="text-lg font-semibold text-amber-300">
                {squashedCount}
                <span className="text-[11px] text-slate-400">/{TARGET_SQUASHED}</span>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400">Best streak</span>
              <span className="text-base font-semibold text-emerald-300">
                {bestStreak}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400">Current streak</span>
              <span className="text-base font-semibold text-sky-300">
                {currentStreak}
              </span>
            </div>
          </div>

          <div className="w-full sm:w-48">
            <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
              <span>Noise reduction</span>
              <span className="font-semibold text-emerald-300">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
              <div
                className="h-full bg-linear-to-r from-amber-400 via-emerald-400 to-emerald-500 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* GAME BOARD */}
        <div
          className="relative cursor-crosshair overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/95 p-3 sm:p-4"
          onClick={handleMissClick}
        >
          {/* Background glow when solved */}
          {puzzleSolved && (
            <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-emerald-500/15 via-amber-400/10 to-sky-400/20 blur-3xl" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-size-[18px_18px] opacity-[0.06]" />

          {/* Instructions */}
          <div className="relative z-10 mb-2 text-[11px] text-slate-400">
            <p>
              Click directly on the{' '}
              <span className="font-semibold text-amber-200">bugs</span> to squash them.
              Missing a click will reset your current streak.
            </p>
            <p className="mt-0.5">
              High streaks reduce the daemon&apos;s confidence that you&apos;ll &quot;just
              fix one more bug&quot;.
            </p>
          </div>

          {/* Play area */}
          <div className="relative z-10 mt-2 h-48 w-full overflow-hidden rounded-xl border border-slate-700/70 bg-slate-950/80 sm:h-56">
            {bugs.map((bug) => {
              const isHighlighted = recentSquashId === bug.id;
              return (
                <button
                  key={bug.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBugClick(bug.id);
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 ${isHighlighted ? 'scale-110' : 'hover:scale-110'} `}
                  style={{
                    left: `${bug.x}%`,
                    top: `${bug.y}%`,
                  }}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full shadow-lg sm:h-9 sm:w-9 ${
                      isHighlighted
                        ? 'bg-emerald-500/90 shadow-emerald-500/60'
                        : 'bg-amber-400/90 shadow-amber-500/70'
                    }`}
                  >
                    <span className="text-lg">{isHighlighted ? '💥' : '🐛'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* HINT / KILL CODE PANEL */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/95 p-3 text-[11px] sm:p-4">
          {!puzzleSolved ? (
            <>
              <p className="mb-1 text-slate-300">
                Every unresolved bug is a tiny snack for the overtime daemon. It thrives
                on &quot;just one more fix&quot; at 17:05.
              </p>
              <p className="mb-1 text-slate-400">
                Squash at least{' '}
                <span className="font-semibold text-amber-200">
                  {TARGET_SQUASHED} bugs
                </span>{' '}
                in this fake tracker to starve it a little.
              </p>
              <p className="text-slate-500">
                Try to build up a good{' '}
                <span className="font-semibold text-slate-100">streak</span>. The daemon
                hates seeing consistent progress on closing bugs instead of opening new
                ones.
              </p>
            </>
          ) : (
            <div className="space-y-2">
              <div className="mt-1 space-y-2 rounded-xl border border-emerald-400/80 bg-linear-to-br from-emerald-500/15 via-slate-950 to-emerald-500/10 p-3 shadow-[0_0_20px_rgba(52,211,153,0.45)]">
                <p className="mb-1 text-[10px] tracking-[0.16em] text-emerald-300 uppercase">
                  Kill code fragment unlocked
                </p>

                {/* Input + copy button for fragment */}
                <div className="space-y-2">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      readOnly
                      value={BUGS_FRAGMENT}
                      className="flex-1 overflow-x-auto rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 font-mono text-[11px] text-emerald-200"
                    />
                    <button
                      type="button"
                      onClick={handleCopyFragment}
                      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-slate-950 shadow-md shadow-emerald-500/40 transition hover:bg-emerald-400"
                    >
                      {copied ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>
                  {copied && (
                    <p className="text-[10px] text-emerald-300">
                      Fragment copied. Paste it into your StickyPad or wherever you are
                      assembling the kill code.
                    </p>
                  )}
                </div>
              </div>

              <p className="text-slate-400">
                Add this fragment to your StickyPad. The daemon can&apos;t keep feeding on
                a clean bug tracker forever.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BugSmasherApp;
