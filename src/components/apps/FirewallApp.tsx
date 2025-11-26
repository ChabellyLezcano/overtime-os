'use client';

import React, { useMemo, useState } from 'react';

type CellType = 'start' | 'goal' | 'wall' | 'empty';

interface Position {
  row: number;
  col: number;
}

type GameStatus = 'playing' | 'success' | 'failed';

interface MazeState {
  layout: CellType[][];
  start: Position;
  goal: Position;
}

/** --- Maze generation helpers --- **/

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function positionsEqual(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

/**
 * Generate a maze with:
 * - random path from start to goal (guaranteed solvable)
 * - some extra random empty cells for variety
 */
function generateMaze(rows = 5, cols = 7): MazeState {
  const start: Position = { row: 0, col: 0 };
  const goal: Position = { row: rows - 1, col: cols - 1 };

  const visited: boolean[][] = Array.from({ length: rows }, () =>
    Array<boolean>(cols).fill(false),
  );

  const path: Position[] = [];

  function dfs(pos: Position): boolean {
    path.push(pos);
    visited[pos.row][pos.col] = true;

    if (positionsEqual(pos, goal)) {
      return true;
    }

    const neighbors: Position[] = shuffle([
      { row: pos.row - 1, col: pos.col },
      { row: pos.row + 1, col: pos.col },
      { row: pos.row, col: pos.col - 1 },
      { row: pos.row, col: pos.col + 1 },
    ]).filter(
      (n) =>
        n.row >= 0 &&
        n.row < rows &&
        n.col >= 0 &&
        n.col < cols &&
        !visited[n.row][n.col],
    );

    for (const n of neighbors) {
      if (dfs(n)) return true;
    }

    path.pop();
    return false;
  }

  dfs(start);

  const layout: CellType[][] = Array.from({ length: rows }, () =>
    Array<CellType>(cols).fill('wall'),
  );

  for (const p of path) {
    layout[p.row][p.col] = 'empty';
  }

  layout[start.row][start.col] = 'start';
  layout[goal.row][goal.col] = 'goal';

  // Extra empty cells aleatorios
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isPathCell = path.some((p) => positionsEqual(p, { row: r, col: c }));
      const isStart = positionsEqual({ row: r, col: c }, start);
      const isGoal = positionsEqual({ row: r, col: c }, goal);

      if (!isPathCell && !isStart && !isGoal) {
        if (Math.random() < 0.25) {
          layout[r][c] = 'empty';
        }
      }
    }
  }

  return { layout, start, goal };
}

/** --- Component --- **/

const FirewallApp: React.FC = () => {
  const [maze, setMaze] = useState<MazeState>(() => generateMaze());
  const [playerPos, setPlayerPos] = useState<Position>(maze.start);
  const [visited, setVisited] = useState<Position[]>([maze.start]);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [message, setMessage] = useState<string | null>(null);
  const [steps, setSteps] = useState(0);
  const MAX_STEPS = 20;

  const rows = maze.layout.length;
  const cols = maze.layout[0]?.length ?? 0;

  const isSamePos = (a: Position, b: Position) =>
    a.row === b.row && a.col === b.col;

  const getCellType = (row: number, col: number): CellType =>
    maze.layout[row][col];

  const handleCellClick = (row: number, col: number) => {
    if (status !== 'playing') return;

    const target: Position = { row, col };
    const cellType = getCellType(row, col);

    const dist =
      Math.abs(row - playerPos.row) + Math.abs(col - playerPos.col);
    if (dist !== 1) {
      setMessage('You can only move to adjacent nodes.');
      return;
    }

    if (cellType === 'wall') {
      setStatus('failed');
      setMessage(
        'Packet dropped: you hit a firewall trap node. Try again with a different route.',
      );
      return;
    }

    const newSteps = steps + 1;
    setSteps(newSteps);

    setPlayerPos(target);
    setVisited((prev) => {
      const already = prev.some((p) => isSamePos(p, target));
      return already ? prev : [...prev, target];
    });
    setMessage(null);

    if (isSamePos(target, maze.goal)) {
      setStatus('success');
      setMessage(
        'Perfect route: your packets reached the safe node without touching daemon traps.',
      );
      return;
    }

    if (newSteps >= MAX_STEPS) {
      setStatus('failed');
      setMessage(
        'Too many hops. The daemon had time to reroute around your firewall.',
      );
    }
  };

  const resetRoute = () => {
    setPlayerPos(maze.start);
    setVisited([maze.start]);
    setStatus('playing');
    setSteps(0);
    setMessage(null);
  };

  const newMaze = () => {
    const next = generateMaze();
    setMaze(next);
    setPlayerPos(next.start);
    setVisited([next.start]);
    setStatus('playing');
    setSteps(0);
    setMessage(null);
  };

  const progressPercent = useMemo(
    () => Math.round((steps / MAX_STEPS) * 100),
    [steps],
  );

  return (
   <div className="w-full h-full flex flex-col p-2 sm:p-4 text-xs sm:text-md text-slate-100 overflow-y-auto">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-3">
        <div className="min-w-0">
          <h2 className="text-md sm:text-base font-semibold text-emerald-300 truncate">
            Firewall Maze – Safe Route Puzzle
          </h2>
          <p className="text-[11px] text-slate-300">
            Goal: guide the packet from the source node to the safe node, avoiding
            daemon trap nodes.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-[10px] text-slate-400">
          <span>
            Steps: <span className="text-sky-300 font-semibold">{steps}</span> /{' '}
            {MAX_STEPS}
          </span>
          <span className="px-2 py-0.5 rounded-full border border-slate-700/80 bg-slate-950/90 text-slate-200">
            Status:{' '}
            {status === 'playing' && (
              <span className="text-amber-300 font-semibold">routing…</span>
            )}
            {status === 'success' && (
              <span className="text-emerald-300 font-semibold">success</span>
            )}
            {status === 'failed' && (
              <span className="text-rose-300 font-semibold">failed</span>
            )}
          </span>
        </div>
      </div>

      <div className="w-full h-full min-h-0 flex flex-col p-2 sm:p-4 text-xs sm:text-md text-slate-100 overflow-y-auto">

        {/* LEFT: MAZE */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-950/95 p-3 sm:p-4">
          <p className="text-[11px] text-slate-300 mb-3 text-center max-w-md">
            Tap adjacent nodes to move your packet. Avoid{' '}
            <span className="text-rose-300 font-semibold">daemon traps</span> (red
            nodes) and reach the{' '}
            <span className="text-emerald-300 font-semibold">safe node</span>.
          </p>

          <div className="inline-flex flex-col gap-1 sm:gap-2">
            {Array.from({ length: rows }).map((_, r) => (
              <div
                key={r}
                className="flex flex-row gap-1 sm:gap-2 justify-center"
              >
                {Array.from({ length: cols }).map((__, c) => {
                  const cellType = getCellType(r, c);
                  const isPlayer = isSamePos(playerPos, { row: r, col: c });
                  const isVisited = visited.some((p) =>
                    isSamePos(p, { row: r, col: c }),
                  );

                  let baseCircle =
                    // 👇 tamaño fluido según viewport: mínimo 2.3rem, máximo 3.1rem
                    'aspect-square w-[clamp(2.3rem,9vw,3.1rem)] rounded-full flex items-center justify-center text-[10px] sm:text-[11px] cursor-pointer transition shadow-md';
                  let style = '';
                  let label = '';

                  if (cellType === 'wall') {
                    baseCircle += ' cursor-not-allowed';
                    style =
                      'bg-gradient-to-br from-rose-600 to-rose-800 border border-rose-400/80 text-rose-50';
                    label = 'X';
                  } else if (cellType === 'start') {
                    style =
                      'bg-gradient-to-br from-sky-500 to-sky-700 border border-sky-300/80 text-slate-50 font-semibold';
                    label = 'SRC';
                  } else if (cellType === 'goal') {
                    style =
                      'bg-gradient-to-br from-emerald-500 to-emerald-700 border border-emerald-300/80 text-slate-50 font-semibold';
                    label = 'SAFE';
                  } else {
                    style =
                      'bg-slate-900/80 border border-slate-700/70 text-slate-400';
                    if (isVisited) {
                      style =
                        'bg-gradient-to-br from-slate-800 to-slate-900 border border-sky-400/70 text-sky-200';
                    }
                  }

                  if (isPlayer) {
                    style =
                      'bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-200/90 text-slate-900 font-bold shadow-[0_0_12px_rgba(251,191,36,0.75)]';
                    label = cellType === 'goal' ? '✓' : 'YOU';
                  }

                  return (
                    <button
                      key={c}
                      type="button"
                      className={`${baseCircle} ${style}`}
                      onClick={() => handleCellClick(r, c)}
                      disabled={cellType === 'wall' || status !== 'playing'}
                    >
                      {label || (cellType === 'empty' ? '·' : '')}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-4 w-full max-w-xs">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Route length</span>
              <span className="text-sky-300 font-semibold">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-sky-400 via-amber-400 to-emerald-400 transition-all"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={resetRoute}
              className="px-4 py-1.5 rounded-full border border-slate-700 bg-slate-900/90 text-[11px] text-slate-200 hover:border-sky-400/80 hover:text-sky-200 transition"
            >
              Reset route
            </button>
            <button
              type="button"
              onClick={newMaze}
              className="px-4 py-1.5 rounded-full border border-emerald-500/80 bg-emerald-500/15 text-[11px] text-emerald-200 hover:bg-emerald-500/25 hover:border-emerald-400 transition"
            >
              New random maze
            </button>
          </div>
        </div>

        {/* RIGHT: STORY + RESULT */}
        <div className="flex flex-col gap-3 sm:gap-4 mt-3 lg:mt-0">
          {/* Story / hint panel */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/95 p-3 sm:p-4 text-[11px] space-y-2">
            <p className="text-slate-300">
              Think of each node as a router inside your company network. The{' '}
              <span className="text-sky-300 font-semibold">source</span> node is your
              machine. The <span className="text-emerald-300 font-semibold">safe</span>{' '}
              node hides behind a firewall that the daemon cannot cross.
            </p>
            <p className="text-slate-300">
              The <span className="text-rose-300 font-semibold">red nodes</span> are
              daemon-controlled traps. If your route touches them, the daemon learns
              your pattern and reroutes unpaid overtime packets.
            </p>
            <p className="text-[10px] text-slate-500">
              Tip: shortest-looking route is not always safe. Sometimes you must go
              around to avoid contaminated nodes.
            </p>
          </div>

          {/* Status / message */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/95 p-3 sm:p-4 text-[11px] space-y-2">
            {message && (
              <div
                className={`rounded-xl border px-2 py-2 ${
                  status === 'failed'
                    ? 'border-rose-400/80 bg-rose-500/10 text-rose-100'
                    : status === 'success'
                    ? 'border-emerald-400/80 bg-emerald-500/10 text-emerald-100'
                    : 'border-sky-400/80 bg-sky-500/10 text-sky-100'
                }`}
              >
                {message}
              </div>
            )}

            {!message && status === 'playing' && (
              <p className="text-slate-300">
                Route your packet carefully. Every extra hop gives the daemon more time
                to adapt.
              </p>
            )}

            {status === 'failed' && (
              <p className="text-[10px] text-slate-400">
                You can always reset or generate a new maze and try a cleaner route.
                Firewalls are all about iteration.
              </p>
            )}

            {status === 'success' && (
              <div className="mt-1 rounded-xl border border-emerald-400/80 bg-linear-to-br from-emerald-500/15 via-slate-950 to-emerald-500/10 p-3 shadow-[0_0_18px_rgba(52,211,153,0.45)]">
                <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-300 mb-1">
                  Kill code fragment unlocked
                </p>
                <p className="text-emerald-200 mb-1">
                  You found a safe route that keeps the overtime daemon away from the
                  shutdown path.
                </p>
                <p className="font-mono text-[11px] text-emerald-100 break-all">
                  Firewall maze fragment of the kill code:
                  <br />
                  <span className="font-semibold">+FIREWALL-MAZE</span>
                </p>
                <p className="mt-1 text-slate-300">
                  REMEMBER ARM THE FIREWALL NOW WITH: ´arm-firewall´
                  Add this to your StickyPad. Combined with the other fragments, this
                  helps the final terminal command bypass the daemon&apos;s last
                  defenses.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirewallApp;
