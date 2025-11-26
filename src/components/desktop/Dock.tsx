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
  const { openWindow } = useWindowManager();

  return (
    <div className="pointer-events-auto">
      <div className="absolute bottom-4 inset-x-0 flex justify-center">
        <div className="flex gap-3 px-4 py-2 rounded-3xl bg-slate-950/70 border border-slate-800/70 backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.8)]">
          {dockItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openWindow(item.id)}
              className="flex flex-col items-center gap-1 cursor-pointer text-[10px] text-slate-300 group"
            >
              <div className="flex items-center justify-center shadow-md shadow-slate-900/80 group-hover:-translate-y-1 group-hover:shadow-[0_10px_25px_rgba(15,23,42,0.9)] transition">
                <Image
                  src={item.icon}
                  alt={item.label}
                  className="w-10 h-10 object-contain"
                />
              </div>
              <span className="group-hover:text-slate-100 transition">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dock;
