import { MILESTONE_DAYS } from '@/config/app';
import { reachedMilestones } from '@/lib/domain/compute';
import { MedallionBadge } from '@/components/primitives';

/**
 * Earned-milestone medallion strip (PRD 4.1 #8, 4.2). One medallion per MILESTONE_DAYS
 * threshold: struck gold for those reached (via `reachedMilestones(elapsedDays)`), muted
 * for the ones still ahead. The strip reads left to right as a wall of earned honours.
 */
export function MilestoneStrip({ elapsedDays }: { elapsedDays: number }) {
  const reached = new Set(reachedMilestones(elapsedDays));
  const nextAhead = MILESTONE_DAYS.find((m) => !reached.has(m)) ?? null;

  return (
    <section aria-label="Milestone medallions">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-xl text-ink">Milestones</h2>
        <p className="font-sans text-xs uppercase tracking-[0.16em] text-ink/55">
          {reached.size} of {MILESTONE_DAYS.length} earned
        </p>
      </div>
      <p className="mt-1 font-serif text-sm text-ink/70">
        {nextAhead != null
          ? `Day ${nextAhead} is the next honour to strike.`
          : 'Every milestone struck. The full course is yours.'}
      </p>

      <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-8">
        {MILESTONE_DAYS.map((day) => {
          const earned = reached.has(day);
          return (
            <li key={day} className="flex flex-col items-center gap-2">
              <MedallionBadge
                value={day}
                label={`Day ${day} milestone${earned ? ', earned' : ', not yet reached'}`}
                size="sm"
                tone={earned ? 'text-ochre' : 'text-ink'}
                earned={earned}
                laurel={earned}
              />
              <span className="font-sans text-xs uppercase tracking-[0.16em] text-ink/55">
                Day {day}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
