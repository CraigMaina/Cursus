import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppNav } from '@/app/AppNav';
import { MeanderDivider, MedallionBadge } from '@/components/primitives';
import { cx } from '@/theme';
import { useCalendar } from './useCalendar';
import { MosaicMonth } from './MosaicMonth';
import { CalendarStats } from './CalendarStats';
import { ResetDeathScreen } from './ResetDeathScreen';
import { DayDetail } from './DayDetail';

/**
 * Progress calendar screen (PRD 4.1 #5). The month mosaic of tesserae, the streak and
 * completion figures anchored on the reset-aware effective start, the Strict-reset
 * scar, and the death-screen reset quote. Reads and writes exclusively through the DAL
 * (`useCalendar` -> `useData`); reset evaluation is server-authoritative.
 */
export function Calendar() {
  const { challengeId } = useParams();
  const c = useCalendar(challengeId);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [scarDismissed, setScarDismissed] = useState(false);

  return (
    <div className="min-h-full">
      <AppNav />

      <main className="mx-auto w-full max-w-3xl px-6 pb-24 pt-8 sm:px-8">
        {c.loading ? (
          <p className="font-serif text-lg text-ink/50">Reading the wall.</p>
        ) : c.error ? (
          <p role="alert" className="font-serif text-lg text-pompeian-red">
            {c.error instanceof Error ? c.error.message : 'Something went wrong.'}
          </p>
        ) : !c.authed ? (
          <p className="font-serif text-lg text-ink/70">
            <Link to="/auth/sign-in" className="text-pompeian-red underline-offset-4 hover:underline">
              Sign in
            </Link>{' '}
            to see your progress.
          </p>
        ) : !c.challenge || !c.stats || !c.win ? (
          <p className="font-serif text-lg text-ink/70">
            No such challenge.{' '}
            <Link to="/library" className="text-pompeian-red underline-offset-4 hover:underline">
              Browse the library
            </Link>
            .
          </p>
        ) : (
          <>
            <header className="flex flex-wrap items-center justify-between gap-6">
              <div className="min-w-0">
                <p className="font-sans text-xs uppercase tracking-[0.28em] text-ochre">
                  The mosaic
                </p>
                <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
                  {c.challenge.name}
                </h1>
                <p className="mt-2 font-sans text-sm uppercase tracking-[0.18em] text-ink/60">
                  Day {c.stats.runDayNumber} of {c.stats.runTotal} this run
                  <span className="mx-2 text-ink/30">/</span>
                  {c.challenge.strictness === 'strict' ? 'Strict' : 'Standard'}
                </p>
              </div>
              <MedallionBadge
                value={c.stats.runDayNumber}
                label={`Day ${c.stats.runDayNumber} of ${c.stats.runTotal}`}
                size="lg"
                tone="text-ochre"
              />
            </header>

            <MeanderDivider tone="text-ochre/60" height={14} className="my-8" />

            {/* Month navigation */}
            <div className="mb-4 flex items-center justify-between">
              <MonthNavButton onClick={c.goPrev} disabled={!c.canPrev} dir="prev" />
              <h2 className="font-display text-xl text-ink">{c.monthView?.label}</h2>
              <MonthNavButton onClick={c.goNext} disabled={!c.canNext} dir="next" />
            </div>

            {c.monthView ? (
              <MosaicMonth month={c.monthView} onSelectDay={setSelectedDate} />
            ) : null}

            <div className="mt-10">
              <CalendarStats stats={c.stats} />
            </div>

            {c.latestReset && !scarDismissed ? (
              <div className="mt-12">
                <ResetDeathScreen
                  enabled
                  resetDate={c.latestReset}
                  queryScope={c.challenge.id}
                  fetchQuote={c.getResetQuote}
                  onDismiss={() => setScarDismissed(true)}
                />
              </div>
            ) : null}
          </>
        )}
      </main>

      {selectedDate ? (
        <DayDetail
          date={selectedDate}
          rows={c.entriesForDate(selectedDate)}
          busy={c.backfilling}
          onBackfill={c.backfill}
          onClose={() => setSelectedDate(null)}
        />
      ) : null}
    </div>
  );
}

function MonthNavButton({
  onClick,
  disabled,
  dir,
}: {
  onClick: () => void;
  disabled: boolean;
  dir: 'prev' | 'next';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'prev' ? 'Previous month' : 'Next month'}
      className={cx(
        'rounded-plaque border border-ink/20 px-3 py-1.5 font-sans text-xs uppercase tracking-[0.16em] text-ink/70',
        'transition-colors hover:bg-ink/5 disabled:opacity-30',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egyptian',
      )}
    >
      {dir === 'prev' ? 'Prev' : 'Next'}
    </button>
  );
}

