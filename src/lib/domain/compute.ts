import { MILESTONE_DAYS } from '@/config/app';

/**
 * Pure client-side computations (PRD 4.1 #6, #8). No React, no DAL, no Supabase —
 * just the days-clean, savings, and milestone math so it can be unit-tested in
 * isolation. Dates are ISO 'YYYY-MM-DD' strings compared via UTC to avoid DST/locale
 * drift (matching the calendar model and the reset logic).
 *
 * NOTE on savings (DECISIONS D14): a vice carries `costPerUnit`, `timePerUnitMinutes`,
 * and `dailyUnits` (units/day avoided). Reclaimed money = days * dailyUnits *
 * costPerUnit; reclaimed time = days * dailyUnits * timePerUnitMinutes. A dimension
 * with any null input is reported as null (not shown).
 */

const MS_PER_DAY = 86_400_000;

/** Whole days from `from` to `to` (to - from); negative if `to` precedes `from`. */
export function daysBetween(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split('-').map(Number);
  const [ty, tm, td] = toIso.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / MS_PER_DAY);
}

/**
 * Days clean for a vice: elapsed days since the most recent relapse, or the quit date
 * if there has been none. Clamped at 0 (a future quit date reads as 0 days clean).
 */
export function daysClean(
  quitDate: string,
  lastRelapseDate: string | null,
  today: string,
): number {
  const anchor = lastRelapseDate && lastRelapseDate > quitDate ? lastRelapseDate : quitDate;
  return Math.max(0, daysBetween(anchor, today));
}

export interface Savings {
  /** Money reclaimed, or null if cost/units unknown. */
  money: number | null;
  /** Minutes reclaimed, or null if time/units unknown. */
  minutes: number | null;
}

/** Reclaimed money and time over `days` clean, given the vice's rate figures. */
export function computeSavings(
  vice: {
    dailyUnits: number | null;
    costPerUnit: number | null;
    timePerUnitMinutes: number | null;
  },
  days: number,
): Savings {
  const units = vice.dailyUnits;
  const money =
    units != null && vice.costPerUnit != null ? days * units * vice.costPerUnit : null;
  const minutes =
    units != null && vice.timePerUnitMinutes != null
      ? days * units * vice.timePerUnitMinutes
      : null;
  return { money, minutes };
}

/** Split a minutes total into whole days/hours/minutes for display. */
export function splitMinutes(total: number): { days: number; hours: number; minutes: number } {
  const t = Math.max(0, Math.round(total));
  return {
    days: Math.floor(t / 1440),
    hours: Math.floor((t % 1440) / 60),
    minutes: t % 60,
  };
}

/** Milestone day thresholds reached at or below `count`, ascending. */
export function reachedMilestones(
  count: number,
  milestones: readonly number[] = MILESTONE_DAYS,
): number[] {
  return milestones.filter((m) => count >= m);
}

/** True when `count` is exactly one of the milestone thresholds. */
export function isMilestone(count: number, milestones: readonly number[] = MILESTONE_DAYS): boolean {
  return milestones.includes(count);
}

/** The highest milestone reached at `count`, or null if none yet. */
export function latestMilestone(
  count: number,
  milestones: readonly number[] = MILESTONE_DAYS,
): number | null {
  const reached = reachedMilestones(count, milestones);
  return reached.length ? reached[reached.length - 1] : null;
}
