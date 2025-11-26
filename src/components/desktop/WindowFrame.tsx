/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { CSSProperties, useRef } from 'react';
import { useWindowManager, WindowInstance } from '@/context/WindowManagerContext';

interface WindowFrameProps {
  window: WindowInstance;
  children: React.ReactNode;
}

const WindowFrame: React.FC<WindowFrameProps> = ({ window: win, children }) => {
  const {
    closeWindow,
    focusWindow,
    moveWindow,
    toggleMinimize,
    toggleMaximize,
  } = useWindowManager();

  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    x: number;
    y: number;
  } | null>(null);

  if (!win) return null;

  const onMouseDownFrame = () => {
    focusWindow(win.id);
  };

  const onMouseDownTitle = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    focusWindow(win.id);

    if (win.maximized) return;

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      x: win.x,
      y: win.y,
    };

    const handleMove = (ev: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = ev.clientX - dragStartRef.current.mouseX;
      const dy = ev.clientY - dragStartRef.current.mouseY;
      const nextX = dragStartRef.current.x + dx;
      const nextY = dragStartRef.current.y + dy;

      moveWindow(win.id, nextX, nextY);
    };

    const handleUp = () => {
      dragStartRef.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeWindow(win.id);
  };

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMinimize(win.id);
  };

  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMaximize(win.id);
  };

  const isVirusWindow = win.appId === 'virus';

  const baseStyle: CSSProperties = win.maximized
    ? {
        left: 0,
        top: 1,
        width: '100%',
        height: '100%',
      }
    : {
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
      };

  const style: CSSProperties = {
    ...baseStyle,
    maxWidth: 'min(100vw - 0.5rem, 900px)',
    minWidth: 280,
    maxHeight: 'calc(100vh - 4rem)',
    minHeight: 220,
    zIndex: win.zIndex,
  };

  if (win.minimized) {
    (style as any).display = 'none';
  }

  return (
    <div
      className="
        absolute
        flex flex-col
        rounded-2xl
        border border-slate-800/80
        bg-slate-950/95
        shadow-[0_20px_45px_rgba(15,23,42,0.8)]
        backdrop-blur-md
        overflow-hidden
      "
      style={style}
      onMouseDown={onMouseDownFrame}
    >
      {/* Title bar */}
      <div
        className="
          h-9
          px-3
          flex items-center justify-between gap-3
          bg-slate-900/95
          border-b border-slate-800
          cursor-move select-none
          shrink-0
        "
        onMouseDown={onMouseDownTitle}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5 cursor-pointer">
            {!isVirusWindow && (
              <button
                type="button"
                onClick={handleClose}
                className="w-2.5 h-2.5 rounded-full bg-rose-500 hover:bg-rose-400 border border-rose-300/70"
              />
            )}
            {isVirusWindow && (
              <div
                className="w-2.5 h-2.5 rounded-full border bg-gray-300 border-gray-300/70
                           flex items-center justify-center text-[9px] text-gray-300/90"
              />
            )}

            <button
              type="button"
              onClick={handleMinimize}
              className="w-2.5 h-2.5 rounded-full bg-amber-400 hover:bg-amber-300 border border-amber-200/70"
            />
            <button
              type="button"
              onClick={handleMaximize}
              className="w-2.5 h-2.5 rounded-full bg-emerald-400 hover:bg-emerald-300 border border-emerald-200/70"
            />
          </div>
          <div className="text-[11px] sm:text-xs text-slate-200 truncate">
            {win.title}
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400">
          <span className="px-2 py-0.5 rounded-full border border-slate-700/80 bg-slate-950/80">
            PID: {win.id}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full bg-slate-950/95 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default WindowFrame;
