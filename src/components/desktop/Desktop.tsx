'use client';

import React, { useEffect, useState } from 'react';
import { useWindowManager, WindowInstance } from '@/context/WindowManagerContext';
import WindowFrame from './WindowFrame';
import Dock from './Dock';
import Taskbar from './Taskbar';

import NotesApp from '@/components/apps/NotesApp';
import StickyPadApp from '@/components/apps/StickyPadApp';
import MediaPlayerApp from '@/components/apps/MediaPlayerApp';
import BugSmasherApp from '@/components/apps/BugSmasherApp';
import MergeConflictApp from '@/components/apps/MergeConflictApp';
import SystemMonitorApp from '@/components/apps/SystemMonitorApp';
import TerminalApp from '@/components/apps/TerminalApp';
import FirewallApp from '@/components/apps/FirewallApp';
import PowerApp from '@/components/apps/PowerApp';
import VirusApp from '@/components/apps/VirusApp';

// Decide which app to render
function renderApp(win: WindowInstance) {
  switch (win.appId) {
    case 'notes':
      return <NotesApp />;
    case 'sticky-pad':
      return <StickyPadApp />;
    case 'media-player':
      return <MediaPlayerApp />;
    case 'mini-game-bugs':
      return <BugSmasherApp />;
    case 'merge-tool':
      return <MergeConflictApp />;
    case 'system-monitor':
      return <SystemMonitorApp />;
    case 'terminal':
      return <TerminalApp />;
    case 'firewall':
      return <FirewallApp />;
    case 'power':
      return <PowerApp />;
    case 'virus':
      return <VirusApp />;
    default:
      return (
        <div className="w-full h-full flex items-center justify-center text-xs text-slate-300">
          Unknown app: <span className="ml-1 font-mono">{win.appId}</span>
        </div>
      );
  }
}

const Desktop: React.FC = () => {
  const { windows, openWindow, isShuttingDown, daemonKilled } = useWindowManager();
  const [showIntroModal, setShowIntroModal] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleIntroStart = () => {
    setShowIntroModal(false);
    const hasVirusWindow = windows.some((w) => w.appId === 'virus');
    if (!hasVirusWindow) {
      openWindow('virus', {
        x: 100,
        y: 90,
        width: 640,
        height: 380,
      });
    }
  };

  useEffect(() => {
    if (daemonKilled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSuccessModal(true);
    }
  }, [daemonKilled]);

  // Pantalla final de apagado
  if (isShuttingDown) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm sm:text-base text-slate-400 uppercase tracking-[0.28em] mb-1">
            overtime os
          </p>
          <p className="text-3xl sm:text-4xl font-semibold text-slate-100">
            The End
          </p>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            You clocked out. No more unpaid overtime today.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 text-slate-50 relative">
      {/* 🎨 Fondo colorido + onda animada */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Capa base: gradiente oscuro con toques de color */}
        <div className="absolute inset-0 bg-linear-to-br from-blue-950 via-blue-500 to-slate-100" />

        {/* Orbes de color suaves, con mezcla para que quede chill */}
        <div
          className="
            absolute inset-[-20%]
            bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.55),transparent_55%),radial-gradient(circle_at_100%_10%,rgba(244,114,182,0.45),transparent_55%),radial-gradient(circle_at_15%_100%,rgba(52,211,153,0.5),transparent_55%),radial-gradient(circle_at_85%_95%,rgba(250,204,21,0.45),transparent_60%)]
            opacity-75
            mix-blend-screen
          "
        />

        {/* Halo central suave */}
        <div className="absolute left-1/2 top-1/2 w-[520px] h-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/25 blur-3xl opacity-60" />

        {/* 🌊 Onda animada, lenta y relajante */}
        <div className="absolute -bottom-32 left-0 w-[200%] h-[260px] opacity-75">
          <div className="overtime-wave-motion w-[200%] h-full">
            <svg
              className="w-full h-full"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="overtimeWaveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                  <stop offset="40%" stopColor="#a855f7" stopOpacity="0.9" />
                  <stop offset="70%" stopColor="#22c55e" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#eab308" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              <path
                fill="url(#overtimeWaveGradient)"
                fillOpacity="0.85"
                d="
                  M0,200
                  C120,240 240,160 360,180
                  C480,200 600,260 720,230
                  C840,200 960,140 1080,150
                  C1200,160 1320,210 1440,220
                  L1440,320
                  L0,320
                  Z
                "
              />
            </svg>
          </div>
        </div>

        {/* Grid sutil encima */}
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none
                     bg-[linear-gradient(to_right,#ffffff18_1px,transparent_1px),linear-gradient(to_bottom,#ffffff18_1px,transparent_1px)]
                     bg-size-[48px_48px]"
        />
      </div>

      {/* Top bar */}
      <Taskbar />

      {/* Capa de ventanas */}
      <div className="absolute inset-0 pt-10 pb-20">
        {windows.map((win) => (
          <WindowFrame key={win.id} window={win}>
            {renderApp(win)}
          </WindowFrame>
        ))}
      </div>

      {/* Dock */}
      <Dock />

      {/* INTRO MODAL */}
      {showIntroModal && (
        <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="relative max-w-md w-[90%] rounded-3xl border border-rose-500/70 bg-slate-950/95 shadow-[0_0_70px_rgba(248,113,113,0.6)] overflow-hidden">
            <div className="h-1 bg-linear-to-r from-rose-500 via-amber-400 to-emerald-400" />

            <div className="p-5 space-y-4 text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500 border border-rose-400/70 flex items-center justify-center text-2xl">
                  ⚠️
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-rose-300 font-semibold">
                    OVERTIME ALERT
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-200">
                    It is{' '}
                    <span className="font-mono font-semibold text-rose-300">
                      17:00
                    </span>
                    . You should not be paying unpaid overtime anymore.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 space-y-2">
                <p className="text-[11px] sm:text-xs text-rose-300 font-semibold">
                  “Shutdown blocked by unpaid overtime daemon.”
                </p>
                <p className="text-[11px] sm:text-xs text-slate-200">
                  A background process is preventing you from shutting down your
                  system. It feeds on unpaid overtime, forgotten tickets and
                  “just 5 more minutes”.
                </p>
                <p className="text-[11px] sm:text-xs text-slate-300">
                  Your mission:
                </p>
                <ul className="list-disc list-inside text-[11px] sm:text-xs text-slate-200 space-y-1">
                  <li>Explore the fake OS and open the apps in the dock.</li>
                  <li>Collect all fragments of the kill code and a special flag.</li>
                  <li>Use the Terminal to execute the one true command.</li>
                  <li>Shut this thing down. No free overtime for the boss.</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-[10px] text-slate-500">
                  Tip: read everything. Devs hide critical info in notes, merge
                  tools and silly mini games.
                </p>
                <button
                  type="button"
                  onClick={handleIntroStart}
                  className="px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold
                             bg-rose-500 hover:bg-rose-400 text-slate-950
                             border border-rose-300 shadow-lg shadow-rose-500/50
                             transition"
                >
                  I refuse unpaid overtime · Start
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && !isShuttingDown && (
        <div className="fixed inset-0 z-85 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="relative max-w-md w-[90%] rounded-3xl border border-emerald-400/80 bg-slate-950/95 shadow-[0_0_70px_rgba(52,211,153,0.7)] overflow-hidden">
            <div className="h-1 bg-linear-to-r from-emerald-400 via-sky-400 to-emerald-400" />

            <div className="p-5 space-y-4 text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-400/70 flex items-center justify-center text-2xl">
                  ✅
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-300 font-semibold">
                    OVERTIME DAEMON DEFEATED
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-200">
                    The system is finally quiet. No more unpaid overtime packets
                    are sneaking through.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 space-y-2">
                <p className="text-[11px] sm:text-xs text-emerald-300 font-semibold">
                  You can finally go home.
                </p>
                <p className="text-[11px] sm:text-xs text-slate-200">
                  All kill code fragments were accepted and the firewall is armed.
                  The shutdown route is clean.
                </p>
                <p className="text-[11px] sm:text-xs text-slate-300">
                  Next step:
                </p>
                <ul className="list-disc list-inside text-[11px] sm:text-xs text-slate-200 space-y-1">
                  <li>
                    Open the{' '}
                    <span className="font-semibold text-emerald-300">Power</span> app in
                    the dock.
                  </li>
                  <li>
                    Press <span className="font-mono">Power off now</span>.
                  </li>
                  <li>Watch OvertimeOS fade to black. Enjoy your evening.</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-[10px] text-slate-500">
                  Tip: if you ever reopen OvertimeOS, remember this feeling and
                  say no to “just one more ticket”.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    openWindow('power', {
                      x: 120,
                      y: 110,
                      width: 420,
                      height: 260,
                    });
                  }}
                  className="px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold
                             bg-emerald-500 hover:bg-emerald-400 text-slate-950
                             border border-emerald-300 shadow-lg shadow-emerald-500/50
                             transition"
                >
                  Open power options
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Desktop;
