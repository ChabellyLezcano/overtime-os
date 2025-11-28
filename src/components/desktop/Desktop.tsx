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
        <div className="flex h-full w-full items-center justify-center text-xs text-slate-300">
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
      openWindow('virus');
    }
  };

  useEffect(() => {
    if (daemonKilled) {
      setShowSuccessModal(true);
    }
  }, [daemonKilled]);

  if (isShuttingDown) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <div className="space-y-3 text-center">
          <p className="mb-1 text-sm tracking-[0.28em] text-slate-400 uppercase sm:text-base">
            overtime os
          </p>
          <p className="text-3xl font-semibold text-slate-100 sm:text-4xl">The End</p>
          <p className="mt-2 text-xs text-slate-500 sm:text-sm">
            You clocked out. No more unpaid overtime today.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-150 relative h-screen w-screen overflow-hidden text-slate-50">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-blue-900 via-indigo-700 to-rose-500" />

        <div className="absolute inset-[-20%] bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.55),transparent_55%),radial-gradient(circle_at_100%_10%,rgba(244,114,182,0.45),transparent_55%),radial-gradient(circle_at_15%_100%,rgba(52,211,153,0.5),transparent_55%),radial-gradient(circle_at_85%_95%,rgba(250,204,21,0.45),transparent_60%)] opacity-75 mix-blend-screen" />

        {/* Grid  */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff18_1px,transparent_1px),linear-gradient(to_bottom,#ffffff18_1px,transparent_1px)] bg-size-[48px_48px] opacity-[0.08]" />
      </div>

      {/* Top bar */}
      <Taskbar />

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
          <div className="relative w-[90%] max-w-md overflow-hidden rounded-3xl border border-rose-500/70 bg-slate-950/95 shadow-[0_0_70px_rgba(248,113,113,0.6)]">
            <div className="h-1 bg-linear-to-r from-rose-500 via-amber-400 to-emerald-400" />

            <div className="space-y-4 p-5 text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-400/70 bg-rose-500 text-2xl">
                  ⚠️
                </div>
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-rose-300 uppercase">
                    OVERTIME ALERT
                  </p>
                  <p className="text-[11px] text-slate-200 sm:text-xs">
                    It is{' '}
                    <span className="font-mono font-semibold text-rose-300">17:00</span>.
                    You should not be paying unpaid overtime anymore.
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                <p className="text-[11px] font-semibold text-rose-300 sm:text-xs">
                  “Shutdown blocked by unpaid overtime daemon.”
                </p>
                <p className="text-[11px] text-slate-200 sm:text-xs">
                  A background process is preventing you from shutting down your system.
                  It feeds on unpaid overtime, forgotten tickets and “just 5 more
                  minutes”.
                </p>
                <p className="text-[11px] text-slate-300 sm:text-xs">Your mission:</p>
                <ul className="list-inside list-disc space-y-1 text-[11px] text-slate-200 sm:text-xs">
                  <li>Explore the fake OS and open the apps in the dock.</li>
                  <li>Collect all fragments of the kill code and a special flag.</li>
                  <li>Use the Terminal to execute the one true command.</li>
                  <li>Shut this thing down. No free overtime for the boss.</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[10px] text-slate-500">
                  Tip: read everything. Devs hide critical info in notes, merge tools and
                  silly mini games.
                </p>
                <button
                  type="button"
                  onClick={handleIntroStart}
                  className="rounded-full border border-rose-300 bg-rose-500 px-4 py-1.5 text-[11px] font-semibold text-slate-950 shadow-lg shadow-rose-500/50 transition hover:bg-rose-400 sm:text-xs"
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
          <div className="relative w-[90%] max-w-md overflow-hidden rounded-3xl border border-emerald-400/80 bg-slate-950/95 shadow-[0_0_70px_rgba(52,211,153,0.7)]">
            <div className="h-1 bg-linear-to-r from-emerald-400 via-sky-400 to-emerald-400" />

            <div className="space-y-4 p-5 text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/70 bg-emerald-500/15 text-2xl">
                  ✅
                </div>
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-emerald-300 uppercase">
                    OVERTIME DAEMON DEFEATED
                  </p>
                  <p className="text-[11px] text-slate-200 sm:text-xs">
                    The system is finally quiet. No more unpaid overtime packets are
                    sneaking through.
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                <p className="text-[11px] font-semibold text-emerald-300 sm:text-xs">
                  You can finally go home.
                </p>
                <p className="text-[11px] text-slate-200 sm:text-xs">
                  All kill code fragments were accepted and the firewall is armed. The
                  shutdown route is clean.
                </p>
                <p className="text-[11px] text-slate-300 sm:text-xs">Next step:</p>
                <ul className="list-inside list-disc space-y-1 text-[11px] text-slate-200 sm:text-xs">
                  <li>
                    Open the <span className="font-semibold text-emerald-300">Power</span>{' '}
                    app in the dock.
                  </li>
                  <li>
                    Press <span className="font-mono">Power off now</span>.
                  </li>
                  <li>Watch OvertimeOS fade to black. Enjoy your evening.</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[10px] text-slate-500">
                  Tip: if you ever reopen OvertimeOS, remember this feeling and say no to
                  “just one more ticket”.
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
                  className="rounded-full border border-emerald-300 bg-emerald-500 px-4 py-1.5 text-[11px] font-semibold text-slate-950 shadow-lg shadow-emerald-500/50 transition hover:bg-emerald-400 sm:text-xs"
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
