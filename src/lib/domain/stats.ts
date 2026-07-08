import type { Entry, Rule } from './schemas';
import { daysBetween } from './compute';

/**
 * Pure challenge statistics (PRD 4.1 #9). Given a challenge's rules and logged entries,
 * derive the day-by-day completion series, per-rule adherence, overall completion, and
 * streaks. No React, no DAL - a screen passes in what it already loaded and this computes,
 * so it is unit-testable in isolation. Dates are ISO 'YYYY-MM-DD' compared via UTC.
 */

function addDaysIso(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export interface DayCompletion {
  date: string;
  required: number; // required daily rules that day
  completed: number; // of those, how many were sealed
  complete: boolean; // every required daily rule sealed
}

export interface RuleAdherence {
  ruleId: string;
  name: string;
  expected: number; // eligible occurrences over the elapsed window
  completed: number;
  rate: number; // completed / expected, 0..1
}

export interface ChallengeStats {
  elapsedDays: number; // days from start through min(today, last day)
  days: DayCompletion[];
  overallRate: number; // sealed required rule-days / total required rule-days
  currentStreak: number; // trailing consecutive complete days
  longestStreak: number;
  perRule: RuleAdherence[];
}

export function computeChallengeStats(input: {
  startDate: string;
  durationDays: number;
  today: string;
  rules: Rule[];
  entries: Entry[];
}): ChallengeStats {
  const { startDate, durationDays, today, rules, entries } = input;

  const lastDay = addDaysIso(startDate, durationDays - 1);
  const throughDate = today < lastDay ? today : lastDay;
  const elapsedDays = Math.max(0, daysBetween(startDate, throughDate) + 1);

  // Fast lookup of sealed (ruleId + date).
  const sealed = new Set<string>();
  for (const e of entries) if (e.completed) sealed.add(`${e.ruleId}|${e.entryDate}`);

  const requiredDaily = rules.filter((r) => r.isRequired && r.frequency === 'daily');

  const days: DayCompletion[] = [];
  let sealedRuleDays = 0;
  let currentStreak = 0;
  let longestStreak = 0;
  let run = 0;

  for (let i = 0; i < elapsedDays; i++) {
    const date = addDaysIso(startDate, i);
    let completed = 0;
    for (const r of requiredDaily) if (sealed.has(`${r.id}|${date}`)) completed++;
    const complete = requiredDaily.length > 0 && completed === requiredDaily.length;
    sealedRuleDays += completed;
    days.push({ date, required: requiredDaily.length, completed, complete });

    if (complete) {
      run++;
      if (run > longestStreak) longestStreak = run;
    } else {
      run = 0;
    }
  }
  // Current streak: trailing complete days.
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].complete) currentStreak++;
    else break;
  }

  const totalRequiredRuleDays = requiredDaily.length * elapsedDays;
  const overallRate = totalRequiredRuleDays > 0 ? sealedRuleDays / totalRequiredRuleDays : 0;

  // Per-rule adherence across every rule (daily counts each day; n_per_week counts per week).
  const elapsedWeeks = Math.max(1, Math.ceil(elapsedDays / 7));
  const perRule: RuleAdherence[] = rules.map((r) => {
    let completed = 0;
    for (let i = 0; i < elapsedDays; i++) {
      if (sealed.has(`${r.id}|${addDaysIso(startDate, i)}`)) completed++;
    }
    const expected =
      r.frequency === 'daily'
        ? elapsedDays
        : Math.max(1, (r.frequencyCount ?? 1) * elapsedWeeks);
    const rate = expected > 0 ? Math.min(1, completed / expected) : 0;
    return { ruleId: r.id, name: r.name, expected, completed, rate };
  });

  return { elapsedDays, days, overallRate, currentStreak, longestStreak, perRule };
}
