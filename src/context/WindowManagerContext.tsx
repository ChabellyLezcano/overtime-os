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
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
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
  toggleMinimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  hideShutdownModal: () => void;

  markDaemonKilled: () => void;
  powerOff: () => void;
}

const WindowManagerContext = createContext<WindowManagerContextValue | null>(
  null,
);

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
      return prev.map((w) =>
        w.id === id ? { ...w, zIndex: maxZ + 1 } : w,
      );
    });
  }, []);

  const openWindow = useCallback(
    (appId: string, options?: OpenOptions) => {
      setWindows((prev) => {
        const maxZ = prev.reduce((acc, w) => Math.max(acc, w.zIndex), 0);
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
    },
    [],
  );

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
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, x, y } : w)),
    );
  }, []);

  const toggleMinimize = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, minimized: !w.minimized } : w,
      ),
    );
  }, []);

  const toggleMaximize = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, maximized: !w.maximized } : w,
      ),
    );
  }, []);

  // ✅ Called from Terminal when kill code is accepted
  const markDaemonKilled = useCallback(() => {
    setDaemonKilled(true);
  }, []);

  // ✅ Called from PowerApp when user presses "Power off now"
  const powerOff = useCallback(() => {
    // Optional: close windows to avoid flicker
    setWindows([]);
    // Trigger final black screen in Desktop
    setIsShuttingDown(true);
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
    toggleMinimize,
    toggleMaximize,

    markDaemonKilled,
    powerOff,
    hideShutdownModal: function (): void {
      throw new Error('Function not implemented.');
    }
  };

  return (
    <WindowManagerContext.Provider value={value}>
      {children}
    </WindowManagerContext.Provider>
  );
};
