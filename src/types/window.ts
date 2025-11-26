export type OsAppId =
  | 'notes'
  | 'sticky-pad'
  | 'media-player'
  | 'mini-game-bugs'
  | 'merge-tool'
  | 'system-monitor'
  | 'terminal'
  | 'firewall'
  | 'power'
  | 'virus';

export interface WindowState {
  addEventListener(arg0: string, onMouseMove: (e: MouseEvent) => void): unknown;
  removeEventListener(arg0: string, onMouseMove: (e: MouseEvent) => void): unknown;
  id: string;
  appId: OsAppId;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
}
