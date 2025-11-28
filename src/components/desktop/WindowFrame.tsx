/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { CSSProperties, useRef } from 'react';
import { useWindowManager, WindowInstance } from '@/context/WindowManagerContext';

interface WindowFrameProps {
  window: WindowInstance;
  children: React.ReactNode;
}

const MIN_WIDTH = 280;
const MIN_HEIGHT = 280;

// Desktop chrome insets for maximized windows
const MAXIMIZED_SIDE_PADDING = 16; // px margin left/right
const MAXIMIZED_TOP_OFFSET = 56; // px from top (e.g. top bar)
const MAXIMIZED_BOTTOM_MARGIN = 100; // px reserved for dock (ajústalo al alto real de tu dock)

const WindowFrame: React.FC<WindowFrameProps> = ({ window: win, children }) => {
  const {
    closeWindow,
    focusWindow,
    moveWindow,
    toggleMinimize,
    toggleMaximize,
    resizeWindow,
  } = useWindowManager();

  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    x: number;
    y: number;
  } | null>(null);

  const resizeStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    width: number;
    height: number;
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

  const onMouseDownResize = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    if (win.maximized) return;

    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: win.width,
      height: win.height,
    };

    const handleResize = (ev: MouseEvent) => {
      if (!resizeStartRef.current) return;

      const dx = ev.clientX - resizeStartRef.current.mouseX;
      const dy = ev.clientY - resizeStartRef.current.mouseY;

      let nextWidth = resizeStartRef.current.width + dx;
      let nextHeight = resizeStartRef.current.height + dy;

      // Enforce minimum size
      nextWidth = Math.max(MIN_WIDTH, nextWidth);
      nextHeight = Math.max(MIN_HEIGHT, nextHeight);

      // Optional: clamp to viewport so it does not overflow too much
      const maxWidth = window.innerWidth - win.x;
      const maxHeight = window.innerHeight - win.y - 40;

      nextWidth = Math.min(nextWidth, maxWidth);
      nextHeight = Math.min(nextHeight, maxHeight);

      resizeWindow(win.id, nextWidth, nextHeight);
    };

    const handleUp = () => {
      resizeStartRef.current = null;
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleResize);
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
        // Maximized: fill almost the whole desktop with some padding
        left: MAXIMIZED_SIDE_PADDING,
        right: MAXIMIZED_SIDE_PADDING,
        top: MAXIMIZED_TOP_OFFSET,
        width: `calc(97.3vw)`,
        // Reserve space for top bar + dock at the bottom
        height: `calc(100vh - ${MAXIMIZED_TOP_OFFSET + MAXIMIZED_BOTTOM_MARGIN}px)`,
      }
    : {
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
      };

  const style: CSSProperties = {
    ...baseStyle,
    maxWidth: '100vw', // optional hard cap for ultra-wide
    minWidth: MIN_WIDTH,
    maxHeight: '100vh',
    minHeight: MIN_HEIGHT,
    zIndex: win.zIndex,
  };

  if (win.minimized) {
    (style as any).display = 'none';
  }

  return (
    <div
      className="absolute flex flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/95 shadow-[0_20px_45px_rgba(15,23,42,0.8)] backdrop-blur-md"
      style={style}
      onMouseDown={onMouseDownFrame}
    >
      {/* Title bar */}
      <div
        className="flex h-9 shrink-0 cursor-move items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/95 px-3 select-none"
        onMouseDown={onMouseDownTitle}
      >
        <div className="flex min-w-0 items-center gap-2">
          {/* Traffic lights */}
          <div className="flex cursor-pointer items-center gap-1.5">
            {!isVirusWindow && (
              <button
                type="button"
                onClick={handleClose}
                className="h-2.5 w-2.5 rounded-full border border-rose-300/70 bg-rose-500 hover:bg-rose-400"
              />
            )}
            {isVirusWindow && (
              <div className="flex h-2.5 w-2.5 items-center justify-center rounded-full border border-gray-300/70 bg-gray-300 text-[9px] text-gray-300/90" />
            )}

            <button
              type="button"
              onClick={handleMinimize}
              className="h-2.5 w-2.5 rounded-full border border-amber-200/70 bg-amber-400 hover:bg-amber-300"
            />
            <button
              type="button"
              onClick={handleMaximize}
              className="h-2.5 w-2.5 rounded-full border border-emerald-200/70 bg-emerald-400 hover:bg-emerald-300"
            />
          </div>
          <div className="text-caption truncate text-slate-200">{win.title}</div>
        </div>
      </div>

      <div className="min-h-0 w-full flex-1 overflow-auto bg-slate-950/95">
        {children}
      </div>

      {/* Resize handle bottom-right */}
      {!win.maximized && !win.minimized && (
        <div
          className="absolute right-1.5 bottom-1.5 flex h-3.5 w-3.5 cursor-se-resize items-end justify-end"
          onMouseDown={onMouseDownResize}
        >
          <div className="pointer-events-none h-full w-full">
            <div className="h-full w-full rounded-br-md border-r border-b border-slate-600/70" />
          </div>
        </div>
      )}
    </div>
  );
};

export default WindowFrame;
