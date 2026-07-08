import { Link } from 'react-router-dom';
import { APP_NAME } from '@/config/app';
import {
  MeanderDivider,
  MedallionBadge,
} from '@/components/primitives';
import { cx } from '@/theme';
import { useToday } from './useToday';
import { RuleCheckCard } from './RuleCheckCard';
import { DayComplete } from './DayComplete';
import { EmptyToday } from './EmptyToday';
import { formatLongDate } from './dates';

/**
 * Today view (PRD 4.1 #4) — the default landing screen. Shows "Day N of M" for the
 * active challenge, each Rule as a check card with the right input per type, and,
 * once every required daily rule is sealed, a daily reward QuoteCard. Reads and writes
 * exclusively through the DAL (`useToday` -> `useData`). Editorial, asymmetric, warm.
 */
export function Today() {
  const t = useToday();

  const requiredCount = t.ruleViews.filter((rv) => rv.rule.isRequired).length;
  const sealedRequired = t.ruleViews.filter(
    (rv) => rv.rule.isRequired && rv.completed,
  ).length;

  return (
    <div className="min-h-full">
      <TopBar />

      <main className="mx-auto w-full max-w-3xl px-6 pb-24 pt-8 sm:px-8">
        {t.loading ? (
          <p className="font-serif text-lg text-ink/50">Loading your day.</p>
        ) : t.error ? (
          <p role="alert" className="font-serif text-lg text-pompeian-red">
            {t.error instanceof Error ? t.error.message : 'Something went wrong.'}
          </p>
        ) : !t.challenge || !t.position ? (
          <EmptyToday authed={t.authed} />
        ) : (
          <>
            {/* Day counter — carved medallion + challenge identity. */}
            <header className="flex flex-wrap items-center justify-between gap-6">
              <div className="min-w-0">
                <p className="font-sans text-xs uppercase tracking-[0.28em] text-ochre">
                  {formatLongDate(t.today)}
                </p>
                <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
                  {t.challenge.name}
                </h1>
                <p className="mt-2 font-sans text-sm uppercase tracking-[0.18em] text-ink/60">
                  Day {t.position.dayNumber} of {t.position.total}
                  <span className="mx-2 text-ink/30">/</span>
                  {t.challenge.strictness === 'strict' ? 'Strict' : 'Standard'}
                </p>
                <Link
                  to={`/calendar/${t.challenge.id}`}
                  className="mt-3 inline-block font-sans text-xs uppercase tracking-[0.16em] text-pompeian-red underline-offset-4 hover:underline"
                >
                  View the mosaic
                </Link>
              </div>
              <MedallionBadge
                value={t.position.dayNumber}
                label={`Day ${t.position.dayNumber} of ${t.position.total}`}
                size="lg"
                tone="text-ochre"
              />
            </header>

            {t.activeChallenges.length > 1 ? (
              <ChallengeSwitcher
                items={t.activeChallenges.map((c) => ({
                  id: c.challenge.id,
                  name: c.challenge.name,
                }))}
                selectedId={t.challenge.id}
                onSelect={t.selectChallenge}
              />
            ) : null}

            <MeanderDivider tone="text-ochre/60" height={14} className="my-8" />

            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-display text-xl text-ink">Today&rsquo;s rules</h2>
              <p className="font-sans text-xs uppercase tracking-[0.16em] text-ink/55">
                {sealedRequired} of {requiredCount} sealed
              </p>
            </div>

            <ul className="flex flex-col gap-4">
              {t.ruleViews.map((rv) => (
                <li key={rv.rule.id}>
                  <RuleCheckCard
                    view={rv}
                    onCommit={(patch) => t.commit(rv.rule.id, patch)}
                  />
                </li>
              ))}
            </ul>

            {t.commitError ? (
              <p role="alert" className="mt-4 font-sans text-sm text-pompeian-red">
                Could not save that. Check your connection and try again.
              </p>
            ) : null}

            {t.dayComplete ? (
              <DayComplete quote={t.quote} loading={t.quoteLoading} />
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}

function TopBar() {
  return (
    <div className="border-b border-ink/10">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4 sm:px-8">
        <span className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-pompeian-red">
          {APP_NAME}
        </span>
        <nav className="flex items-center gap-5 font-sans text-xs uppercase tracking-[0.16em] text-ink/60">
          <span aria-current="page" className="text-ink">
            Today
          </span>
          <Link to="/library" className="transition-colors hover:text-ink">
            Challenges
          </Link>
        </nav>
      </div>
    </div>
  );
}

function ChallengeSwitcher({
  items,
  selectedId,
  onSelect,
}: {
  items: { id: string; name: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mt-6" role="tablist" aria-label="Your active challenges">
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
                active
                  ? 'bg-ink text-plaster'
                  : 'border border-ink/25 text-ink/70 hover:bg-ink/5',
              )}
            >
              {it.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
