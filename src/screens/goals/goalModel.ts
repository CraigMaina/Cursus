import type {
  Book,
  Goal,
  MetricEntry,
  RoutineExercise,
  WorkoutSet,
} from '@/lib/domain/schemas';

/**
 * Pure view-model helpers for the Goals screens (D16). No React, no DAL — they shape
 * already-loaded rows into display-ready numbers (progress, current value, session
 * volume) so the screens stay declarative and this stays unit-testable. Nothing here
 * is server-authoritative; it is presentation math over data the DAL already returned.
 */

// ---------------------------------------------------------------------------
// Metric
// ---------------------------------------------------------------------------

/** The most recent measurement by calendar date, or null when there are none. */
export function latestMetricEntry(entries: MetricEntry[]): MetricEntry | null {
  if (entries.length === 0) return null;
  return entries.reduce((latest, e) =>
    e.entryDate > latest.entryDate ? e : latest,
  );
}

/**
 * The current value to display: the most recent measurement, falling back to the
 * goal's recorded start value, or null if neither exists.
 */
export function currentMetricValue(
  entries: MetricEntry[],
  startValue: number | null,
): number | null {
  const latest = latestMetricEntry(entries);
  if (latest) return latest.value;
  return startValue;
}

/**
 * Progress toward the target as a whole percent 0..100, or null when it cannot be
 * computed (missing target, missing current, or a start that equals the target so
 * there is no distance to cover). Direction chooses which way counts as forward:
 *   down     — losing toward a lower target (weight loss)
 *   up       — gaining toward a higher target (a lift, a measurement growing)
 *   maintain — holding near the target; progress is closeness to it
 */
export function metricProgressPct(
  startValue: number | null,
  targetValue: number | null,
  currentValue: number | null,
  direction: Goal['direction'],
): number | null {
  if (targetValue == null || currentValue == null) return null;

  if (direction === 'maintain') {
    if (startValue == null || startValue === targetValue) {
      return currentValue === targetValue ? 100 : 0;
    }
    const span = Math.abs(startValue - targetValue);
    const gap = Math.abs(currentValue - targetValue);
    return clampPct((1 - gap / span) * 100);
  }

  if (startValue == null) return null;

  const denom = direction === 'down' ? startValue - targetValue : targetValue - startValue;
  if (denom <= 0) return null; // target is not in the stated direction from start
  const gained = direction === 'down' ? startValue - currentValue : currentValue - startValue;
  return clampPct((gained / denom) * 100);
}

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export interface MetricPoint {
  date: string;
  value: number;
}

/** Measurements as chart rows, oldest first (the x-axis reads left to right in time). */
export function metricSeries(entries: MetricEntry[]): MetricPoint[] {
  return [...entries]
    .sort((a, b) => a.entryDate.localeCompare(b.entryDate))
    .map((e) => ({ date: e.entryDate, value: e.value }));
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

/** Books counted as read (those with a finished date). */
export function finishedBooksCount(books: Book[]): number {
  return books.filter((b) => b.finishedDate != null).length;
}

/** Reading progress toward the target count as a whole percent, or null if no target. */
export function readingProgressPct(
  finished: number,
  targetCount: number | null,
): number | null {
  if (targetCount == null || targetCount <= 0) return null;
  return clampPct((finished / targetCount) * 100);
}

/** Books sorted for display: finished newest-first, then unfinished by title. */
export function sortBooksForDisplay(books: Book[]): Book[] {
  return [...books].sort((a, b) => {
    if (a.finishedDate && b.finishedDate) return b.finishedDate.localeCompare(a.finishedDate);
    if (a.finishedDate) return -1;
    if (b.finishedDate) return 1;
    return a.title.localeCompare(b.title);
  });
}

// ---------------------------------------------------------------------------
// Routine
// ---------------------------------------------------------------------------

/** Total lifted volume for a set of logged sets: sum of reps times weight. */
export function sessionVolume(sets: WorkoutSet[]): number {
  return sets.reduce((sum, s) => sum + (s.reps ?? 0) * (s.weight ?? 0), 0);
}

/** Group logged sets by exercise name, preserving first-seen order. */
export function groupSetsByExercise(sets: WorkoutSet[]): {
  name: string;
  sets: WorkoutSet[];
}[] {
  const order: string[] = [];
  const byName = new Map<string, WorkoutSet[]>();
  for (const s of sets) {
    if (!byName.has(s.exerciseName)) {
      byName.set(s.exerciseName, []);
      order.push(s.exerciseName);
    }
    byName.get(s.exerciseName)!.push(s);
  }
  return order.map((name) => ({
    name,
    sets: [...byName.get(name)!].sort((a, b) => a.setNumber - b.setNumber),
  }));
}

/** A one-line target summary for a template exercise, e.g. "3 x 10 at 60 kg". */
export function exerciseTargetLine(ex: Pick<RoutineExercise, 'targetSets' | 'targetReps' | 'targetWeight' | 'unit'>): string {
  const parts: string[] = [];
  if (ex.targetSets != null && ex.targetReps != null) {
    parts.push(`${ex.targetSets} x ${ex.targetReps}`);
  } else if (ex.targetSets != null) {
    parts.push(`${ex.targetSets} sets`);
  } else if (ex.targetReps != null) {
    parts.push(`${ex.targetReps} reps`);
  }
  if (ex.targetWeight != null) {
    parts.push(`at ${ex.targetWeight}${ex.unit ? ` ${ex.unit}` : ''}`);
  }
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Shared display
// ---------------------------------------------------------------------------

/** Trim a number for display: drop a trailing ".0" but keep real decimals. */
export function formatValue(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}
