'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { copyToClipboard } from '@/utils/copyToClipboard';

const BAR_COUNT = 32;
const TARGET_PROGRESS = 95;
const TARGET_VOLUME = 63;
const TWO_PI = Math.PI * 2;
const STORAGE_KEY = 'wave-calibrator-solved';
const SOLVED_TTL_MS = 15 * 60 * 1000;
const WAVE_FRAGMENT = '+PLAYER-WAVE-ALIGNED';

function generateWaveValues(phase: number, amplitude: number): number[] {
  const values: number[] = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    const x = phase + (i / BAR_COUNT) * TWO_PI;
    const base = 0.2 + 0.8 * Math.abs(Math.sin(x));
    values.push(base * amplitude);
  }
  return values;
}

const MediaPlayerApp: React.FC = () => {
  const [progress, setProgress] = useState(10);
  const [volume, setVolume] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [alignmentPeak, setAlignmentPeak] = useState(0);

  // Shared temporal offset so both waves "breathe" together
  const [phaseOffset, setPhaseOffset] = useState(0);
  const [copied, setCopied] = useState(false);

  const targetPhase = (TARGET_PROGRESS / 100) * TWO_PI;
  const targetAmplitude = 0.9;

  const currentPhase = (progress / 100) * TWO_PI;
  const currentAmplitude = 0.4 + (volume / 100) * 0.6;

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
        setAlignmentPeak(100);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error reading solved state from localStorage', error);
    }
  }, []);

  // Animate phaseOffset while playing (both target and current waves move)
  useEffect(() => {
    if (!isPlaying || puzzleSolved) return;

    let frameId: number;
    const speed = 0.04;

    const loop = () => {
      setPhaseOffset((prev) => {
        let next = prev + speed;
        if (next > TWO_PI) next -= TWO_PI;
        return next;
      });
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, puzzleSolved]);

  // Auto-progress movement while playing
  useEffect(() => {
    if (!isPlaying || puzzleSolved) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 1.2;
        return next > 100 ? 0 : next;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying, puzzleSolved]);

  const targetWave = useMemo(
    () => generateWaveValues(targetPhase + phaseOffset, targetAmplitude),
    [targetPhase, targetAmplitude, phaseOffset],
  );

  const currentWave = useMemo(
    () => generateWaveValues(currentPhase + phaseOffset, currentAmplitude),
    [currentPhase, phaseOffset, currentAmplitude],
  );

  const progressDiff = Math.abs(progress - TARGET_PROGRESS);
  const volumeDiff = Math.abs(volume - TARGET_VOLUME);

  const rawScore = Math.max(0, 100 - (progressDiff * 2.2 + volumeDiff * 1.2));
  const alignmentScore = Math.min(100, rawScore);

  useEffect(() => {
    setAlignmentPeak((prev) => (alignmentScore > prev ? alignmentScore : prev));
  }, [alignmentScore]);

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
      console.error('Error saving solved state to localStorage', error);
    }
  };

  const handlePlayPause = () => {
    // If not solved yet and alignment is high enough, solve
    if (!puzzleSolved && alignmentScore >= 80) {
      setPuzzleSolved(true);
      setIsPlaying(false);
      persistSolvedState();
      return;
    }

    setIsPlaying((prev) => !prev);
  };

  const handleSeek = (value: number) => {
    setProgress(value);
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
  };

  const handleCopyFragment = () => {
    void copyToClipboard(WAVE_FRAGMENT, {
      setCopied,
      timeoutMs: 1500,
    });
  };

  const alignmentColor =
    alignmentScore >= 95
      ? 'text-emerald-300'
      : alignmentScore >= 50
        ? 'text-amber-300'
        : 'text-rose-300';

  const alignmentBarColor =
    alignmentScore >= 95
      ? 'from-emerald-400 via-emerald-300 to-emerald-500'
      : alignmentScore >= 50
        ? 'from-amber-400 via-amber-300 to-amber-500'
        : 'from-rose-500 via-rose-400 to-rose-500';

  return (
    <div className="text-body flex h-full w-full flex-col overflow-hidden p-3 text-slate-100 sm:p-4">
      {/* HEADER */}
      <div className="mb-3 flex items-center justify-between sm:mb-4">
        <div className="min-w-0">
          <h2 className="text-heading-sm truncate text-sky-200">Focus Wave Calibrator</h2>
          <p className="relative z-10 mb-2 text-xs text-slate-400 sm:mb-3">
            Align the <span className="font-semibold text-slate-200">colored wave</span>{' '}
            with the{' '}
            <span className="font-semibold text-slate-400">grey target wave</span>. Use
            the position and volume controls, then press the button when they visually
            match.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs text-slate-400">
          <span>Mode: Wave alignment</span>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs ${
              puzzleSolved
                ? 'border-emerald-400/80 bg-emerald-500/15 text-emerald-200'
                : 'border-rose-400/80 bg-rose-500/10 text-rose-200'
            }`}
          >
            {puzzleSolved ? 'Pattern matched ✓' : 'Signal unstable'}
          </span>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto sm:gap-4">
        {/* WAVE CARD */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/90 p-3 sm:p-4">
          {puzzleSolved && (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-400/20 via-sky-400/10 to-fuchsia-400/25 blur-3xl" />
          )}

          {/* Waves */}
          <div className="relative mt-1 h-28 w-full sm:h-32">
            {/* Target */}
            <div className="absolute inset-1 flex items-end gap-[3px] opacity-35">
              {targetWave.map((v, i) => (
                <div
                  key={`target-${i}`}
                  className="flex-1 rounded-full bg-slate-500"
                  style={{ height: `${v * 100}%` }}
                />
              ))}
            </div>

            {/* Current */}
            <div className="absolute inset-1 flex items-end gap-[3px]">
              {currentWave.map((v, i) => (
                <div
                  key={`current-${i}`}
                  className={`flex-1 rounded-full ${
                    puzzleSolved
                      ? 'bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]'
                      : 'bg-gradient-to-t from-sky-500 via-fuchsia-400 to-emerald-300 shadow-[0_0_10px_rgba(56,189,248,0.55)]'
                  }`}
                  style={{ height: `${v * 100}%` }}
                />
              ))}
            </div>
          </div>

          {/* Alignment meter */}
          <div className="relative z-10 mt-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-slate-400">Alignment</span>
              <span className={`${alignmentColor} font-semibold`}>
                {Math.round(alignmentScore)} %
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/80">
              <div
                className={`h-full bg-gradient-to-r ${alignmentBarColor} transition-all`}
                style={{ width: `${alignmentScore}%` }}
              />
            </div>
            {alignmentPeak > 0 && (
              <p className="mt-1 text-xs text-slate-500">
                Best alignment so far:{' '}
                <span className="font-semibold text-slate-300">
                  {Math.round(alignmentPeak)} %
                </span>
              </p>
            )}
          </div>
        </div>

        {/* CONTROLS */}
        <div className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/90 p-3 sm:p-4">
          {/* Progress */}
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
              <span>Position: {Math.round(progress)}%</span>
            </div>
            <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
              <div
                className="h-full bg-gradient-to-r from-sky-400 via-fuchsia-400 to-emerald-400 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
          </div>

          {/* Volume + play/check */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePlayPause}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold shadow-md transition ${
                puzzleSolved
                  ? 'cursor-default bg-emerald-500/90 text-slate-950 shadow-emerald-500/40'
                  : isPlaying
                    ? 'bg-rose-500 text-slate-950 shadow-rose-500/40 hover:bg-rose-400'
                    : 'bg-sky-500 text-slate-950 shadow-sky-500/40 hover:bg-sky-400'
              }`}
              disabled={puzzleSolved}
            >
              {puzzleSolved
                ? 'Alignment complete'
                : isPlaying
                  ? 'Pause / Check alignment'
                  : 'Check alignment / Play'}
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span>🔊</span>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-24 cursor-pointer sm:w-32"
              />
              <span className="w-10 text-right">{volume}%</span>
            </div>
          </div>
        </div>

        {/* HINT / SUCCESS PANEL */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/95 p-3 text-xs sm:p-4">
          {!puzzleSolved ? (
            <>
              <p className="mb-1 text-slate-300">
                The overtime daemon loves perfectly looped focus waves. Your goal is to
                disrupt its ideal pattern by matching it once and then breaking it.
              </p>
              <p className="mb-1 text-slate-400">
                Use the controls to visually align both waves. When you think they are
                aligned, press the button to check alignment.
              </p>
              <p className="text-slate-500">
                A <span className="font-semibold text-slate-100">high</span> alignment
                score will unlock something hidden in the player.
              </p>
            </>
          ) : (
            <div className="space-y-2">
              <div className="mt-1 space-y-2 rounded-xl border border-emerald-400/80 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-emerald-500/10 p-3 shadow-[0_0_20px_rgba(52,211,153,0.45)]">
                <p className="mb-1 text-xs tracking-[0.16em] text-emerald-300 uppercase">
                  Kill code fragment unlocked
                </p>

                {/* Input + copy button */}
                <div className="space-y-1">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      readOnly
                      value={WAVE_FRAGMENT}
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
                      Fragment copied. Paste it into your StickyPad alongside the other
                      pieces of the kill code.
                    </p>
                  )}
                </div>
              </div>

              <p className="text-slate-400">
                Add this fragment to your StickyPad. The daemon can&apos;t stand when its
                soundtrack stops being perfectly aligned.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaPlayerApp;
