import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plaque, Icon } from '@/components/primitives';
import { useData } from '@/app/data-context';
import { cx } from '@/theme';
import type { Goal } from '@/lib/domain/schemas';
import { KIND_META, ProgressBar } from './parts';
import {
  currentMetricValue,
  finishedBooksCount,
  formatValue,
  metricProgressPct,
  readingProgressPct,
} from './goalModel';
import { metricEntriesKey } from './useMetric';
import { booksKey } from './useReading';
import { workoutSessionsKey } from './useRoutine';

/**
 * GoalPlaque — one goal as a fresco plaque in the list (D16). Carries its kind motif and
 * a kind-appropriate one-line status: a metric shows current -> target with a progress
 * meter, a reading goal its finished count against the target, a routine its logged
 * session count. Each kind's status reads through the DAL under the SAME query key the
 * detail screen uses, so the cache is shared and warm on navigation. The whole plaque
 * links to the goal's page.
 */
export function GoalPlaque({ goal }: { goal: Goal }) {
  const meta = KIND_META[goal.kind];
  return (
    <Link
      to={`/goals/${goal.id}`}
      className={cx(
        'group block h-full rounded-plaque',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egyptian',
      )}
    >
      <Plaque as="article" meanderTop className="flex h-full flex-col">
        <span className={cx('inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.16em] text-ink/55')}>
          <span className={meta.tone}>
            <Icon slot={meta.iconSlot} size="sm" decorative />
          </span>
          {meta.label}
        </span>
        <h3 className="mt-2 font-display text-2xl leading-tight text-ink group-hover:text-pompeian-red">
          {goal.name}
        </h3>

        <div className="mt-4">
          {goal.kind === 'metric' ? (
            <MetricStatus goal={goal} />
          ) : goal.kind === 'reading' ? (
            <ReadingStatus goal={goal} />
          ) : (
            <RoutineStatus goal={goal} />
          )}
        </div>

        <span className="mt-auto pt-5 font-sans text-xs uppercase tracking-[0.16em] text-ochre">
          Open the goal
        </span>
      </Plaque>
    </Link>
  );
}

function MetricStatus({ goal }: { goal: Goal }) {
  const data = useData();
  const q = useQuery({
    queryKey: metricEntriesKey(goal.id),
    queryFn: () => data.listMetricEntries(goal.id),
  });
  const entries = q.data ?? [];
  const current = currentMetricValue(entries, goal.startValue);
  const pct = metricProgressPct(goal.startValue, goal.targetValue, current, goal.direction);
  const unit = goal.unit ? ` ${goal.unit}` : '';

  return (
    <div>
      <p className="font-serif text-ink/75">
        {current != null ? (
          <>
            <span className="font-display text-lg text-ink">{formatValue(current)}</span>
            {unit}
            {goal.targetValue != null ? (
              <span className="text-ink/55">
                {' '}
                toward {formatValue(goal.targetValue)}
                {unit}
              </span>
            ) : null}
          </>
        ) : (
          <span className="text-ink/55">No measurements yet</span>
        )}
      </p>
      {pct != null ? (
        <div className="mt-3">
          <ProgressBar pct={pct} tone="bg-egyptian" label={`Progress toward target: ${pct} percent`} />
          <p className="mt-1 font-sans text-xs uppercase tracking-[0.16em] text-ink/50">{pct}%</p>
        </div>
      ) : null}
    </div>
  );
}

function ReadingStatus({ goal }: { goal: Goal }) {
  const data = useData();
  const q = useQuery({
    queryKey: booksKey(goal.id),
    queryFn: () => data.listBooks(goal.id),
  });
  const finished = finishedBooksCount(q.data ?? []);
  const pct = readingProgressPct(finished, goal.targetCount);

  return (
    <div>
      <p className="font-serif text-ink/75">
        <span className="font-display text-lg text-ink">{finished}</span>
        {goal.targetCount != null ? (
          <span className="text-ink/55"> of {goal.targetCount} books read</span>
        ) : (
          <span className="text-ink/55">{finished === 1 ? ' book read' : ' books read'}</span>
        )}
      </p>
      {pct != null ? (
        <div className="mt-3">
          <ProgressBar pct={pct} tone="bg-ochre" label={`Reading progress: ${pct} percent`} />
          <p className="mt-1 font-sans text-xs uppercase tracking-[0.16em] text-ink/50">{pct}%</p>
        </div>
      ) : null}
    </div>
  );
}

function RoutineStatus({ goal }: { goal: Goal }) {
  const data = useData();
  const q = useQuery({
    queryKey: workoutSessionsKey(goal.id),
    queryFn: () => data.listWorkoutSessions(goal.id),
  });
  const count = (q.data ?? []).length;

  return (
    <p className="inline-flex items-center gap-2 font-serif text-ink/75">
      <Icon slot="indoor_workout" size="sm" decorative className="text-verdigris" />
      <span>
        <span className="font-display text-lg text-ink">{count}</span>{' '}
        {count === 1 ? 'session logged' : 'sessions logged'}
      </span>
    </p>
  );
}
