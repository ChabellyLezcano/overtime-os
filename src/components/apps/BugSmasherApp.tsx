'use client';

import React, { useEffect, useState } from 'react';

type Bug = {
  id: number;
  x: number; // 0–100 (percentage)
  y: number; // 0–100 (percentage)
};

const BUG_COUNT = 6;
const TARGET_SQUASHED = 12;

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

  const handleBugClick = (id: number) => {
    if (puzzleSolved) return;

    setSquashedCount((prev) => prev + 1);
    setCurrentStreak((prev) => {
      const next = prev + 1;
      setBestStreak((best) => (next > best ? next : best));
      return next;
    });
    setRecentSquashId(id);

    // Respawn that bug in a new random position
    setBugs((prev) =>
      prev.map((bug) =>
        bug.id === id ? { ...bug, ...randomPosition() } : bug,
      ),
    );

    // Check puzzle completion
    if (squashedCount + 1 >= TARGET_SQUASHED) {
      setPuzzleSolved(true);
    }
  };

  const handleMissClick = () => {
    if (puzzleSolved) return;
    if (currentStreak > 0) {
      setCurrentStreak(0);
    }
  };

  const progressPercent = Math.min(
    100,
    (squashedCount / TARGET_SQUASHED) * 100,
  );

  return (
    <div className="w-full h-full flex flex-col p-3 sm:p-4 text-xs sm:text-md text-slate-100 overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="min-w-0">
          <h2 className="text-md sm:text-base font-semibold text-amber-300 truncate">
            Bug Tracker – Smasher Mode
          </h2>
          <p className="text-[11px] text-slate-300 truncate">
            Squash the noisy overtime bugs that keep the daemon awake.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-[10px] text-slate-400">
          <span>Target: {TARGET_SQUASHED} bugs</span>
          <span
            className={`px-2 py-0.5 rounded-full border text-[10px] ${
              puzzleSolved
                ? 'border-emerald-400/80 bg-emerald-500/15 text-emerald-200'
                : 'border-amber-400/80 bg-amber-500/10 text-amber-200'
            }`}
          >
            {puzzleSolved ? 'Noise level reduced ✓' : 'Bug activity high'}
          </span>
        </div>
      </div>

      {/* CONTENIDO SCROLLABLE */}
      <div className="flex-1 min-h-0 flex flex-col gap-3 sm:gap-4 overflow-y-auto">
        {/* STATUS STRIP */}
        <div className="rounded-2xl bg-slate-950/90 border border-slate-800/80 p-3 sm:p-4 flex flex-wrap items-center gap-3 justify-between text-[11px]">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-slate-400">Bugs squashed</span>
              <span className="text-lg font-semibold text-amber-300">
                {squashedCount}
                <span className="text-[11px] text-slate-400">
                  /{TARGET_SQUASHED}
                </span>
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
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Noise reduction</span>
              <span className="text-emerald-300 font-semibold">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-amber-400 via-emerald-400 to-emerald-500 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* GAME BOARD */}
        <div
          className="relative rounded-2xl bg-slate-950/95 border border-slate-800/80 p-3 sm:p-4 overflow-hidden cursor-crosshair"
          onClick={handleMissClick}
        >
          {/* Fondo con grid y glow al completar */}
          {puzzleSolved && (
            <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-emerald-500/15 via-amber-400/10 to-sky-400/20 blur-3xl" />
          )}
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-size-[18px_18px]" />

          {/* Texto explicativo */}
          <div className="relative z-10 mb-2 text-[11px] text-slate-400">
            <p>
              Click directly on the{' '}
              <span className="font-semibold text-amber-200">bugs</span> to squash
              them. Missing a click will reset your current streak.
            </p>
            <p className="mt-0.5">
              High streaks reduce the daemon&apos;s confidence that you&apos;ll
              &quot;just fix one more bug&quot;.
            </p>
          </div>

          {/* Zona jugable */}
          <div className="relative z-10 w-full h-48 sm:h-56 mt-2 rounded-xl border border-slate-700/70 bg-slate-950/80 overflow-hidden">
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
                  className={`absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-200
                    ${isHighlighted ? 'scale-110' : 'hover:scale-110'}
                  `}
                  style={{
                    left: `${bug.x}%`,
                    top: `${bug.y}%`,
                  }}
                >
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-lg
                      ${
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

          {/* Mensaje de éxito sobre el tablero */}
          {puzzleSolved && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
              <div className="px-4 py-2 rounded-full bg-emerald-500/90 text-slate-950 text-[11px] sm:text-[12px] font-semibold shadow-[0_0_30px_rgba(16,185,129,0.9)]">
                Noise level critically low – overtime daemon is getting nervous.
              </div>
            </div>
          )}
        </div>

        {/* PANEL DE PISTA / KILL CODE */}
        <div className="rounded-2xl bg-slate-950/95 border border-slate-800/80 p-3 sm:p-4 text-[11px]">
          {!puzzleSolved ? (
            <>
              <p className="text-slate-300 mb-1">
                Every unresolved bug is a tiny snack for the overtime daemon. It
                thrives on &quot;just one more fix&quot; at 17:05.
              </p>
              <p className="text-slate-400 mb-1">
                Squash at least{' '}
                <span className="font-semibold text-amber-200">
                  {TARGET_SQUASHED} bugs
                </span>{' '}
                in this fake tracker to starve it a little.
              </p>
              <p className="text-slate-500">
                Try to build up a good{' '}
                <span className="font-semibold text-slate-100">streak</span>. The daemon
                hates seeing consistent progress on closing bugs instead of opening
                new ones.
              </p>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-emerald-300 font-semibold">
                Bug wave contained – the daemon&apos;s snack queue is empty.
              </p>
              <p className="text-slate-200">
                As the last bug disappears from the tracker, a hidden maintenance note
                flashes briefly in the system logs:
              </p>

              <div className="mt-1 rounded-xl border border-emerald-400/80 bg-linear-to-br from-emerald-500/15 via-slate-950 to-emerald-500/10 p-3 shadow-[0_0_20px_rgba(52,211,153,0.45)]">
                <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-300 mb-1">
                  Kill code fragment unlocked
                </p>
                <p className="font-mono text-[11px] text-emerald-100 break-all">
                  Second fragment of the kill code:
                  <br />
                  <span className="font-semibold">+BUGS-FIXED</span>
                </p>
              </div>

              <p className="text-slate-400">
                Add this fragment to your StickyPad. The daemon can&apos;t keep feeding
                on a clean bug tracker forever.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BugSmasherApp;
