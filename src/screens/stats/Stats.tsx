import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME } from '@/config/app';
import { MeanderDivider } from '@/components/primitives';
import { cx } from '@/theme';
import type { Rule } from '@/lib/domain/schemas';
import { useStats, type StatsChallengeOption } from './useStats';
import { buildCompletionSeries, overallPct, resetMarkers } from './statsModel';
import { CompletionChart } from './CompletionChart';
import { RuleAdherence } from './RuleAdherence';
import { StreakFigures } from './StreakFigures';
import { MilestoneStrip } from './MilestoneStrip';

/**
 * Stats dashboard (PRD 4.1 #9, 4.2). Completion over time, per-rule adherence, streak
 * figures, and the earned-milestone medallion strip for one challenge (a selector when
 * several exist). Reads exclusively through the DAL (`useStats` -> `useData`); all math
 * is the pure `computeChallengeStats`. Editorial, asymmetric, warm; charts carry an
 * accessible summary and a table fallback.
 */
export function Stats() {
  const s = useStats();

  const series = useMemo(
    () => (s.stats ? buildCompletionSeries(s.stats.days, s.resetDates) : []),
    [s.stats, s.resetDates],
  );
  const markers = useMemo(
    () => (s.stats ? resetMarkers(s.stats.days, s.resetDates) : []),
    [s.stats, s.resetDates],
  );
  const rulesById = useMemo(() => {
    const map = new Map<string, Rule>();
    for (const r of s.rules) map.set(r.id, r);
    return map;
  }, [s.rules]);

  return (
    <div className="min-h-full">
      <TopBar />

      <main className="mx-auto w-full max-w-3xl px-6 pb-24 pt-8 sm:px-8">
        {s.loading ? (
          <p className="font-serif text-lg text-ink/50">Reading the record.</p>
        ) : s.error ? (
          <p role="alert" className="font-serif text-lg text-pompeian-red">
            {s.error instanceof Error ? s.error.message : 'Something went wrong.'}
          </p>
        ) : !s.authed ? (
          <p className="font-serif text-lg text-ink/70">
            <Link to="/auth/sign-in" className="text-pompeian-red underline-offset-4 hover:underline">
              Sign in
            </Link>{' '}
            to see your record.
          </p>
        ) : !s.hasChallenges || !s.challenge ? (
          <EmptyStats />
        ) : (
          <>
            <header className="flex flex-wrap items-end justify-between gap-6">
              <div className="min-w-0">
                <p className="font-sans text-xs uppercase tracking-[0.28em] text-ochre">
                  The record
                </p>
                <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
                  {s.challenge.name}
                </h1>
                <p className="mt-2 font-sans text-sm uppercase tracking-[0.18em] text-ink/60">
                  {s.stats ? `${s.stats.elapsedDays} day${s.stats.elapsedDays === 1 ? '' : 's'} elapsed` : ''}
                  <span className="mx-2 text-ink/30">/</span>
                  {s.challenge.strictness === 'strict' ? 'Strict' : 'Standard'}
                </p>
                <Link
                  to={`/calendar/${s.challenge.id}`}
                  className="mt-3 inline-block font-sans text-xs uppercase tracking-[0.16em] text-pompeian-red underline-offset-4 hover:underline"
                >
                  View the mosaic
                </Link>
              </div>
            </header>

            {s.selectorItems.length > 1 ? (
              <ChallengeSelector
                items={s.selectorItems}
                selectedId={s.selectedId}
                onSelect={s.selectChallenge}
              />
            ) : null}

            <MeanderDivider tone="text-ochre/60" height={14} className="my-8" />

            {s.stats ? (
              <div className="flex flex-col gap-10">
                <StreakFigures
                  currentStreak={s.stats.currentStreak}
                  longestStreak={s.stats.longestStreak}
                  overallPct={overallPct(s.stats)}
                />

                <CompletionChart points={series} resets={markers} />

                <RuleAdherence perRule={s.stats.perRule} rulesById={rulesById} />

                <MilestoneStrip elapsedDays={s.stats.elapsedDays} />
              </div>
            ) : (
              <p className="font-serif text-lg text-ink/60">
                Nothing logged yet. Seal a day and the record begins.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function ChallengeSelector({
  items,
  selectedId,
  onSelect,
}: {
  items: StatsChallengeOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mt-6" role="tablist" aria-label="Choose a challenge">
      <div className="flex flex-wrap gap-2">
        {items.map((it) => {
          const active = it.id === selectedId;
          return (
            <button
              key={it.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(it.id)}
              className={cx(
                'rounded-plaque px-3.5 py-1.5 font-sans text-xs font-medium uppercase tracking-[0.12em]',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egyptian',
                active ? 'bg-ink text-plaster' : 'border border-ink/25 text-ink/70 hover:bg-ink/5',
              )}
            >
              {it.name}
              {it.active ? (
                <span className="ml-2 text-ochre" aria-label="active">
                  &bull;
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmptyStats() {
  return (
    <div className="max-w-prose">
      <p className="font-sans text-xs uppercase tracking-[0.28em] text-ochre">The record</p>
      <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">Nothing to chart yet</h1>
      <p className="mt-4 font-serif text-lg text-ink/70">
        Start a challenge and your completion, streaks, and milestones take shape here.
      </p>
      <Link
        to="/library"
        className="mt-6 inline-block font-sans text-xs uppercase tracking-[0.16em] text-pompeian-red underline-offset-4 hover:underline"
      >
        Browse the library
      </Link>
    </div>
  );
}

function TopBar() {
  return (
    <div className="border-b border-ink/10">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4 sm:px-8">
        <Link
          to="/"
          className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-pompeian-red"
        >
          {APP_NAME}
        </Link>
        <nav className="flex items-center gap-5 font-sans text-xs uppercase tracking-[0.16em] text-ink/60">
          <Link to="/" className="transition-colors hover:text-ink">
            Today
          </Link>
          <Link to="/library" className="transition-colors hover:text-ink">
            Challenges
          </Link>
          <span aria-current="page" className="text-ink">
            Stats
          </span>
        </nav>
      </div>
    </div>
  );
}
