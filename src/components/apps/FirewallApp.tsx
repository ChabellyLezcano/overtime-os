'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { copyToClipboard } from '@/utils/copyToClipboard'; // ajusta la ruta si es distinta

type GameStatus = 'playing' | 'success' | 'failed';

interface Obstacle {
  id: number;
  x: number; // 0–100 (horizontal position)
  y: number; // 0–100 (vertical center)
  direction: 1 | -1; // moving up / down
  speed: number; // base speed
}

const FIREWALL_STORAGE_KEY = 'overtime-firewall-solved';
const SOLVED_TTL_MS = 15 * 60 * 1000; // 15 minutes
const FIREWALL_COMMAND = 'overtimectl arm-firewall';

const TRACK_STEPS = 14; // how many steps to reach the goal
const OBSTACLE_COUNT = 5; // vertical red bars

function createInitialObstacles(): Obstacle[] {
  // Spread obstacles between 20% and 80% of the track
  const minX = 20;
  const maxX = 80;
  const gap = (maxX - minX) / (OBSTACLE_COUNT - 1 || 1);

  return Array.from({ length: OBSTACLE_COUNT }, (_, i) => ({
    id: i,
    x: minX + gap * i,
    // Start obstacles near top or bottom, not exactly in the middle
    y: Math.random() < 0.5 ? 25 : 75,
    direction: Math.random() > 0.5 ? 1 : -1,
    speed: 0.3 + Math.random() * 0.25,
  }));
}

const FirewallApp: React.FC = () => {
  const [playerStep, setPlayerStep] = useState(0); // 0..TRACK_STEPS
  const [status, setStatus] = useState<GameStatus>('playing');
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>(() => createInitialObstacles());
  const [message, setMessage] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [copied, setCopied] = useState(false);

  // Track geometry
  const trackStartX = 8; // %
  const trackEndX = 88; // %

  const playerXPercent = useMemo(() => {
    const progress = playerStep / TRACK_STEPS;
    return trackStartX + (trackEndX - trackStartX) * progress;
  }, [playerStep]);

  const progressPercent = useMemo(
    () => Math.round((playerStep / TRACK_STEPS) * 100),
    [playerStep],
  );

  const distanceColor =
    progressPercent < 40
      ? 'text-sky-300'
      : progressPercent < 80
        ? 'text-amber-300'
        : 'text-emerald-300';

  /** ------------ Load persisted solved state (with TTL) ------------ */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(FIREWALL_STORAGE_KEY);
      if (!raw) return;

      // Old simple version: just "true"
      if (raw === 'true') {
        setPuzzleSolved(true);
        setStatus('success');
        setPlayerStep(TRACK_STEPS);
        return;
      }

      const data = JSON.parse(raw) as { solved?: boolean; expiresAt?: number };

      if (!data?.expiresAt) {
        window.localStorage.removeItem(FIREWALL_STORAGE_KEY);
        return;
      }

      if (data.solved && Date.now() < data.expiresAt) {
        setPuzzleSolved(true);
        setStatus('success');
        setPlayerStep(TRACK_STEPS);
      } else {
        window.localStorage.removeItem(FIREWALL_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error reading firewall minigame state from localStorage', error);
    }
  }, []);

  /** ------------ Persist solved state with TTL ------------ */
  const persistSolvedState = () => {
    if (typeof window === 'undefined') return;

    const payload = {
      solved: true,
      expiresAt: Date.now() + SOLVED_TTL_MS,
    };

    try {
      window.localStorage.setItem(FIREWALL_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error('Error saving firewall minigame state to localStorage', error);
    }
  };

  /** ------------ Keyboard control: ArrowRight / D to advance ------------ */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (puzzleSolved || status !== 'playing') return;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setPlayerStep((prev) => {
          const next = Math.min(TRACK_STEPS, prev + 1);

          if (next === TRACK_STEPS) {
            setStatus('success');
            setPuzzleSolved(true);
            setMessage(
              'You crossed the lane without touching any red barrier – clean exit.',
            );
            persistSolvedState();
          } else {
            setMessage(null);
          }

          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [puzzleSolved, status]);

  /** ------------ Animate obstacles (up/down, faster near the goal) ------------ */
  useEffect(() => {
    if (puzzleSolved || status !== 'playing') return;

    const interval = setInterval(() => {
      setObstacles((prev) => {
        const progress = playerStep / TRACK_STEPS; // 0..1
        const speedMultiplier = 0.5 + progress * 1.6; // slower at start, faster near end

        return prev.map((obs) => {
          let y = obs.y + obs.direction * obs.speed * speedMultiplier;
          let dir = obs.direction;

          if (y < 15) {
            y = 15;
            dir = 1;
          }
          if (y > 85) {
            y = 85;
            dir = -1;
          }

          return { ...obs, y, direction: dir };
        });
      });
    }, 60);

    return () => clearInterval(interval);
  }, [puzzleSolved, status, playerStep]);

  /** ------------ Collision detection ------------ */
  useEffect(() => {
    if (status !== 'playing' || puzzleSolved) return;

    const playerY = 50;

    const collision = obstacles.some((obs) => {
      const dx = Math.abs(obs.x - playerXPercent);
      const dy = Math.abs(obs.y - playerY);

      // Slightly smaller hitbox so timing feels fair
      const hitX = dx < 3.5;
      const hitY = dy < 18;

      return hitX && hitY;
    });

    if (collision) {
      setStatus('failed');
      setMessage(
        'You stepped into a red barrier. Wait until the lane in front of you is clearly empty before moving again.',
      );
      setAttempts((prev) => prev + 1);
      setCopied(false);
    }
  }, [obstacles, playerXPercent, status, puzzleSolved]);

  /** ------------ Reset run (but keep not-solved) ------------ */
  const resetRun = () => {
    if (puzzleSolved) return;
    setPlayerStep(0);
    setStatus('playing');
    setMessage(null);
    setCopied(false);
    setObstacles(createInitialObstacles());
  };

  /** ------------ Copy command helper (uses util) ------------ */
  const handleCopy = () => {
    void copyToClipboard(FIREWALL_COMMAND, {
      setCopied,
      timeoutMs: 1500,
    });
  };

  const trackStatusLabel =
    status === 'playing' ? 'running…' : status === 'success' ? 'completed' : 'blocked';

  const trackStatusColor =
    status === 'success'
      ? 'text-emerald-300'
      : status === 'failed'
        ? 'text-rose-300'
        : 'text-amber-300';

  return (
    <div className="flex h-full w-full flex-col overflow-hidden p-3 text-xs text-slate-100 sm:p-4 sm:text-sm">
      {/* HEADER */}
      <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-emerald-300 sm:text-base">
            Firewall Lane – Activation Run
          </h2>
          <p className="text-[11px] text-slate-300">
            Use the → key to guide your focus bubble in a straight line, dodging moving
            red barriers to reach the firewall console.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-[10px] text-slate-400">
          <span>
            Distance:{' '}
            <span className={`${distanceColor} font-semibold`}>{progressPercent}%</span>
          </span>
          <span>
            Attempts: <span className="font-semibold text-sky-300">{attempts}</span>
          </span>
          <span className="rounded-full border border-slate-700/80 bg-slate-950/90 px-2 py-0.5 text-slate-200">
            Status:{' '}
            <span className={`${trackStatusColor} font-semibold`}>
              {trackStatusLabel}
            </span>
          </span>
        </div>
      </div>

      {/* MAIN CONTENT: game + text */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto sm:gap-4">
        {/* GAME CARD */}
        <div className="flex flex-col items-center rounded-2xl border border-slate-800/80 bg-slate-950/95 p-3 sm:p-4">
          <p className="mb-2 max-w-md text-center text-[11px] text-slate-300">
            The bubble only moves{' '}
            <span className="font-semibold text-sky-300">forward</span>. Wait for the lane
            in front of you to be free of{' '}
            <span className="font-semibold text-rose-300">red bars</span>, then press
            <span className="font-mono"> → </span> (or{' '}
            <span className="font-mono">D</span>) to advance.
          </p>
          <p className="mb-3 text-center text-[10px] text-slate-500">
            If you collide with a red barrier, the run resets. Reaching the console
            without collisions unlocks the firewall activation command.
          </p>

          {/* GAME AREA */}
          <div className="relative aspect-[3/2] w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-inner">
            {/* Lane background */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.6),transparent_60%)] opacity-[0.15]" />
            <div className="absolute inset-x-[10%] top-1/2 h-[3px] -translate-y-1/2 bg-slate-700" />
            <div className="pointer-events-none absolute inset-y-[20%] right-[10%] left-[10%] rounded-xl border border-slate-700" />

            {/* Finish line / console */}
            <div className="absolute inset-y-[22%] right-[8%] w-[4px] bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            <div className="absolute top-1/2 right-[5%] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-300 bg-gradient-to-br from-emerald-500 to-emerald-600 text-[8px] font-semibold text-slate-950 shadow-[0_0_12px_rgba(52,211,153,0.9)]">
              FW
              <br />
              CON
            </div>

            {/* Obstacles (vertical red bars) */}
            {obstacles.map((obs) => {
              const height = 30;
              const top = Math.max(10, Math.min(90 - height, obs.y - height / 2));
              return (
                <div
                  key={obs.id}
                  className="absolute w-[6px] rounded-full bg-red-500 shadow-[0_0_10px_rgba(248,113,113,0.9)] sm:w-[8px]"
                  style={{
                    left: `${obs.x}%`,
                    top: `${top}%`,
                    height: `${height}%`,
                    transform: 'translateX(-50%)',
                  }}
                />
              );
            })}

            {/* Player bubble */}
            <div
              className={`absolute top-1/2 flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-semibold shadow-[0_0_14px_rgba(56,189,248,0.8)] transition-[left] duration-150 sm:h-8 sm:w-8 sm:text-[10px] ${
                status === 'success'
                  ? 'border border-emerald-100 bg-emerald-300 text-slate-900'
                  : status === 'failed'
                    ? 'border border-rose-100 bg-rose-400 text-slate-900'
                    : 'border border-sky-100 bg-sky-400 text-slate-900'
              }`}
              style={{
                left: `${playerXPercent}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {status === 'success' ? 'SYNC' : 'YOU'}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 w-full max-w-xs">
            <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
              <span>Distance to console</span>
              <span className={`${distanceColor} font-semibold`}>{progressPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-sky-400 via-amber-400 to-emerald-400 transition-all"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Controls / attempts */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-400">
            <button
              type="button"
              onClick={resetRun}
              disabled={puzzleSolved}
              className="rounded-full border border-slate-700 bg-slate-900 px-4 py-1.5 text-slate-200 transition hover:border-sky-400 hover:text-sky-200 disabled:cursor-default disabled:opacity-50"
            >
              Restart run
            </button>
            {puzzleSolved && (
              <span className="text-emerald-300">
                Completed – stored for ~15 minutes.
              </span>
            )}
          </div>
        </div>

        {/* STORY / COMMAND TEXT (debajo, como los otros juegos) */}
        <div className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/95 p-3 text-[11px] sm:p-4">
          {!message && status === 'playing' && (
            <p className="text-slate-300">
              Watch how the red barriers move. The safest runs are calm: wait for a clear
              window in front of you before taking the next step.
            </p>
          )}

          {status === 'failed' && (
            <p className="text-[10px] text-slate-400">
              Getting hit near the end is normal – that&apos;s when the daemon pushes
              hardest. Restart and try moving only when the space directly ahead is
              clearly empty.
            </p>
          )}

          {status === 'success' && (
            <div className="mt-1 space-y-2 rounded-xl border border-emerald-400/80 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-emerald-500/10 p-3 shadow-[0_0_18px_rgba(52,211,153,0.45)]">
              <p className="mb-1 text-[10px] tracking-[0.16em] text-emerald-300 uppercase">
                Firewall command unlocked
              </p>

              {/* Input + copy button */}
              <div className="space-y-1">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    readOnly
                    value={FIREWALL_COMMAND}
                    className="flex-1 overflow-x-auto rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 font-mono text-[11px] text-sky-200"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-slate-950 shadow-md shadow-emerald-500/40 transition hover:bg-emerald-400"
                  >
                    {copied ? 'Copied ✓' : 'Copy'}
                  </button>
                </div>
                {copied && (
                  <p className="text-[10px] text-emerald-300">
                    Command copied. Paste it into the Terminal mini-app to arm the
                    firewall.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FirewallApp;
