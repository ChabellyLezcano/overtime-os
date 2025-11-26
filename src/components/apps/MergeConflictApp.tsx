'use client';

import React, { useMemo, useState } from 'react';

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

const MERGE_HUNKS: MergeHunk[] = [
  {
    id: 1,
    file: 'src/hooks/useOvertime.ts',
    description: 'Toggle to silently accept unpaid overtime.',
    goal:
      'I want to keep the current overtime toggle behaviour so we can spot daemon patches later.',
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
    goal:
      'I want the function to reveal how the daemon undercounts unpaid minutes, not hide it.',
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
    goal:
      'I want a final kill code builder that can combine all fragments discovered in other apps.',
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

interface ChoiceState {
  choice: MergeChoice | null;
  manualId?: number | null;
}

const MergeConflictApp: React.FC = () => {
  const [choices, setChoices] = useState<Record<number, ChoiceState>>(() =>
    Object.fromEntries(
      MERGE_HUNKS.map((h) => [h.id, { choice: null, manualId: null }]),
    ),
  );
  const [testsRun, setTestsRun] = useState(false);
  const [testsPassed, setTestsPassed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resolvedCount = useMemo(
    () =>
      MERGE_HUNKS.filter((h) => choices[h.id]?.choice !== null).length,
    [choices],
  );

  const allResolved = resolvedCount === MERGE_HUNKS.length;

  const handleChoice = (hunkId: number, choice: MergeChoice) => {
    setChoices((prev) => ({
      ...prev,
      [hunkId]: { choice, manualId: null },
    }));
    setTestsRun(false);
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
      setErrorMessage(
        `Merge still has ${unresolved.length} unresolved conflict(s).`,
      );
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
        setErrorMessage(
          `Tests failed: wrong resolution in "${h.file}".`,
        );
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
  };

  const progressPercent = Math.round(
    (resolvedCount / MERGE_HUNKS.length) * 100,
  );

  return (
    <div className="w-full h-full flex flex-col p-3 sm:p-4 text-xs sm:text-md text-slate-100 overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-3">
        <div className="min-w-0">
          <h2 className="text-md sm:text-base font-semibold text-fuchsia-300 truncate">
            Merge Tool – Conflict Resolver
          </h2>
          <p className="text-[11px] text-slate-300 truncate">
            Clean up the daemon&apos;s messy merge and prepare the final kill code builder.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-[10px] text-slate-400">
          <span>Conflicts: {MERGE_HUNKS.length}</span>
          <span className="px-2 py-0.5 rounded-full border border-slate-700/80 bg-slate-950/90 text-slate-200">
            Resolved: {resolvedCount}/{MERGE_HUNKS.length}
          </span>
        </div>
      </div>

      {/* CONTENT SCROLLABLE */}
      <div className="flex-1 min-h-0 flex flex-col gap-3 sm:gap-4 overflow-y-auto">
        {/* PROGRESS STRIP */}
        <div className="rounded-2xl bg-slate-950/95 border border-slate-800/80 p-3 sm:p-4 text-[11px]">
          <p className="text-slate-300 mb-2">
            Each conflict shows the <span className="text-sky-300">HEAD</span> version,
            the <span className="text-rose-300">incoming</span> changes, or lets you craft
            a <span className="text-emerald-300">smart merge</span>. Choose wisely.
          </p>
          <p className="text-[10px] text-slate-400 mb-2">
            This tool is most powerful after you&apos;ve explored the other apps:
            the final builder will concatenate whatever fragments you discover there.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span>Merge progress</span>
                <span className="text-sky-300 font-semibold">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
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
              className={`rounded-2xl border p-3 sm:p-4 space-y-3 ${
                isComplete
                  ? 'border-emerald-400/60 bg-emerald-500/5'
                  : 'border-slate-800/80 bg-slate-950/90'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 mb-0.5">
                    Conflict {h.id}
                  </p>
                  <p className="text-xs sm:text-md font-semibold text-slate-100">
                    {h.file}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {h.description}
                  </p>
                  <p className="mt-1 text-[11px] text-sky-300">
                    Goal for this test:{' '}
                    <span className="font-semibold">{h.goal}</span>
                  </p>
                </div>
                <div className="text-[10px] text-slate-400 text-right">
                  <p>
                    Status:{' '}
                    {isComplete ? (
                      <span className="text-emerald-300">resolved</span>
                    ) : (
                      <span className="text-amber-300">pending</span>
                    )}
                  </p>
                  {isMixed && (
                    <p className="text-emerald-300 font-semibold">
                      Smart merge active
                    </p>
                  )}
                </div>
              </div>

              {/* Code panels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* HEAD */}
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/90 overflow-hidden">
                  <div className="px-2 py-1.5 flex items-center justify-between text-[10px] bg-slate-900/90 border-b border-slate-800/80">
                    <span className="text-sky-300 font-mono">HEAD</span>
                    <button
                      type="button"
                      onClick={() => handleChoice(h.id, 'ours')}
                      className={`px-2 py-0.5 rounded-full border text-[10px] ${
                        selected === 'ours'
                          ? 'bg-sky-500/20 border-sky-400/80 text-sky-200'
                          : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-sky-400/60'
                      }`}
                    >
                      Keep HEAD
                    </button>
                  </div>
                  <pre className="p-2 text-[10px] sm:text-[11px] text-slate-200 overflow-x-auto">
                    {h.ours}
                  </pre>
                </div>

                {/* INCOMING */}
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/90 overflow-hidden">
                  <div className="px-2 py-1.5 flex items-center justify-between text-[10px] bg-slate-900/90 border-b border-slate-800/80">
                    <span className="text-rose-300 font-mono">incoming</span>
                    <button
                      type="button"
                      onClick={() => handleChoice(h.id, 'theirs')}
                      className={`px-2 py-0.5 rounded-full border text-[10px] ${
                        selected === 'theirs'
                          ? 'bg-rose-500/20 border-rose-400/80 text-rose-200'
                          : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-rose-400/60'
                      }`}
                    >
                      Keep incoming
                    </button>
                  </div>
                  <pre className="p-2 text-[10px] sm:text-[11px] text-slate-200 overflow-x-auto">
                    {h.theirs}
                  </pre>
                </div>
              </div>

              {/* Smart merge options */}
              {h.manualOptions && (
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/90 p-2 sm:p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-slate-300">
                      Or craft a <span className="text-emerald-300">smart merge</span>:
                    </p>
                    <button
                      type="button"
                      onClick={() => handleChoice(h.id, 'mixed')}
                      className={`px-3 py-1 rounded-full border text-[10px] ${
                        selected === 'mixed'
                          ? 'bg-emerald-500/20 border-emerald-400/80 text-emerald-200'
                          : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-emerald-400/60'
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
                            className={`w-full text-left rounded-lg border px-2 py-1.5 text-[11px] sm:text-[12px] transition
                              ${
                                isActive
                                  ? 'bg-emerald-500/15 border-emerald-400/80 text-emerald-100'
                                  : 'bg-slate-950 border-slate-700 text-slate-200 hover:border-emerald-400/60'
                              }`}
                          >
                            <p className="font-semibold mb-1">{opt.label}</p>
                            <pre className="text-[10px] sm:text-[11px] text-slate-200 overflow-x-auto">
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
        <div className="rounded-2xl bg-slate-950/95 border border-slate-800/80 p-3 sm:p-4 text-[11px] space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-slate-300">
              When you think all conflicts are properly resolved, run the tests.
              The daemon relies on fragile merges that never get fully checked.
            </p>
            <button
              type="button"
              onClick={runTests}
              className="px-4 py-1.5 rounded-full bg-fuchsia-500 hover:bg-fuchsia-400 text-slate-950 text-[11px] font-semibold shadow-lg shadow-fuchsia-500/40 transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!allResolved}
            >
              Run tests
            </button>
          </div>

          {!testsRun && !testsPassed && (
            <p className="text-[10px] text-slate-500">
              Tip: this tool prepares the kill code builder, but the actual fragments
              live in other apps. Explore everything.
            </p>
          )}

          {testsRun && !testsPassed && (
            <div className="mt-1 rounded-xl border border-rose-400/80 bg-rose-500/10 p-2">
              <p className="text-rose-200 font-semibold mb-0.5">
                Tests failed – merge still unsafe.
              </p>
              <p className="text-slate-100">
                {errorMessage ??
                  'Something in this merge is still feeding the overtime daemon.'}
              </p>
            </div>
          )}

          {testsRun && testsPassed && (
            <div className="mt-1 rounded-xl border border-emerald-400/80 bg-linear-to-br from-emerald-500/15 via-slate-950 to-emerald-500/10 p-3 shadow-[0_0_20px_rgba(52,211,153,0.45)]">
              <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-300 mb-1">
                Kill code fragment unlocked
              </p>
              <p className="text-emerald-200 mb-1">
                With the merge properly cleaned, the daemon&apos;s hidden patch is
                exposed in the code history:
              </p>
              <p className="font-mono text-[11px] text-emerald-100 break-all">
                Third fragment of the kill code:
                <br />
                <span className="font-semibold">+MERGE-CLEAN</span>
              </p>
              <p className="mt-1 text-slate-300">
                Add this fragment to your StickyPad. The actual builder will only work
                once you&apos;ve discovered the other fragments in the rest of the system.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MergeConflictApp;
