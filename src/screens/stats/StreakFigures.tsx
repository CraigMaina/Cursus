import { MedallionBadge } from '@/components/primitives';
import { cx } from '@/theme';

/**
 * Streak figures (PRD 4.1 #9): the current trailing streak and the longest run ever
 * held, struck as carved Roman medallions (font-display numerals via MedallionBadge).
 * Purely presentational; the numbers come from `computeChallengeStats`.
 */
export function StreakFigures({
  currentStreak,
  longestStreak,
  overallPct,
}: {
  currentStreak: number;
  longestStreak: number;
  overallPct: number;
}) {
  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Figure
        badge={
          <MedallionBadge
            value={currentStreak}
            label={`Current streak, ${currentStreak} days`}
            size="md"
            tone="text-pompeian-red"
          />
        }
        term="Current streak"
        detail={`${currentStreak} day${currentStreak === 1 ? '' : 's'} held`}
      />
      <Figure
        badge={
          <MedallionBadge
            value={longestStreak}
            label={`Longest streak, ${longestStreak} days`}
            size="md"
            tone="text-ochre"
          />
        }
        term="Longest streak"
        detail={`${longestStreak} day${longestStreak === 1 ? '' : 's'} best`}
      />
      <Figure
        badge={
          <MedallionBadge
            value={`${overallPct}%`}
            label={`Overall completion, ${overallPct} percent`}
            size="md"
            tone="text-verdigris"
            laurel={false}
          />
        }
        term="Completion"
        detail="Required rules kept overall"
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
