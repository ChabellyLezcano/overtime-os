// src/components/apps/TerminalApp.tsx
'use client';

import React, {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useWindowManager } from '@/context/WindowManagerContext';

type LineType = 'system' | 'input' | 'output';

interface Line {
  id: number;
  type: LineType;
  text: string;
}

const INITIAL_LINES: Line[] = [
  {
    id: 1,
    type: 'system',
    text: 'OvertimeOS pseudo terminal – type "help" to see available commands.',
  },
];

const EXPECTED_FRAGMENTS = [
  'KILL-OVERTIME-NOTES',
  'PLAYER-WAVE-ALIGNED',
  'BUGS-FIXED',
  'MERGE-CLEAN',
  'SYSTEM-DRAINED',
] as const;

type ExpectedFragment = (typeof EXPECTED_FRAGMENTS)[number];

function validateKillCode(killCode: string): { ok: boolean; reason?: string } {
  const parts = killCode.split('+').filter(Boolean);

  if (parts.length !== EXPECTED_FRAGMENTS.length) {
    return {
      ok: false,
      reason:
        'The kill code is missing fragments or has extra unknown pieces. Make sure you copied all fragments exactly as they appear in the apps.',
    };
  }

  const expectedSet = new Set(EXPECTED_FRAGMENTS);
  const givenSet = new Set(parts);

  for (const frag of expectedSet) {
    if (!givenSet.has(frag)) {
      return {
        ok: false,
        reason: `The fragment "${frag}" is missing from the kill code.`,
      };
    }
  }

  for (const frag of givenSet) {
    if (!expectedSet.has(frag as ExpectedFragment)) {
      return {
        ok: false,
        reason: `The fragment "${frag}" does not belong to the official kill code.`,
      };
    }
  }

  return { ok: true };
}

function readFirewallStatus() {
  if (typeof window === 'undefined') {
    return { solved: false, armed: false };
  }
  const solved = window.localStorage.getItem('overtime-firewall-solved') === 'true';
  const armed = window.localStorage.getItem('overtime-firewall-armed') === 'true';
  return { solved, armed };
}

const TERMINAL_CWD = '~/overtime-os';

const TerminalApp: React.FC = () => {
  const { markDaemonKilled, closeAllWindows } = useWindowManager();

  const [lines, setLines] = useState<Line[]>(INITIAL_LINES);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [, setHistoryIndex] = useState<number | null>(null);

  const terminalRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const nextIdRef = useRef(2);

  const cwd = TERMINAL_CWD;

  const pushLine = useCallback((type: LineType, text: string) => {
    setLines((prev) => [
      ...prev,
      {
        id: nextIdRef.current++,
        type,
        text,
      },
    ]);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleHistoryNav = (e: KeyboardEvent<HTMLInputElement>) => {
    if (history.length === 0) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHistoryIndex((prev) => {
        const nextIndex = prev === null ? history.length - 1 : Math.max(prev - 1, 0);
        setInput(history[nextIndex] ?? '');
        return nextIndex;
      });
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHistoryIndex((prev) => {
        if (prev === null) return null;
        const nextIndex = Math.min(prev + 1, history.length - 1);
        setInput(history[nextIndex] ?? '');
        return nextIndex;
      });
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const raw = input;
    const trimmed = raw.trim();
    if (!trimmed) return;

    pushLine('input', `${cwd} $ ${trimmed}`);

    setHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(null);

    handleCommand(trimmed);

    setInput('');
  };

  const handleCommand = (cmd: string) => {
    const [base, ...args] = cmd.split(/\s+/);

    switch (base) {
      case 'help': {
        pushLine(
          'output',
          [
            'Available commands:',
            '',
            '  help                         Show this help.',
            '  clear                        Clear the terminal output.',
            '  pwd                          Print current working directory.',
            '  ls                           List fake project files.',
            '  history                      Show command history (last 20).',
            '  status                       Show puzzle / daemon status.',
            '  hint                         Get a small hint about what to do next.',
            '',
            '  shutdown-overtime-daemon <KILL_CODE_1>+<KILL_CODE_2>...',
            '                               Attempt to shut down the overtime daemon using the final kill code.',
            '',
            'Kill code fragments appear in:',
            '  • Notes / StickyPad',
            '  • Media Player',
            '  • Bug Smasher',
            '  • Merge Tool',
            '  • Firewall',
          ].join('\n'),
        );
        break;
      }

      case 'clear': {
        setLines([]);
        break;
      }

      case 'pwd': {
        pushLine('output', cwd);
        break;
      }

      case 'ls': {
        pushLine(
          'output',
          [
            'src/',
            '  apps/',
            '    notes/',
            '    sticky-pad/',
            '    media-player/',
            '    mini-game-bugs/',
            '    merge-tool/',
            '    firewall-maze/',
            '  core/',
            '    overtime-daemon/',
            '    firewall/',
            'README-OVERTIME.md',
          ].join('\n'),
        );
        break;
      }

      case 'history': {
        if (history.length === 0) {
          pushLine('output', 'No history yet.');
          break;
        }
        const last = history.slice(-20);
        const linesOut = last.map(
          (h, idx) => `${history.length - last.length + idx + 1}: ${h}`,
        );
        pushLine('output', linesOut.join('\n'));
        break;
      }

      case 'status': {
        const { solved, armed } = readFirewallStatus();
        const firewallStatus = solved
          ? armed
            ? 'Firewall: solved and ARMED'
            : 'Firewall: solved but NOT armed  (run "overtimectl arm-firewall")'
          : 'Firewall: not solved  (open the Firewall Maze app)';

        pushLine('output', ['System status:', `  ${firewallStatus}`].join('\n'));
        break;
      }

      case 'hint': {
        const { solved, armed } = readFirewallStatus();

        if (!solved) {
          pushLine(
            'output',
            [
              'Hint:',
              '  The firewall is still acting weird.',
              '  Open the "Firewall Maze" app in the dock and reach the SAFE node.',
              '  There is a command written there that you will need in this terminal.',
            ].join('\n'),
          );
          break;
        }

        if (!armed) {
          pushLine(
            'output',
            [
              'Hint:',
              '  The firewall puzzle is solved, but nothing has changed yet.',
              '  Some ops engineer left a command in the Firewall Maze app.',
              '  It looks a lot like: "overtimectl arm-firewall".',
            ].join('\n'),
          );
          break;
        }

        pushLine(
          'output',
          [
            'Hint:',
            '  The firewall is armed. Now you mainly need the exact kill code.',
            '  Carefully copy each fragment you unlocked in the mini-games into your StickyPad,',
            '  then concatenate them with "+" (no spaces) after:',
            '',
            '    shutdown-overtime-daemon <KILL_CODE>',
          ].join('\n'),
        );
        break;
      }

      case 'overtimectl': {
        const sub = args[0];
        const { solved } = readFirewallStatus();

        if (!sub) {
          pushLine(
            'output',
            [
              'Usage:',
              '  overtimectl arm-firewall',
              '',
              'Available subcommands:',
              '  arm-firewall   Arm the firewall AFTER solving the Firewall Maze.',
            ].join('\n'),
          );
          break;
        }

        if (sub === 'arm-firewall') {
          if (!solved) {
            pushLine(
              'output',
              [
                'Error:',
                '  Cannot arm firewall: firewall maze has not been solved yet.',
                '  Open the "Firewall Maze" app, complete the maze, then try again.',
              ].join('\n'),
            );
            break;
          }

          if (typeof window !== 'undefined') {
            window.localStorage.setItem('overtime-firewall-armed', 'true');
          }

          pushLine(
            'output',
            [
              'Firewall armed ✅',
              '  The shutdown route will now bypass the daemon’s traps.',
              '  Next step: run "shutdown-overtime-daemon <KILL_CODE>" with all fragments.',
            ].join('\n'),
          );
          break;
        }

        pushLine(
          'output',
          [
            `Unknown overtimectl subcommand: "${sub}".`,
            'Try:',
            '  overtimectl arm-firewall',
          ].join('\n'),
        );
        break;
      }

      case 'shutdown-overtime-daemon': {
        const killCode = args[0];

        if (!killCode) {
          pushLine(
            'output',
            [
              'Usage:',
              '  shutdown-overtime-daemon <KILL_CODE>',
              '',
              'Example:',
              '  shutdown-overtime-daemon KILL-OVERTIME-NOTES+PLAYER-WAVE-ALIGNED+BUGS-FIXED+MERGE-CLEAN+SYSTEM-DRAINED+FIREWALL-MAZE',
            ].join('\n'),
          );
          break;
        }

        const { solved, armed } = readFirewallStatus();

        if (!solved) {
          pushLine(
            'output',
            [
              'Shutdown blocked:',
              '  The firewall is still misconfigured and the daemon is hijacking the route.',
              '  Open the "Firewall Maze" app, complete the maze, then:',
              '    1) Run "overtimectl arm-firewall" here.',
              '    2) Re-run the shutdown command with the full kill code.',
            ].join('\n'),
          );
          break;
        }

        if (!armed) {
          pushLine(
            'output',
            [
              'Shutdown blocked:',
              '  The firewall puzzle is solved, but the firewall is not armed.',
              '  Run:',
              '    overtimectl arm-firewall',
              '  Then re-run the shutdown command.',
            ].join('\n'),
          );
          break;
        }

        const { ok, reason } = validateKillCode(killCode);

        if (!ok) {
          pushLine(
            'output',
            [
              'Kill code rejected:',
              reason ??
                'The daemon does not recognize this sequence as the full kill code.',
              '',
              'Make sure you collected ALL fragments exactly as shown in each mini-game.',
            ].join('\n'),
          );
          break;
        }

        markDaemonKilled();
        pushLine(
          'output',
          [
            'Kill sequence accepted.',
            '  The firewall is armed, and all required fragments are present in the kill code.',
            '',
            '>>> OVERTIME DAEMON TERMINATED <<<',
            '',
            'A shutdown summary will appear. Then you can use the Power app to turn OvertimeOS off.',
          ].join('\n'),
        );

        // Close all windows (including this terminal).
        closeAllWindows();

        break;
      }

      default: {
        pushLine(
          'output',
          `command not found: ${base}\nType "help" to see what you can do here.`,
        );
        break;
      }
    }
  };

  const renderedLines = useMemo(
    () =>
      lines.map((line) => {
        const base =
          'whitespace-pre-wrap leading-relaxed px-2 py-1.5 mb-1.5 rounded-md text-[11px] sm:text-xs';

        if (line.type === 'system') {
          return (
            <div
              key={line.id}
              className={`${base} flex items-start gap-1 border border-sky-500/40 bg-slate-900/90 text-sky-100`}
            >
              <span className="mt-0.5 text-sky-400">◆</span>
              <span>{line.text}</span>
            </div>
          );
        }

        if (line.type === 'input') {
          return (
            <div
              key={line.id}
              className={`${base} flex items-start gap-1 bg-transparent text-sky-200`}
            >
              <span className="font-mono text-sky-500">›</span>
              <span className="font-mono">{line.text}</span>
            </div>
          );
        }

        return (
          <div
            key={line.id}
            className={`${base} border-l-2 border-slate-700/80 bg-slate-950/70 text-slate-100`}
          >
            {line.text}
          </div>
        );
      }),
    [lines],
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden border border-slate-800/80 bg-slate-950/95 text-slate-100 shadow-[0_0_40px_rgba(15,23,42,0.85)]">
      {/* Output area fills all available height above the prompt */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* Background grid */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-size-[100%_18px] opacity-[0.06]" />

        {/* Scrollable output */}
        <div
          ref={terminalRef}
          className="relative z-10 h-full overflow-y-auto p-3 font-mono sm:p-4"
        >
          {renderedLines}
        </div>
      </div>

      {/* Prompt (fixed at the bottom, never overflows the frame) */}
      <form
        onSubmit={handleSubmit}
        className="flex min-w-0 shrink-0 items-center gap-2 border-t border-slate-800/80 bg-slate-950/98 px-3 py-2.5 sm:px-4"
      >
        {/* Prompt prefix (cwd) – can shrink and truncate */}
        <span className="text-caption min-w-0 truncate font-mono text-slate-400">
          {cwd} $
        </span>

        {/* Input grows to fill remaining width, never overflows window */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleHistoryNav}
          className="text-body min-w-0 flex-1 border-none bg-transparent text-slate-100 outline-none placeholder:text-slate-500"
          placeholder='type "help" or try: shutdown-overtime-daemon <KILL_CODE>'
          autoComplete="off"
        />
      </form>
    </div>
  );
};
export default TerminalApp;
