'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { copyToClipboard } from '@/utils/copyToClipboard'; // ajusta la ruta si hace falta

interface Process {
  id: string;
  name: string;
  cpu: number;
  mem: number;
  type: 'noise' | 'harmless' | 'daemon';
  active: boolean;
}

const INITIAL_PROCESSES: Process[] = [
  {
    id: 'tickets',
    name: 'ticket-cruncher.service',
    cpu: 35,
    mem: 18,
    type: 'noise',
    active: true,
  },
  {
    id: 'chat',
    name: 'endless-chat-threads',
    cpu: 18,
    mem: 12,
    type: 'noise',
    active: true,
  },
  {
    id: 'build',
    name: 'infinite-build-watch',
    cpu: 22,
    mem: 15,
    type: 'noise',
    active: true,
  },
  {
    id: 'music',
    name: 'focus-music-player',
    cpu: 5,
    mem: 8,
    type: 'harmless',
    active: true,
  },
  {
    id: 'daemon',
    name: 'overtime-daemon',
    cpu: 20,
    mem: 10,
    type: 'daemon',
    active: true,
  },
];

// LocalStorage config for this minigame
const STORAGE_KEY = 'system-monitor-solved';
const SOLVED_TTL_MS = 15 * 60 * 1000; // 15 minutes

const SYSTEM_FRAGMENT = '+SYSTEM-DRAINED';

const SystemMonitorApp: React.FC = () => {
  const [processes, setProcesses] = useState<Process[]>(() => INITIAL_PROCESSES);
  const [focusMode, setFocusMode] = useState(false);
  const [notificationsMuted, setNotificationsMuted] = useState(false);
  const [autoSyncOff, setAutoSyncOff] = useState(false);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fake metric noise
  const [baselineCpu, setBaselineCpu] = useState(40);
  const [baselineMem, setBaselineMem] = useState(40);

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
        // Mark puzzle as solved and ensure daemon is terminated
        setPuzzleSolved(true);
        setProcesses((prev) =>
          prev.map((p) => (p.id === 'daemon' ? { ...p, active: false } : p)),
        );
        setHint(null);
      } else {
        // Expired, clean up
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error reading system monitor state from localStorage', error);
    }
  }, []);

  // Animate baseline CPU/MEM noise while puzzle is not solved
  useEffect(() => {
    if (puzzleSolved) return;

    const interval = setInterval(() => {
      setBaselineCpu((prev) => {
        const delta = (Math.random() - 0.5) * 4;
        const next = prev + delta;
        return Math.min(70, Math.max(30, next));
      });
      setBaselineMem((prev) => {
        const delta = (Math.random() - 0.5) * 3;
        const next = prev + delta;
        return Math.min(70, Math.max(25, next));
      });
    }, 900);

    return () => clearInterval(interval);
  }, [puzzleSolved]);

  const activeProcesses = useMemo(() => processes.filter((p) => p.active), [processes]);

  const daemon = useMemo(() => processes.find((p) => p.type === 'daemon'), [processes]);

  const totalCpu = useMemo(() => {
    const procCpu = activeProcesses.reduce((sum, p) => sum + p.cpu, 0);
    let value = baselineCpu + procCpu * 0.6;

    if (focusMode) value -= 10;
    if (notificationsMuted) value -= 6;
    if (autoSyncOff) value -= 5;

    return Math.max(5, Math.min(100, value));
  }, [activeProcesses, baselineCpu, focusMode, notificationsMuted, autoSyncOff]);

  const totalMem = useMemo(() => {
    const procMem = activeProcesses.reduce((sum, p) => sum + p.mem, 0);
    let value = baselineMem + procMem * 0.8;

    if (focusMode) value -= 8;
    if (notificationsMuted) value -= 4;
    if (autoSyncOff) value -= 4;

    return Math.max(5, Math.min(100, value));
  }, [activeProcesses, baselineMem, focusMode, notificationsMuted, autoSyncOff]);

  const daemonLoad = useMemo(() => {
    let value = 40;

    const noiseCount = activeProcesses.filter((p) => p.type === 'noise').length;
    value += noiseCount * 10;

    if (focusMode) value -= 12;
    if (notificationsMuted) value -= 8;
    if (autoSyncOff) value -= 6;

    return Math.max(0, Math.min(100, value));
  }, [activeProcesses, focusMode, notificationsMuted, autoSyncOff]);

  const strainScore = useMemo(() => {
    return Math.round((totalCpu * 0.4 + totalMem * 0.3 + daemonLoad * 0.3) / 1.0);
  }, [totalCpu, totalMem, daemonLoad]);

  const safeStrainThreshold = 38;
  const isDaemonKillEnabled =
    !puzzleSolved && strainScore <= safeStrainThreshold && daemon?.active === true;

  const toggleProcess = (id: string) => {
    if (puzzleSolved) return;
    if (id === 'daemon') return; // only kill via special button

    setProcesses((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)),
    );
    setHint(null);
  };

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
      console.error('Error saving system monitor state to localStorage', error);
    }
  };

  const handleKillDaemon = () => {
    if (puzzleSolved) return;

    if (!isDaemonKillEnabled) {
      setHint(
        'Killing the daemon with high system strain might cause it to respawn. Try lowering the overall load first.',
      );
      return;
    }

    setProcesses((prev) =>
      prev.map((p) => (p.id === 'daemon' ? { ...p, active: false } : p)),
    );
    setPuzzleSolved(true);
    setHint(null);
    persistSolvedState();
  };

  const handleCopyFragment = () => {
    void copyToClipboard(SYSTEM_FRAGMENT, {
      setCopied,
      timeoutMs: 1500,
    });
  };

  const cpuColor =
    totalCpu > 80
      ? 'text-rose-300'
      : totalCpu > 60
        ? 'text-amber-300'
        : 'text-emerald-300';

  const memColor =
    totalMem > 80
      ? 'text-rose-300'
      : totalMem > 60
        ? 'text-amber-300'
        : 'text-emerald-300';

  const daemonColor =
    daemonLoad > 80
      ? 'text-rose-300'
      : daemonLoad > 50
        ? 'text-amber-300'
        : 'text-emerald-300';

  const strainColor =
    strainScore > 75
      ? 'text-rose-300'
      : strainScore > 50
        ? 'text-amber-300'
        : 'text-emerald-300';

  return (
    <div className="flex h-full w-full flex-col overflow-hidden p-3 text-xs text-slate-100 sm:p-4 sm:text-sm">
      {/* HEADER */}
      <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-emerald-300 sm:text-base">
            System Monitor – Daemon Load
          </h2>
          <p className="truncate text-[11px] text-slate-300">
            Reduce overall strain and shut down the overtime daemon safely.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-[10px] text-slate-400">
          <span>Strain score:</span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] ${strainColor} ${
              puzzleSolved
                ? 'border-emerald-400/80 bg-emerald-500/15'
                : 'border-slate-700/80 bg-slate-950/90'
            }`}
          >
            {strainScore}
          </span>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto sm:gap-4">
        {/* METRICS CARD */}
        <div className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/95 p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* CPU */}
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">CPU usage</span>
                <span className={cpuColor}>{Math.round(totalCpu)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800/80">
                <div
                  className="h-full bg-linear-to-r from-emerald-400 via-amber-400 to-rose-400 transition-all"
                  style={{ width: `${totalCpu}%` }}
                />
              </div>
            </div>

            {/* MEM */}
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Memory usage</span>
                <span className={memColor}>{Math.round(totalMem)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800/80">
                <div
                  className="h-full bg-linear-to-r from-emerald-400 via-amber-400 to-rose-400 transition-all"
                  style={{ width: `${totalMem}%` }}
                />
              </div>
            </div>

            {/* DAEMON LOAD */}
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Daemon load</span>
                <span className={daemonColor}>{Math.round(daemonLoad)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800/80">
                <div
                  className="h-full bg-linear-to-r from-slate-500 via-amber-400 to-rose-500 transition-all"
                  style={{ width: `${daemonLoad}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            The overtime daemon thrives when system strain is high. You need to bring the
            overall score down before it is safe to terminate the process.
          </p>
        </div>

        {/* CONTROL TOGGLES */}
        <div className="space-y-2 rounded-2xl border border-slate-800/80 bg-slate-950/95 p-3 text-[11px] sm:p-4">
          <p className="mb-1 text-slate-300">
            Use soft controls first. Hard-killing processes while the system is under
            heavy load might make the daemon respawn in a worse mood.
          </p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => {
                if (puzzleSolved) return;
                setFocusMode((prev) => !prev);
                setHint(null);
              }}
              className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition ${
                focusMode
                  ? 'border-emerald-400/80 bg-emerald-500/10 text-emerald-100'
                  : 'border-slate-700 bg-slate-950 text-slate-200 hover:border-emerald-400/60'
              }`}
            >
              <div>
                <p className="font-semibold">Focus mode</p>
                <p className="text-[10px] text-slate-400">
                  Hides non-critical UI and reduces context switching.
                </p>
              </div>
              <span className="text-[11px] font-semibold">
                {focusMode ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (puzzleSolved) return;
                setNotificationsMuted((prev) => !prev);
                setHint(null);
              }}
              className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition ${
                notificationsMuted
                  ? 'border-emerald-400/80 bg-emerald-500/10 text-emerald-100'
                  : 'border-slate-700 bg-slate-950 text-slate-200 hover:border-emerald-400/60'
              }`}
            >
              <div>
                <p className="font-semibold">Mute notifications</p>
                <p className="text-[10px] text-slate-400">
                  Silences chat pings, email popups and &quot;quick questions&quot;.
                </p>
              </div>
              <span className="text-[11px] font-semibold">
                {notificationsMuted ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (puzzleSolved) return;
                setAutoSyncOff((prev) => !prev);
                setHint(null);
              }}
              className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition ${
                autoSyncOff
                  ? 'border-emerald-400/80 bg-emerald-500/10 text-emerald-100'
                  : 'border-slate-700 bg-slate-950 text-slate-200 hover:border-emerald-400/60'
              }`}
            >
              <div>
                <p className="font-semibold">Disable auto-sync</p>
                <p className="text-[10px] text-slate-400">
                  Stops pointless background refreshes that no one asked for.
                </p>
              </div>
              <span className="text-[11px] font-semibold">
                {autoSyncOff ? 'OFF' : 'ON'}
              </span>
            </button>
          </div>
        </div>

        {/* PROCESS LIST + KILL BUTTON */}
        <div className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/95 p-3 text-[11px] sm:p-4">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-slate-300">
              Toggle noisy processes. Then, when the strain is low enough, terminate the
              daemon cleanly.
            </p>
            <button
              type="button"
              onClick={handleKillDaemon}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-md transition ${
                isDaemonKillEnabled
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/50 hover:bg-emerald-400'
                  : 'bg-slate-800 text-slate-300 shadow-none'
              }`}
            >
              Kill overtime-daemon
            </button>
          </div>

          {hint && !puzzleSolved && (
            <div className="mb-2 rounded-lg border border-amber-400/80 bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-100">
              {hint}
            </div>
          )}

          <div className="rounded-xl border border-slate-800/80">
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] border-b border-slate-800/80 bg-slate-900/90 px-2 py-1.5 text-[10px] text-slate-400">
              <span>Process</span>
              <span className="text-right">CPU</span>
              <span className="text-right">MEM</span>
              <span className="text-right">State</span>
            </div>
            {processes.map((p) => {
              const rowColor =
                p.type === 'daemon'
                  ? 'text-rose-300'
                  : p.type === 'noise'
                    ? 'text-amber-200'
                    : 'text-slate-200';
              return (
                <div
                  key={p.id}
                  className="mr-2 grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center border-t border-slate-800/80 bg-slate-950/90 px-2 py-1.5 text-[10px]"
                >
                  <span className={`${rowColor} truncate`}>{p.name}</span>
                  <span className="text-right text-slate-300">
                    {p.active ? `${p.cpu}%` : '—'}
                  </span>
                  <span className="mr-2 text-right text-slate-300">
                    {p.active ? `${p.mem}%` : '—'}
                  </span>
                  <div className="flex justify-end">
                    {p.type === 'daemon' ? (
                      <span
                        className={`rounded-full border px-2 py-0.5 ${
                          p.active
                            ? 'border-rose-400/80 bg-rose-500/10 text-rose-200'
                            : 'border-emerald-400/80 bg-emerald-500/10 text-emerald-200'
                        }`}
                      >
                        {p.active ? 'running' : 'terminated'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleProcess(p.id)}
                        className={`rounded-full border px-2 py-0.5 transition ${
                          p.active
                            ? 'border-amber-400/80 bg-amber-500/15 text-amber-100 hover:border-amber-300'
                            : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-emerald-400/60'
                        }`}
                      >
                        {p.active ? 'snooze' : 'resume'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* KILL CODE PANEL */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/95 p-3 text-[11px] sm:p-4">
          {!puzzleSolved ? (
            <>
              <p className="mb-1 text-slate-300">
                If you slam the “kill” button while the system is still burning, the
                daemon might just fork itself into a background job.
              </p>
              <p className="text-slate-400">
                Lower the <span className="font-semibold">strain score</span> first, then
                terminate <span className="font-mono">overtime-daemon</span> when it least
                expects it.
              </p>
            </>
          ) : (
            <div className="space-y-2">
              <p className="font-semibold text-emerald-300">
                Overtime-daemon terminated – system load normalized.
              </p>

              <div className="mt-1 space-y-2 rounded-xl border border-emerald-400/80 bg-linear-to-br from-emerald-500/15 via-slate-950 to-emerald-500/10 p-3 shadow-[0_0_20px_rgba(52,211,153,0.45)]">
                <p className="mb-1 text-[10px] tracking-[0.16em] text-emerald-300 uppercase">
                  Kill code fragment unlocked
                </p>

                {/* Input + copy for fragment */}
                <div className="space-y-1">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      readOnly
                      value={SYSTEM_FRAGMENT}
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
                      Fragment copied. Paste it into your StickyPad along with the other
                      kill code fragments.
                    </p>
                  )}
                </div>
              </div>

              <p className="text-slate-400">
                Add this fragment to StickyPad. A calm system is the daemon&apos;s least
                favorite environment.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemMonitorApp;
