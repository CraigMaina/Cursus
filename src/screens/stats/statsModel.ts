import type { ChallengeStats, DayCompletion } from '@/lib/domain/stats';

/**
 * Pure view-model helpers for the stats screen. No React, no DAL; they shape the
 * already-computed `ChallengeStats` (PRD 4.1 #9) into chart-ready rows so the screen
 * stays declarative and this stays unit-testable.
 */

export interface CompletionPoint {
  /** 1-based day index within the run window. */
  day: number;
  date: string;
  /** Cumulative required-rule completion through this day, 0..100 (rounded). */
  cumulativePct: number;
  /** Whether every required daily rule was sealed that day. */
  complete: boolean;
  /** True when a Strict reset landed on this day (server-authoritative). */
  reset: boolean;
}

/**
 * Cumulative completion percentage over the elapsed window. For each day it is the
 * running sealed required-rule-days divided by the running required total, so the line
 * reads as "how faithfully am I tracking overall", smoothing single bad days rather
 * than spiking. Reset days are flagged from the server's reset dates.
 */
export function buildCompletionSeries(
  days: DayCompletion[],
  resetDates: readonly string[],
): CompletionPoint[] {
  const resets = new Set(resetDates);
  let sealed = 0;
  let required = 0;
  return days.map((d, i) => {
    sealed += d.completed;
    required += d.required;
    const cumulativePct = required > 0 ? Math.round((sealed / required) * 100) : 0;
    return {
      day: i + 1,
      date: d.date,
      cumulativePct,
      complete: d.complete,
      reset: resets.has(d.date),
    };
  });
}

/** Reset points mapped to their 1-based day index, for chart reference lines. */
export function resetMarkers(
  days: DayCompletion[],
  resetDates: readonly string[],
): { day: number; date: string }[] {
  const indexByDate = new Map<string, number>();
  days.forEach((d, i) => indexByDate.set(d.date, i + 1));
  return resetDates
    .filter((rd) => indexByDate.has(rd))
    .map((rd) => ({ day: indexByDate.get(rd)!, date: rd }))
    .sort((a, b) => a.day - b.day);
}

/** Percentage form of an adherence rate (0..1) for labels. */
export function ratePct(rate: number): number {
  return Math.round(rate * 100);
}

/** Overall completion as a whole percentage. */
export function overallPct(stats: ChallengeStats): number {
  return Math.round(stats.overallRate * 100);
}
