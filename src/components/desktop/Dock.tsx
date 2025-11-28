// src/components/desktop/Dock.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { useWindowManager } from '@/context/WindowManagerContext';
import { OsAppId } from '@/types/window';

import notesIcon from '../../../public/assets/icons/notification.png';
import stickyPadIcon from '../../../public/assets/icons/notes.png';
import mediaPlayerIcon from '../../../public/assets/icons/play.png';
import bugsIcon from '../../../public/assets/icons/ladybug.png';
import mergeIcon from '../../../public/assets/icons/merge.png';
import monitorIcon from '../../../public/assets/icons/activity.png';
import terminalIcon from '../../../public/assets/icons/code.png';
import firewallIcon from '../../../public/assets/icons/firewall.png';
import powerIcon from '../../../public/assets/icons/power.png';

type DockItem = {
  id: OsAppId;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
};

const dockItems: DockItem[] = [
  { id: 'notes', label: 'Notes', icon: notesIcon },
  { id: 'sticky-pad', label: 'StickyPad', icon: stickyPadIcon },
  { id: 'media-player', label: 'Player', icon: mediaPlayerIcon },
  { id: 'mini-game-bugs', label: 'Bug Game', icon: bugsIcon },
  { id: 'merge-tool', label: 'Merge', icon: mergeIcon },
  { id: 'system-monitor', label: 'Monitor', icon: monitorIcon },
  { id: 'terminal', label: 'Terminal', icon: terminalIcon },
  { id: 'firewall', label: 'Firewall', icon: firewallIcon },
  { id: 'power', label: 'Power', icon: powerIcon },
];

const Dock: React.FC = () => {
  const { openWindow, windows } = useWindowManager();

  return (
    <div className="pointer-events-auto">
      <div className="absolute inset-x-0 bottom-4 flex justify-center">
        <div className="flex gap-3 rounded-3xl border border-slate-800/70 bg-slate-950/70 px-4 py-2 backdrop-blur-xl">
          {dockItems.map((item) => {
            const appWindow = windows.find((w) => w.appId === item.id);
            const isMinimized = !!appWindow && appWindow.minimized;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openWindow(item.id)}
                className="group flex cursor-pointer flex-col items-center gap-1 text-[10px] text-slate-300"
              >
                <div className="flex items-center justify-center transition group-hover:-translate-y-1">
                  <Image
                    src={item.icon}
                    alt={item.label}
                    className="h-10 w-10 object-contain"
                  />
                </div>

                <span
                  className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                    isMinimized ? 'bg-white' : 'bg-transparent'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dock;
