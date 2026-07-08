import { MedallionBadge } from '@/components/primitives';
import { cx } from '@/theme';
import type { CalendarStats as Stats } from './calendarModel';

/**
 * The three headline figures for a challenge (PRD 4.1 #5): current streak, longest
 * streak, and overall completion. Carved Roman medallions for the streaks, a plaque
 * for the percentage. All numerals in font-display (Cinzel), anchored on the
 * effective start via the model so a Strict reset shows the true current run.
 */
export function CalendarStats({ stats }: { stats: Stats }) {
  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Figure
        badge={
          <MedallionBadge
            value={stats.currentStreak}
            label={`Current streak, ${stats.currentStreak} days`}
            size="md"
            tone="text-pompeian-red"
          />
        }
        term="Current streak"
        detail={`${stats.currentStreak} day${stats.currentStreak === 1 ? '' : 's'} held`}
      />
      <Figure
        badge={
          <MedallionBadge
            value={stats.longestStreak}
            label={`Longest streak, ${stats.longestStreak} days`}
            size="md"
            tone="text-ochre"
          />
        }
        term="Longest streak"
        detail={`${stats.longestStreak} day${stats.longestStreak === 1 ? '' : 's'} best`}
      />
      <Figure
        badge={
          <MedallionBadge
            value={`${stats.completionPct}%`}
            label={`Overall completion, ${stats.completionPct} percent`}
            size="md"
            tone="text-verdigris"
            laurel={false}
          />
        }
        term="Completion"
        detail={`Day ${stats.runDayNumber} of ${stats.runTotal} this run`}
      />
    </dl>
  );
}

function Figure({
  badge,
  term,
  detail,
}: {
  badge: React.ReactNode;
  term: string;
  detail: string;
}) {
  return (
    <div
      className={cx(
        'flex items-center gap-4 rounded-plaque border border-ink/15 bg-plaster-deep/60 px-4 py-4',
        'shadow-sm shadow-ink/10',
      )}
    >
      <div className="shrink-0">{badge}</div>
      <div className="min-w-0">
        <dt className="font-sans text-xs uppercase tracking-[0.2em] text-ink/60">{term}</dt>
        <dd className="mt-1 font-serif text-base text-ink/80">{detail}</dd>
      </div>
    </div>
  );
}
