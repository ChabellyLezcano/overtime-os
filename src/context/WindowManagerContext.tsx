// src/context/WindowManagerContext.tsx
'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

export interface WindowInstance {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
  zIndex: number;
  appId: string;
  title: string;
}

interface OpenOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface WindowManagerContextValue {
  windows: WindowInstance[];
  isShuttingDown: boolean;
  daemonKilled: boolean;

  openWindow: (appId: string, options?: OpenOptions) => void;
  closeWindow: (id: string) => void;
  closeAllWindows: () => void;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, width: number, height: number) => void;
  toggleMinimize: (id: string) => void;
  toggleMaximize: (id: string) => void;

  hideShutdownModal: () => void;

  markDaemonKilled: () => void;
  powerOff: () => void;
}

const WindowManagerContext = createContext<WindowManagerContextValue | null>(null);

export const useWindowManager = () => {
  const ctx = useContext(WindowManagerContext);
  if (!ctx) {
    throw new Error('useWindowManager must be used within WindowManagerProvider');
  }
  return ctx;
};

let idCounter = 0;
const nextId = () => `win-${++idCounter}`;

export const WindowManagerProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const [daemonKilled, setDaemonKilled] = useState(false);
  const [isShuttingDown, setIsShuttingDown] = useState(false);

  const bringToFront = useCallback((id: string) => {
    setWindows((prev) => {
      const maxZ = prev.reduce((acc, w) => Math.max(acc, w.zIndex), 0);
      return prev.map((w) => (w.id === id ? { ...w, zIndex: maxZ + 1 } : w));
    });
  }, []);

  const openWindow = useCallback((appId: string, options?: OpenOptions) => {
    setWindows((prev) => {
      const maxZ = prev.reduce((acc, w) => Math.max(acc, w.zIndex), 0);

      // Look for an existing window of this app
      const existing = prev.find((w) => w.appId === appId);

      if (existing) {
        // Reuse it: un-minimize (if needed) and bring it to front
        return prev.map((w) =>
          w.id === existing.id
            ? {
                ...w,
                minimized: false,
                zIndex: maxZ + 1,
              }
            : w,
        );
      }

      // No existing instance -> create new window
      const id = nextId();
      const newWin: WindowInstance = {
        id,
        appId,
        title: appId,
        x: options?.x ?? 80,
        y: options?.y ?? 80,
        width: options?.width ?? 480,
        height: options?.height ?? 320,
        zIndex: maxZ + 1,
        minimized: false,
        maximized: false,
      };
      return [...prev, newWin];
    });
  }, []);

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const closeAllWindows = useCallback(() => {
    setWindows([]);
  }, []);

  const focusWindow = useCallback(
    (id: string) => {
      bringToFront(id);
    },
    [bringToFront],
  );

  const moveWindow = useCallback((id: string, x: number, y: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, x, y } : w)));
  }, []);

  const resizeWindow = useCallback((id: string, width: number, height: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, width, height } : w)));
  }, []);

  const toggleMinimize = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, minimized: !w.minimized } : w)),
    );
  }, []);

  const toggleMaximize = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)),
    );
  }, []);

  const markDaemonKilled = useCallback(() => {
    setDaemonKilled(true);
  }, []);

  const powerOff = useCallback(() => {
    setWindows([]);
    setIsShuttingDown(true);
  }, []);

  const hideShutdownModal = useCallback(() => {
    setIsShuttingDown(false);
  }, []);

  const value: WindowManagerContextValue = {
    windows,
    isShuttingDown,
    daemonKilled,

    openWindow,
    closeWindow,
    closeAllWindows,
    focusWindow,
    moveWindow,
    resizeWindow,
    toggleMinimize,
    toggleMaximize,

    hideShutdownModal,
    markDaemonKilled,
    powerOff,
  };

  return (
    <WindowManagerContext.Provider value={value}>
      {children}
    </WindowManagerContext.Provider>
  );
};
