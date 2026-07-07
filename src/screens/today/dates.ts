/**
 * Small calendar-date helpers for the Today view. All dates are ISO calendar strings
 * 'YYYY-MM-DD' (schemas.isoDate). We parse them as UTC midnight so day arithmetic is
 * DST-proof; the "today" string is taken from the device's local wall clock, which is
 * the day the user is actually living. (Per-profile timezone math is a Phase 6
 * refinement; noted in the handoff.)
 */

/** Device-local calendar date as 'YYYY-MM-DD'. */
export function todayIso(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toUtcMs(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Whole days from `fromIso` to `toIso` (toIso - fromIso). Negative if `to` precedes `from`. */
export function diffDays(fromIso: string, toIso: string): number {
  const ms = toUtcMs(toIso) - toUtcMs(fromIso);
  return Math.round(ms / 86_400_000);
}

export type ChallengeStatus = 'upcoming' | 'active' | 'finished';

export interface DayPosition {
  /** 1-based day index within the challenge (clamped to >= 1 for display). */
  dayNumber: number;
  total: number;
  status: ChallengeStatus;
}

/** Where a challenge sits relative to `today`: not started, running (day N of M), or done. */
export function computeDay(
  startDate: string,
  durationDays: number,
  today: string = todayIso(),
): DayPosition {
  const elapsed = diffDays(startDate, today); // 0 on the start date
  const dayNumber = elapsed + 1;
  let status: ChallengeStatus = 'active';
  if (elapsed < 0) status = 'upcoming';
  else if (dayNumber > durationDays) status = 'finished';
  return {
    dayNumber: Math.max(1, Math.min(dayNumber, durationDays)),
    total: durationDays,
    status,
  };
}

/** Long-form date for headings, e.g. "Monday, 7 July 2026". No locale surprises in copy. */
export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
