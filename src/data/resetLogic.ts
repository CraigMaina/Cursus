/**
 * Pure Strict-mode reset evaluation — the unit-testable mirror of the SQL function
 * `evaluate_challenge_resets` (supabase/migrations/20260707001500_reset_function.sql).
 *
 * IMPORTANT: this is NOT the authoritative writer. The database function is. This helper
 * exists so the day-walk logic can be exercised in isolation (Vitest) and so the frontend
 * can DERIVE a challenge's effective start from its reset rows without reimplementing the
 * rewind. The client can never fabricate or suppress a reset with it: real reset rows are
 * only ever written server-side, and RLS forbids client inserts on challenge_resets.
 *
 * Semantics kept in lockstep with the SQL:
 *   - Only 'strict' challenges reset; standard/freeze never do.
 *   - Walk from the ORIGINAL start_date; a day is a MISS if any required, daily rule has no
 *     completed entry that day. n_per_week rules are not evaluated per-day.
 *   - On a miss, record the reset and rewind the effective start to the next day.
 *   - Stop once the current run has completed (duration days elapsed with no miss).
 *   - `horizonDate` is the last CLOSED day; callers must clamp it (the SQL clamps via the
 *     owner's timezone + evening threshold). This helper does not re-derive "closed".
 */
import type { Strictness } from '@/lib/domain/schemas';

export interface ResetEvaluationInput {
  strictness: Strictness;
  /** Original challenge start, 'YYYY-MM-DD'. Never mutated by a reset. */
  startDate: string;
  durationDays: number;
  /** Ids of rules that are BOTH required and daily — the ones a reset hinges on. */
  requiredDailyRuleIds: string[];
  /** Keys `${ruleId}|${YYYY-MM-DD}` for which an entry exists with completed = true. */
  completedKeys: ReadonlySet<string>;
  /** Last CLOSED calendar day to evaluate through, 'YYYY-MM-DD' (already clamped). */
  horizonDate: string;
}

const MS_PER_DAY = 86_400_000;

/** 'YYYY-MM-DD' -> integer day index (days since the Unix epoch, UTC). */
function dayIndex(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

/** Integer day index -> 'YYYY-MM-DD'. */
function isoFromIndex(n: number): string {
  return new Date(n * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Add `n` days to a 'YYYY-MM-DD' date, returning 'YYYY-MM-DD'. */
export function addDays(iso: string, n: number): string {
  return isoFromIndex(dayIndex(iso) + n);
}

/**
 * Compute the Strict-mode reset dates for a challenge. Returns the reset dates in
 * chronological order; empty for non-strict challenges or when nothing was missed.
 */
export function computeStrictResets(input: ResetEvaluationInput): string[] {
  if (input.strictness !== 'strict') return [];
  const resets: string[] = [];
  const horizon = dayIndex(input.horizonDate);
  let effStart = dayIndex(input.startDate);
  let day = dayIndex(input.startDate);

  while (day <= horizon) {
    const runEnd = effStart + (input.durationDays - 1);
    if (day > runEnd) break; // current run completed cleanly; stop
    const date = isoFromIndex(day);
    const missed = input.requiredDailyRuleIds.some(
      (ruleId) => !input.completedKeys.has(`${ruleId}|${date}`),
    );
    if (missed) {
      resets.push(date);
      effStart = day + 1; // rewind effective start to the day after the miss
    }
    day += 1;
  }
  return resets;
}

/**
 * The effective start of a challenge given its reset dates: the day AFTER the most recent
 * reset, or the original start if it has never reset. This is how "Day N of M" is anchored
 * on the Today view without mutating start_date (which the calendar still needs to draw the
 * pre-reset days and their scar).
 */
export function effectiveStartDate(startDate: string, resetDates: string[]): string {
  if (resetDates.length === 0) return startDate;
  let latest = resetDates[0];
  for (const d of resetDates) if (d > latest) latest = d;
  const rewound = addDays(latest, 1);
  return rewound > startDate ? rewound : startDate;
}
