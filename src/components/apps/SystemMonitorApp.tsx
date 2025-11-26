'use client';

import React, { useEffect, useMemo, useState } from 'react';

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

const SystemMonitorApp: React.FC = () => {
  const [processes, setProcesses] = useState<Process[]>(() =>
    INITIAL_PROCESSES,
  );
  const [focusMode, setFocusMode] = useState(false);
  const [notificationsMuted, setNotificationsMuted] = useState(false);
  const [autoSyncOff, setAutoSyncOff] = useState(false);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  // Fake metric noise
  const [baselineCpu, setBaselineCpu] = useState(40);
  const [baselineMem, setBaselineMem] = useState(40);

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

  const activeProcesses = useMemo(
    () => processes.filter((p) => p.active),
    [processes],
  );

  const daemon = useMemo(
    () => processes.find((p) => p.type === 'daemon'),
    [processes],
  );

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

    const noiseCount = activeProcesses.filter(
      (p) => p.type === 'noise',
    ).length;
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
    !puzzleSolved &&
    strainScore <= safeStrainThreshold &&
    daemon?.active === true;

  const toggleProcess = (id: string) => {
    if (puzzleSolved) return;
    if (id === 'daemon') return; // only kill via special button

    setProcesses((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, active: !p.active } : p,
      ),
    );
    setHint(null);
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
      prev.map((p) =>
        p.id === 'daemon' ? { ...p, active: false } : p,
      ),
    );
    setPuzzleSolved(true);
    setHint(null);
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
    <div className="w-full h-full flex flex-col p-3 sm:p-4 text-xs sm:text-sm text-slate-100 overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-3">
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-semibold text-emerald-300 truncate">
            System Monitor – Daemon Load
          </h2>
          <p className="text-[11px] text-slate-300 truncate">
            Reduce overall strain and shut down the overtime daemon safely.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-[10px] text-slate-400">
          <span>Strain score:</span>
          <span
            className={`px-2 py-0.5 rounded-full border text-[10px] ${strainColor} ${
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
      <div className="flex-1 min-h-0 flex flex-col gap-3 sm:gap-4 overflow-y-auto">
        {/* METRICS CARD */}
        <div className="rounded-2xl bg-slate-950/95 border border-slate-800/80 p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* CPU */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-400">CPU usage</span>
                <span className={cpuColor}>{Math.round(totalCpu)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800/80">
                <div
                  className="h-full bg-linear-to-r from-emerald-400 via-amber-400 to-rose-400 transition-all"
                  style={{ width: `${totalCpu}%` }}
                />
              </div>
            </div>

            {/* MEM */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-400">Memory usage</span>
                <span className={memColor}>{Math.round(totalMem)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800/80">
                <div
                  className="h-full bg-linear-to-r from-emerald-400 via-amber-400 to-rose-400 transition-all"
                  style={{ width: `${totalMem}%` }}
                />
              </div>
            </div>

            {/* DAEMON LOAD */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-400">Daemon load</span>
                <span className={daemonColor}>{Math.round(daemonLoad)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800/80">
                <div
                  className="h-full bg-linear-to-r from-slate-500 via-amber-400 to-rose-500 transition-all"
                  style={{ width: `${daemonLoad}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            The overtime daemon thrives when system strain is high. You need to bring
            the overall score down before it is safe to terminate the process.
          </p>
        </div>

        {/* CONTROL TOGGLES */}
        <div className="rounded-2xl bg-slate-950/95 border border-slate-800/80 p-3 sm:p-4 space-y-2 text-[11px]">
          <p className="text-slate-300 mb-1">
            Use soft controls first. Hard-killing processes while the system is under
            heavy load might make the daemon respawn in a worse mood.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                if (puzzleSolved) return;
                setFocusMode((prev) => !prev);
                setHint(null);
              }}
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left transition ${
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
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left transition ${
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
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left transition ${
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
        <div className="rounded-2xl bg-slate-950/95 border border-slate-800/80 p-3 sm:p-4 space-y-3 text-[11px]">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-slate-300">
              Toggle noisy processes. Then, when the strain is low enough, terminate the
              daemon cleanly.
            </p>
            <button
              type="button"
              onClick={handleKillDaemon}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold shadow-md transition
                ${
                  isDaemonKillEnabled
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/50'
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
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] text-[10px] bg-slate-900/90 border-b border-slate-800/80 px-2 py-1.5 text-slate-400">
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
                  className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center px-2 py-1.5 mr-2 text-[10px] border-t border-slate-800/80 bg-slate-950/90"
                >
                  <span className={`${rowColor} truncate`}>{p.name}</span>
                  <span className="text-right text-slate-300">
                    {p.active ? `${p.cpu}%` : '—'}
                  </span>
                  <span className="text-right text-slate-300">
                    {p.active ? `${p.mem}%` : '—'}
                  </span>
                  <div className="flex justify-end">
                    {p.type === 'daemon' ? (
                      <span
                        className={`px-2 py-0.5 rounded-full border ${
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
                        className={`px-2 py-0.5 rounded-full border transition ${
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
        <div className="rounded-2xl bg-slate-950/95 border border-slate-800/80 p-3 sm:p-4 text-[11px]">
          {!puzzleSolved ? (
            <>
              <p className="text-slate-300 mb-1">
                If you slam the “kill” button while the system is still burning, the
                daemon might just fork itself into a background job.
              </p>
              <p className="text-slate-400">
                Lower the <span className="font-semibold">strain score</span> first,
                then terminate <span className="font-mono">overtime-daemon</span> when it
                least expects it.
              </p>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-emerald-300 font-semibold">
                Overtime-daemon terminated – system load normalized.
              </p>
              <p className="text-slate-200">
                With the daemon gone, the monitor briefly exposes a maintenance banner
                left by some tired engineer:
              </p>

              <div className="mt-1 rounded-xl border border-emerald-400/80 bg-linear-to-br from-emerald-500/15 via-slate-950 to-emerald-500/10 p-3 shadow-[0_0_20px_rgba(52,211,153,0.45)]">
                <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-300 mb-1">
                  Kill code fragment unlocked
                </p>
                <p className="font-mono text-[11px] text-emerald-100 break-all">
                  First fragment of the kill code:
                  <br />
                  <span className="font-semibold">+SYSTEM-DRAINED</span>
                </p>
              </div>

              <p className="text-slate-400">
                Add this fragment to StickyPad. A calm system is the daemon&apos;s
                least favorite environment.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemMonitorApp;
