'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { copyToClipboard } from '@/utils/copyToClipboard'; // ajusta la ruta si hace falta

type MergeChoice = 'ours' | 'theirs' | 'mixed';

interface ManualOption {
  id: number;
  label: string;
  code: string;
}

interface MergeHunk {
  id: number;
  file: string;
  description: string;
  /** Short sentence: what we want from this test */
  goal: string;
  ours: string;
  theirs: string;
  correctChoice: MergeChoice;
  manualOptions?: ManualOption[];
  correctManualId?: number;
}

interface ChoiceState {
  choice: MergeChoice | null;
  manualId?: number | null;
}

const STORAGE_KEY = 'merge-solved';
const SOLVED_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MERGE_FRAGMENT = '+MERGE-CLEAN';

const persistSolvedState = () => {
  if (typeof window === 'undefined') return;

  const payload = {
    solved: true,
    expiresAt: Date.now() + SOLVED_TTL_MS,
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Error saving solved state to localStorage', error);
  }
};

const MERGE_HUNKS: MergeHunk[] = [
  {
    id: 1,
    file: 'src/hooks/useOvertime.ts',
    description: 'Toggle to silently accept unpaid overtime.',
    goal: 'I want to keep the current overtime toggle behaviour so we can spot daemon patches later.',
    ours: `export function useOvertime() {
  const [enabled, setEnabled] = useState(true);

  return {
    enabled,
    enable: () => setEnabled(true),
    disable: () => setEnabled(false),
  };
}`,
    theirs: `export function useOvertime() {
  const [enabled, setEnabled] = useState(false);

  return {
    enabled,
    enable: () => setEnabled(true),
    disable: () => setEnabled(false),
  };
}`,
    correctChoice: 'ours',
  },
  {
    id: 2,
    file: 'src/utils/timeTracking.ts',
    description: 'Function that normalizes tracked time.',
    goal: 'I want the function to reveal how the daemon undercounts unpaid minutes, not hide it.',
    ours: `export function getTrackedMinutes(hours: number) {
  return hours * 60;
}`,
    theirs: `export function getTrackedMinutes(hours: number) {
  // Overtime daemon patch: always rounds down unpaid minutes
  return Math.floor(hours * 60 * 0.75);
}`,
    correctChoice: 'theirs',
  },
  {
    id: 3,
    file: 'src/core/killCode.ts',
    description: 'Critical function that will be used by the shutdown sequence.',
    goal: 'I want a final kill code builder that can combine all fragments discovered in other apps.',
    ours: `export function buildKillCode(base: string) {
  return base + '-SAFE';
}`,
    theirs: `export function buildKillCode(base: string) {
  return base + '-DAEMON';
}`,
    correctChoice: 'mixed',
    manualOptions: [
      {
        id: 1,
        label: 'Keep daemon suffix (probably fine)',
        code: `export function buildKillCode(base: string, fragments: string[]) {
  // Daemon-friendly: keeps the daemon suffix
  return base + '-DAEMON';
}`,
      },
      {
        id: 2,
        label: 'Keep safe suffix (boring but OK)',
        code: `export function buildKillCode(base: string, fragments: string[]) {
  // Safe but ignores all external fragments
  return base + '-SAFE';
}`,
      },
      {
        id: 3,
        label: 'Custom: builder that concatenates external fragments',
        code: `export function buildKillCode(base: string, fragments: string[]) {
  // Final builder: combines everything the player unlocked in other tools
  return base + '-FINAL' + fragments.join('');
}`,
      },
    ],
    correctManualId: 3,
  },
];

const MergeConflictApp: React.FC = () => {
  const [choices, setChoices] = useState<Record<number, ChoiceState>>(() =>
    Object.fromEntries(MERGE_HUNKS.map((h) => [h.id, { choice: null, manualId: null }])),
  );
  const [testsRun, setTestsRun] = useState(false);
  const [testsPassed, setTestsPassed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load persisted solved state on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const data = JSON.parse(raw) as { solved?: boolean; expiresAt?: number };

      if (!data?.expiresAt) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      if (Date.now() < data.expiresAt && data.solved) {
        // Pre-fill choices with correct answers so UI looks resolved
        const solvedChoices: Record<number, ChoiceState> = {};
        for (const h of MERGE_HUNKS) {
          solvedChoices[h.id] = {
            choice: h.correctChoice,
            manualId: h.correctChoice === 'mixed' ? (h.correctManualId ?? null) : null,
          };
        }
        setChoices(solvedChoices);
        setTestsRun(true);
        setTestsPassed(true);
        setErrorMessage(null);
      } else {
        // Expired, clean up
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error reading merge state from localStorage', error);
    }
  }, []);

  const resolvedCount = useMemo(
    () => MERGE_HUNKS.filter((h) => choices[h.id]?.choice !== null).length,
    [choices],
  );

  const allResolved = resolvedCount === MERGE_HUNKS.length;

  const handleChoice = (hunkId: number, choice: MergeChoice) => {
    setChoices((prev) => ({
      ...prev,
      [hunkId]: { choice, manualId: null },
    }));
    setTestsRun(false);
    setTestsPassed(false);
    setErrorMessage(null);
  };

  const handleManualChoice = (hunkId: number, manualId: number) => {
    setChoices((prev) => ({
      ...prev,
      [hunkId]: {
        ...(prev[hunkId] ?? { choice: 'mixed' as MergeChoice }),
        choice: 'mixed',
        manualId,
      },
    }));
    setTestsRun(false);
    setTestsPassed(false);
    setErrorMessage(null);
  };

  const runTests = () => {
    setTestsRun(true);
    setErrorMessage(null);

    const unresolved = MERGE_HUNKS.filter(
      (h) => !choices[h.id] || choices[h.id].choice === null,
    );
    if (unresolved.length > 0) {
      setTestsPassed(false);
      setErrorMessage(`Merge still has ${unresolved.length} unresolved conflict(s).`);
      return;
    }

    for (const h of MERGE_HUNKS) {
      const state = choices[h.id];
      if (!state) {
        setTestsPassed(false);
        setErrorMessage('Internal error: missing choice state.');
        return;
      }

      if (state.choice !== h.correctChoice) {
        setTestsPassed(false);
        setErrorMessage(`Tests failed: wrong resolution in "${h.file}".`);
        return;
      }

      if (h.correctChoice === 'mixed') {
        if (!h.correctManualId || state.manualId !== h.correctManualId) {
          setTestsPassed(false);
          setErrorMessage(
            `Tests failed: custom merge in "${h.file}" does not produce a valid kill code builder.`,
          );
          return;
        }
      }
    }

    setTestsPassed(true);
    persistSolvedState();
  };

  const handleCopyFragment = () => {
    void copyToClipboard(MERGE_FRAGMENT, {
      setCopied,
      timeoutMs: 1500,
    });
  };

  const progressPercent = Math.round((resolvedCount / MERGE_HUNKS.length) * 100);

  return (
    <div className="sm:text-md flex h-full w-full flex-col overflow-hidden p-3 text-xs text-slate-100 sm:p-4">
      {/* HEADER */}
      <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
        <div className="min-w-0">
          <h2 className="text-md truncate font-semibold text-fuchsia-300 sm:text-base">
            Merge Tool – Conflict Resolver
          </h2>
          <p className="truncate text-[14px] text-slate-300">
            Clean up the daemon&apos;s messy merge and prepare the final kill code
            builder.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-[12px] text-slate-400">
          <span>Conflicts: {MERGE_HUNKS.length}</span>
          <span className="rounded-full border border-slate-700/80 bg-slate-950/90 px-2 py-0.5 text-slate-200">
            Resolved: {resolvedCount}/{MERGE_HUNKS.length}
          </span>
        </div>
      </div>

      {/* CONTENT SCROLLABLE */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto sm:gap-4">
        {/* PROGRESS STRIP */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/95 p-3 text-[14px] sm:p-4">
          <p className="mb-2 text-slate-300">
            Each conflict shows the <span className="text-sky-300">HEAD</span> version,
            the <span className="text-rose-300">incoming</span> changes, or lets you craft
            a <span className="text-emerald-300">smart merge</span>. Choose wisely.
          </p>
          <p className="mb-2 text-[12px] text-slate-400">
            This tool is most powerful after you&apos;ve explored the other apps: the
            final builder will concatenate whatever fragments you discover there.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between text-[12px] text-slate-400">
                <span>Merge progress</span>
                <span className="font-semibold text-sky-300">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/80">
                <div
                  className="h-full bg-linear-to-r from-rose-400 via-fuchsia-400 to-emerald-400 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* HUNKS */}
        {MERGE_HUNKS.map((h) => {
          const state = choices[h.id] ?? { choice: null, manualId: null };
          const selected = state.choice;
          const isMixed = selected === 'mixed';
          const isComplete =
            selected !== null &&
            (h.correctChoice !== 'mixed' ||
              (h.correctChoice === 'mixed' && !!state.manualId));

          return (
            <div
              key={h.id}
              className={`space-y-3 rounded-2xl border p-3 sm:p-4 ${
                isComplete
                  ? 'border-emerald-400/60 bg-emerald-500/5'
                  : 'border-slate-800/80 bg-slate-950/90'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="mb-0.5 text-[14px] tracking-[0.16em] text-slate-400 uppercase">
                    Conflict {h.id}
                  </p>
                  <p className="sm:text-md text-xs font-semibold text-slate-100">
                    {h.file}
                  </p>
                  <p className="text-[14px] text-slate-400">{h.description}</p>
                  <p className="mt-1 text-[14px] font-bold text-sky-300">
                    Goal for this test: <span className="font-semibold">{h.goal}</span>
                  </p>
                </div>
                <div className="text-right text-[12px] text-slate-400">
                  <p>
                    Status:{' '}
                    {isComplete ? (
                      <span className="text-emerald-300">resolved</span>
                    ) : (
                      <span className="text-amber-300">pending</span>
                    )}
                  </p>
                  {isMixed && (
                    <p className="font-semibold text-emerald-300">Smart merge active</p>
                  )}
                </div>
              </div>

              {/* Code panels */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* HEAD */}
                <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/90">
                  <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90 px-2 py-1.5 text-[12px]">
                    <span className="font-mono text-sky-300">HEAD</span>
                    <button
                      type="button"
                      onClick={() => handleChoice(h.id, 'ours')}
                      className={`rounded-full border px-2 py-0.5 text-[12px] ${
                        selected === 'ours'
                          ? 'border-sky-400/80 bg-sky-500/20 text-sky-200'
                          : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-sky-400/60'
                      }`}
                    >
                      Keep HEAD
                    </button>
                  </div>
                  <pre className="overflow-x-auto p-2 text-[12px] text-slate-200 sm:text-[14px]">
                    {h.ours}
                  </pre>
                </div>

                {/* INCOMING */}
                <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/90">
                  <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90 px-2 py-1.5 text-[12px]">
                    <span className="font-mono text-rose-300">incoming</span>
                    <button
                      type="button"
                      onClick={() => handleChoice(h.id, 'theirs')}
                      className={`rounded-full border px-2 py-0.5 text-[12px] ${
                        selected === 'theirs'
                          ? 'border-rose-400/80 bg-rose-500/20 text-rose-200'
                          : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-rose-400/60'
                      }`}
                    >
                      Keep incoming
                    </button>
                  </div>
                  <pre className="overflow-x-auto p-2 text-[12px] text-slate-200 sm:text-[14px]">
                    {h.theirs}
                  </pre>
                </div>
              </div>

              {/* Smart merge options */}
              {h.manualOptions && (
                <div className="space-y-2 rounded-xl border border-slate-800/80 bg-slate-950/90 p-2 sm:p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[14px] text-slate-300">
                      Or craft a <span className="text-emerald-300">smart merge</span>:
                    </p>
                    <button
                      type="button"
                      onClick={() => handleChoice(h.id, 'mixed')}
                      className={`rounded-full border px-3 py-1 text-[12px] ${
                        selected === 'mixed'
                          ? 'border-emerald-400/80 bg-emerald-500/20 text-emerald-200'
                          : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-emerald-400/60'
                      }`}
                    >
                      Enable custom merge
                    </button>
                  </div>

                  {selected === 'mixed' && (
                    <div className="space-y-2">
                      {h.manualOptions.map((opt) => {
                        const isActive = state.manualId === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleManualChoice(h.id, opt.id)}
                            className={`w-full rounded-lg border px-2 py-1.5 text-left text-[14px] transition sm:text-[12px] ${
                              isActive
                                ? 'border-emerald-400/80 bg-emerald-500/15 text-emerald-100'
                                : 'border-slate-700 bg-slate-950 text-slate-200 hover:border-emerald-400/60'
                            }`}
                          >
                            <p className="mb-1 font-semibold">{opt.label}</p>
                            <pre className="overflow-x-auto text-[12px] text-slate-200 sm:text-[14px]">
                              {opt.code}
                            </pre>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* TEST PANEL / KILL CODE */}
        <div className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-950/95 p-3 text-[14px] sm:p-4">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={runTests}
              className="rounded-full bg-fuchsia-500 px-4 py-1.5 text-[14px] font-semibold text-slate-950 shadow-lg shadow-fuchsia-500/40 transition hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!allResolved}
            >
              Run tests
            </button>
          </div>

          {testsRun && !testsPassed && (
            <div className="mt-1 rounded-xl border border-rose-400/80 bg-rose-500/10 p-2">
              <p className="mb-0.5 font-semibold text-rose-200">
                Tests failed – merge still unsafe.
              </p>
              <p className="text-slate-100">
                {errorMessage ??
                  'Something in this merge is still feeding the overtime daemon.'}
              </p>
            </div>
          )}

          {testsRun && testsPassed && (
            <div className="mt-1 space-y-2 rounded-xl border border-emerald-400/80 bg-linear-to-br from-emerald-500/15 via-slate-950 to-emerald-500/10 p-3 shadow-[0_0_20px_rgba(52,211,153,0.45)]">
              <p className="mb-1 text-[12px] tracking-[0.16em] text-emerald-300 uppercase">
                Kill code fragment unlocked
              </p>

              {/* Input + copy para el fragmento */}
              <div className="space-y-1">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    readOnly
                    value={MERGE_FRAGMENT}
                    className="flex-1 overflow-x-auto rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 font-mono text-[11px] text-emerald-200"
                  />
                  <button
                    type="button"
                    onClick={handleCopyFragment}
                    className="rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-slate-950 shadow-md shadow-emerald-500/40 transition hover:bg-emerald-400"
                  >
                    {copied ? 'Copied ✓' : 'Copy'}
                  </button>
                </div>
                {copied && (
                  <p className="text-[10px] text-emerald-300">
                    Fragment copied. Paste it into your StickyPad along with the rest of
                    the kill code.
                  </p>
                )}
              </div>

              <p className="mt-1 text-slate-300">
                Add this fragment to your StickyPad. The daemon can&apos;t stand when the
                merge conflicts are solved.
              </p>
            </div>
          )}

          {!testsRun && !testsPassed && (
            <p className="text-[12px] text-slate-500">
              Tip: this tool prepares the kill code builder, but the actual fragments live
              in other apps. Explore everything.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MergeConflictApp;
