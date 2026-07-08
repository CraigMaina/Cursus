/**
 * Pure calendar model for the progress mosaic (PRD 4.1 #5). No React, no DAL, no
 * Supabase — just the day-state, streak, and completion math so it can be reasoned
 * about and unit-tested in isolation. The screen (useCalendar) feeds it entries and
 * server-authoritative reset dates; it never fabricates a reset here.
 *
 * Day arithmetic goes through `addDays` (the same helper the reset logic uses), so a
 * calendar day is always an ISO 'YYYY-MM-DD' string compared lexicographically, which
 * is DST-proof and matches how the schema stores dates.
 */
import type { MosaicState } from '@/components/primitives';
import type { Entry, Rule } from '@/lib/domain/schemas';
import { addDays, effectiveStartDate } from '@/data';

/** A single day of the challenge, positioned and coloured. */
export interface DayCell {
  /** ISO 'YYYY-MM-DD'. */
  date: string;
  /** 1-based index from the ORIGINAL start (what the mosaic labels a tile). */
  dayNumber: number;
  /** State token consumed by MosaicTile. */
  state: MosaicState;
  /** True on a day the server recorded a Strict reset (the scar). */
  isReset: boolean;
}

export interface CalendarStats {
  currentStreak: number;
  longestStreak: number;
  /** 0..100, rounded. Completed closed days over evaluated (non-rest) closed days. */
  completionPct: number;
  /** "Day N of M" for the CURRENT run, anchored on the effective start. */
  runDayNumber: number;
  runTotal: number;
}

export interface ChallengeWindow {
  /** Original start (never mutated by a reset). */
  startDate: string;
  /** Day after the most recent reset, or startDate. Anchors "Day N of M". */
  effectiveStart: string;
  /** Last day of the current run: effectiveStart + duration - 1. */
  spanEnd: string;
  durationDays: number;
}

const MS_PER_DAY = 86_400_000;

/** Whole days from a -> b (b - a); negative if b precedes a. Lexical-safe via UTC. */
export function diff(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / MS_PER_DAY);
}

/** Ids of rules that are required AND daily — the ones a Strict reset hinges on. */
export function requiredDailyRuleIds(rules: Rule[]): string[] {
  return rules.filter((r) => r.isRequired && r.frequency === 'daily').map((r) => r.id);
}

/** Ids of rules that are required and n_per_week (never per-day evaluated for reset). */
export function requiredWeeklyRuleIds(rules: Rule[]): string[] {
  return rules.filter((r) => r.isRequired && r.frequency === 'n_per_week').map((r) => r.id);
}

/** Build the set of `${ruleId}|${date}` keys for entries marked completed. */
export function completedKeySet(entries: Entry[]): Set<string> {
  const set = new Set<string>();
  for (const e of entries) if (e.completed) set.add(`${e.ruleId}|${e.entryDate}`);
  return set;
}

/**
 * Resolve the challenge's display window from its start, duration, and the
 * server-authoritative reset dates.
 */
export function challengeWindow(
  startDate: string,
  durationDays: number,
  resetDates: string[],
): ChallengeWindow {
  const effectiveStart = effectiveStartDate(startDate, resetDates);
  const spanEnd = addDays(effectiveStart, durationDays - 1);
  return { startDate, effectiveStart, spanEnd, durationDays };
}

/**
 * Colour one day. `today` is the last day the user is living; anything after it is
 * `future`. A recorded reset date wins (it is the scar). Otherwise state derives from
 * required-daily completion; a challenge with only n_per_week required rules shows
 * `rest` on days with no logged activity (an off day) and `complete` on active days.
 */
export function dayState(
  date: string,
  today: string,
  requiredDaily: string[],
  requiredWeekly: string[],
  completedKeys: ReadonlySet<string>,
  resetDates: ReadonlySet<string>,
): MosaicState {
  if (date > today) return 'future';
  if (resetDates.has(date)) return 'reset';

  if (requiredDaily.length > 0) {
    let done = 0;
    for (const id of requiredDaily) if (completedKeys.has(`${id}|${date}`)) done += 1;
    if (done === requiredDaily.length) return 'complete';
    if (done > 0) return 'partial';
    return 'missed';
  }

  // No required daily rules: an n_per_week-only (or ruleless) challenge. We cannot
  // judge a weekly quota per day, so a day with any logged required activity reads
  // complete, and an empty day reads as a legitimate rest day rather than a miss.
  const active = requiredWeekly.some((id) => completedKeys.has(`${id}|${date}`));
  return active ? 'complete' : 'rest';
}

/**
 * Build the ordered day cells across the whole challenge window (original start
 * through the current run's end), each coloured. This is the source the month grid
 * and the stats both read from.
 */
export function buildDayCells(
  win: ChallengeWindow,
  today: string,
  rules: Rule[],
  entries: Entry[],
  resetDates: string[],
): DayCell[] {
  const requiredDaily = requiredDailyRuleIds(rules);
  const requiredWeekly = requiredWeeklyRuleIds(rules);
  const completedKeys = completedKeySet(entries);
  const resetSet = new Set(resetDates);

  const cells: DayCell[] = [];
  const total = diff(win.startDate, win.spanEnd);
  for (let i = 0; i <= total; i += 1) {
    const date = addDays(win.startDate, i);
    cells.push({
      date,
      dayNumber: i + 1,
      state: dayState(date, today, requiredDaily, requiredWeekly, completedKeys, resetSet),
      isReset: resetSet.has(date),
    });
  }
  return cells;
}

/** A day that counts toward a streak (a fully held day). */
function isHeld(state: MosaicState): boolean {
  return state === 'complete';
}
/** A day that neither advances nor breaks a streak (an off day / not yet lived). */
function isNeutral(state: MosaicState): boolean {
  return state === 'rest' || state === 'future';
}

/**
 * Streaks + completion over the closed (<= today) portion of the window. Rest days are
 * neutral (they neither build nor break a run); a miss, partial, or reset breaks it.
 */
export function computeStats(cells: DayCell[], win: ChallengeWindow, today: string): CalendarStats {
  const closed = cells.filter((c) => c.date <= today);

  // Longest run of held days, rest days bridging without incrementing.
  let longest = 0;
  let run = 0;
  for (const c of closed) {
    if (isHeld(c.state)) {
      run += 1;
      if (run > longest) longest = run;
    } else if (isNeutral(c.state)) {
      // neutral: carry the run without counting the day
    } else {
      run = 0;
    }
  }

  // Current streak: walk back from the last closed day.
  let current = 0;
  for (let i = closed.length - 1; i >= 0; i -= 1) {
    const s = closed[i].state;
    if (isHeld(s)) current += 1;
    else if (isNeutral(s)) continue;
    else break;
  }

  const evaluated = closed.filter((c) => c.state !== 'rest');
  const completed = evaluated.filter((c) => c.state === 'complete').length;
  const completionPct = evaluated.length === 0 ? 0 : Math.round((completed / evaluated.length) * 100);

  const rawRunDay = diff(win.effectiveStart, today) + 1;
  const runDayNumber = Math.max(1, Math.min(rawRunDay, win.durationDays));

  return {
    currentStreak: current,
    longestStreak: longest,
    completionPct,
    runDayNumber,
    runTotal: win.durationDays,
  };
}

// ---------------------------------------------------------------------------
// Month-grid layout (Monday-first weeks)
// ---------------------------------------------------------------------------

export interface MonthCell {
  date: string;
  /** The challenge day cell, when this calendar date falls inside the window. */
  day: DayCell | null;
  /** A real date but outside the challenge window (dimmed, non-interactive). */
  outOfRange: boolean;
  /** Padding slot to align the first/last week; renders empty. */
  pad: boolean;
}

export interface MonthView {
  /** First of the month, 'YYYY-MM-01'. */
  monthStart: string;
  /** e.g. "July 2026". */
  label: string;
  /** 6 weeks x 7 days, Monday-first. */
  weeks: MonthCell[][];
}

/** 'YYYY-MM' of a date. */
export function monthKey(date: string): string {
  return date.slice(0, 7);
}

/** Human label "July 2026" for a 'YYYY-MM' or full date, UTC to avoid locale drift. */
export function monthLabel(monthOrDate: string): string {
  const [y, m] = monthOrDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Monday-first weekday index (Mon=0 .. Sun=6) for a date. */
function mondayIndex(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // Sun=0
  return (dow + 6) % 7;
}

/** Days in a given month (1..28/29/30/31). */
function daysInMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

/**
 * Lay out one month as Monday-first weeks. Challenge days map to their DayCell; other
 * real dates are `outOfRange`; leading/trailing slots are `pad`.
 */
export function buildMonthView(
  monthOrDate: string,
  cellsByDate: Map<string, DayCell>,
): MonthView {
  const [y, m] = monthOrDate.split('-').map(Number);
  const monthStart = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-01`;
  const lead = mondayIndex(monthStart);
  const dim = daysInMonth(y, m);

  const flat: MonthCell[] = [];
  for (let i = 0; i < lead; i += 1) flat.push({ date: '', day: null, outOfRange: false, pad: true });
  for (let d = 1; d <= dim; d += 1) {
    const date = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const day = cellsByDate.get(date) ?? null;
    flat.push({ date, day, outOfRange: day === null, pad: false });
  }
  while (flat.length % 7 !== 0) flat.push({ date: '', day: null, outOfRange: false, pad: true });

  const weeks: MonthCell[][] = [];
  for (let i = 0; i < flat.length; i += 7) weeks.push(flat.slice(i, i + 7));
  return { monthStart, label: monthLabel(monthOrDate), weeks };
}

/** The ordered list of month keys the window spans, for prev/next navigation. */
export function monthsInWindow(win: ChallengeWindow): string[] {
  const out: string[] = [];
  let cursor = win.startDate.slice(0, 7);
  const last = win.spanEnd.slice(0, 7);
  // Guard against pathological loops.
  for (let i = 0; i < 240 && cursor <= last; i += 1) {
    out.push(cursor);
    const [y, m] = cursor.split('-').map(Number);
    const ny = m === 12 ? y + 1 : y;
    const nm = m === 12 ? 1 : m + 1;
    cursor = `${String(ny).padStart(4, '0')}-${String(nm).padStart(2, '0')}`;
  }
  return out;
}
