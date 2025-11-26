'use client';

import React, { useEffect, useState } from 'react';

const BAR_COUNT = 32;

// Hidden target
const TARGET_PROGRESS = 74; // 0–100
const TARGET_VOLUME = 63;   // 0–100

const TWO_PI = Math.PI * 2;

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

  const targetPhase = (TARGET_PROGRESS / 100) * TWO_PI;
  const targetAmplitude = 0.9;
  const targetWave = generateWaveValues(targetPhase, targetAmplitude);

  const currentPhase = (progress / 100) * TWO_PI;
  const currentAmplitude = 0.4 + (volume / 100) * 0.6;
  const currentWave = generateWaveValues(currentPhase, currentAmplitude);

  const progressDiff = Math.abs(progress - TARGET_PROGRESS);
  const volumeDiff = Math.abs(volume - TARGET_VOLUME);
  const rawScore = Math.max(
    0,
    100 - (progressDiff * 3 + volumeDiff * 1.5),
  );
  const alignmentScore = Math.min(100, rawScore);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAlignmentPeak((prev) => (alignmentScore > prev ? alignmentScore : prev));
  }, [alignmentScore]);

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

  const handlePlayPause = () => {
    // Check success when going from playing -> paused
    if (isPlaying && !puzzleSolved) {
      if (alignmentScore >= 85) {
        setPuzzleSolved(true);
        setIsPlaying(false);
        return;
      }
    }
    setIsPlaying((prev) => !prev);
  };

  const handleSeek = (value: number) => {
    setProgress(value);
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
  };

  const alignmentColor =
    alignmentScore >= 80
      ? 'text-emerald-300'
      : alignmentScore >= 50
      ? 'text-amber-300'
      : 'text-rose-300';

  const alignmentBarColor =
    alignmentScore >= 80
      ? 'from-emerald-400 via-emerald-300 to-emerald-500'
      : alignmentScore >= 50
      ? 'from-amber-400 via-amber-300 to-amber-500'
      : 'from-rose-500 via-rose-400 to-rose-500';

  return (
    <div className="w-full h-full flex flex-col p-3 sm:p-4 text-xs sm:text-md text-slate-100 overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="min-w-0">
          <h2 className="text-md sm:text-base font-semibold text-sky-200 truncate">
            Focus Wave Calibrator
          </h2>
          <p className="text-[11px] text-slate-300 truncate">
            Align your focus wave with the daemon&apos;s target pattern.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-[10px] text-slate-400">
          <span>Mode: Wave alignment</span>
          <span
            className={`px-2 py-0.5 rounded-full border text-[10px] ${
              puzzleSolved
                ? 'border-emerald-400/80 bg-emerald-500/15 text-emerald-200'
                : 'border-rose-400/80 bg-rose-500/10 text-rose-200'
            }`}
          >
            {puzzleSolved ? 'Pattern matched ✓' : 'Signal unstable'}
          </span>
        </div>
      </div>

      {/* CONTENIDO SCROLLABLE */}
      <div className="flex-1 min-h-0 flex flex-col gap-3 sm:gap-4 overflow-y-auto">
        {/* WAVE CARD */}
        <div className="relative rounded-2xl bg-slate-950/90 border border-slate-800/80 p-3 sm:p-4 overflow-hidden">
          {/* Glow when solved */}
          {puzzleSolved && (
            <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-emerald-400/20 via-sky-400/10 to-fuchsia-400/25 blur-3xl" />
          )}

          {/* Success badge grande */}
          {puzzleSolved && (
            <div className="absolute top-2 inset-x-0 flex justify-center z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/80 text-[10px] sm:text-[11px] text-emerald-100 shadow-[0_0_18px_rgba(52,211,153,0.7)] backdrop-blur">
                <span className="text-[12px]">✨</span>
                <span className="font-semibold tracking-[0.14em] uppercase">
                  Alignment locked
                </span>
                <span className="text-[12px]">✓</span>
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-400 mb-2 sm:mb-3">
            Align the{' '}
            <span className="font-semibold text-slate-200">colored wave</span> with the{' '}
            <span className="font-semibold text-slate-400">grey target wave</span>. Use
            the position and volume controls, then pause when they visually match.
          </p>

          {/* Waves */}
          <div className="relative w-full h-28 sm:h-32 mt-1">
            {/* Target wave (grey) */}
            <div className="absolute inset-1 flex items-end gap-[3px] opacity-35">
              {targetWave.map((v, i) => (
                <div
                  key={`target-${i}`}
                  className="flex-1 rounded-full bg-slate-500"
                  style={{ height: `${v * 100}%` }}
                />
              ))}
            </div>

            {/* Current wave (color) */}
            <div className="absolute inset-1 flex items-end gap-[3px]">
              {currentWave.map((v, i) => (
                <div
                  key={`current-${i}`}
                  className={`flex-1 rounded-full ${
                    puzzleSolved
                      ? 'bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]'
                      : 'bg-linear-to-t from-sky-500 via-fuchsia-400 to-emerald-300 shadow-[0_0_10px_rgba(56,189,248,0.55)]'
                  }`}
                  style={{ height: `${v * 100}%` }}
                />
              ))}
            </div>
          </div>

          {/* Alignment meter */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-400">Alignment</span>
              <span className={`${alignmentColor} font-semibold`}>
                {Math.round(alignmentScore)} %
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
              <div
                className={`h-full bg-linear-to-r ${alignmentBarColor} transition-all`}
                style={{ width: `${alignmentScore}%` }}
              />
            </div>
            {alignmentPeak > 0 && (
              <p className="mt-1 text-[10px] text-slate-500">
                Best alignment so far:{' '}
                <span className="font-semibold text-slate-300">
                  {Math.round(alignmentPeak)} %
                </span>
              </p>
            )}
          </div>
        </div>

        {/* CONTROLES */}
        <div className="rounded-2xl bg-slate-950/90 border border-slate-800/80 p-3 sm:p-4 space-y-3">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Position: {Math.round(progress)}%</span>
              <span>Target: ~{TARGET_PROGRESS}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-linear-to-r from-sky-400 via-fuchsia-400 to-emerald-400 transition-all"
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

          {/* Volume + play */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePlayPause}
              className={`px-4 py-1.5 rounded-full text-[11px] font-semibold shadow-md transition
                ${
                  isPlaying
                    ? 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-rose-500/40'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/40'
                }`}
            >
              {isPlaying ? 'Pause & check alignment' : 'Play wave'}
            </button>

            <div className="flex items-center gap-2 text-[10px] text-slate-300">
              <span>🔊</span>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-24 sm:w-32 cursor-pointer"
              />
              <span className="w-10 text-right">{volume}%</span>
            </div>
          </div>
        </div>

        {/* PANEL DE PISTA / ÉXITO */}
        <div className="rounded-2xl bg-slate-950/95 border border-slate-800/80 p-3 sm:p-4 text-[11px]">
          {!puzzleSolved ? (
            <>
              <p className="text-slate-300 mb-1">
                The overtime daemon loves perfectly looped focus waves. Your goal is to
                disrupt its ideal pattern by matching it once and then breaking it.
              </p>
              <p className="text-slate-400 mb-1">
                Use the controls to visually align both waves. When you think they are
                aligned, hit{' '}
                <span className="font-semibold text-slate-100">Pause</span> while the wave
                is still moving.
              </p>
              <p className="text-slate-500">
                Only a <span className="font-semibold text-slate-100">near-perfect</span>{' '}
                alignment will make the hidden debug overlay appear.
              </p>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-emerald-300 font-semibold">
                Wave pattern locked – the daemon&apos;s favorite loop is broken.
              </p>
              <p className="text-slate-200">
                In the flicker of a debug overlay, the player reveals something the daemon
                didn&apos;t want you to see:
              </p>

              {/* Bloque de éxito bien marcado */}
              <div className="mt-1 rounded-xl border border-emerald-400/80 bg-linear-to-br from-emerald-500/15 via-slate-950 to-emerald-500/10 p-3 shadow-[0_0_20px_rgba(52,211,153,0.45)]">
                <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-300 mb-1">
                  Kill code fragment unlocked
                </p>
                <p className="font-mono text-[11px] text-emerald-100 break-all">
                  Fourth fragment of the kill code:
                  <br />
                  <span className="font-semibold">
                    +PLAYER-WAVE-ALIGNED
                  </span>
                </p>
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
