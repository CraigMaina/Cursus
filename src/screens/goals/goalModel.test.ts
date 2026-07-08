import { describe, it, expect } from 'vitest';
import {
  currentMetricValue,
  exerciseTargetLine,
  finishedBooksCount,
  formatValue,
  groupSetsByExercise,
  latestMetricEntry,
  metricProgressPct,
  metricSeries,
  readingProgressPct,
  sessionVolume,
  sortBooksForDisplay,
} from './goalModel';
import type { Book, MetricEntry, WorkoutSet } from '@/lib/domain/schemas';

const entry = (entryDate: string, value: number): MetricEntry => ({
  id: `${entryDate}-${value}`,
  goalId: 'g',
  entryDate,
  value,
  note: null,
});

const book = (partial: Partial<Book>): Book => ({
  id: Math.random().toString(),
  goalId: 'g',
  title: 'Untitled',
  author: null,
  finishedDate: null,
  rating: null,
  note: null,
  ...partial,
});

const set = (partial: Partial<WorkoutSet>): WorkoutSet => ({
  id: Math.random().toString(),
  sessionId: 's',
  exerciseId: null,
  exerciseName: 'Squat',
  setNumber: 1,
  reps: null,
  weight: null,
  ...partial,
});

describe('latestMetricEntry / currentMetricValue', () => {
  it('returns the most recent measurement by date', () => {
    const entries = [entry('2026-01-01', 90), entry('2026-03-01', 84), entry('2026-02-01', 87)];
    expect(latestMetricEntry(entries)?.value).toBe(84);
    expect(currentMetricValue(entries, 95)).toBe(84);
  });

  it('falls back to startValue then null when there are no entries', () => {
    expect(currentMetricValue([], 95)).toBe(95);
    expect(currentMetricValue([], null)).toBeNull();
    expect(latestMetricEntry([])).toBeNull();
  });
});

describe('metricProgressPct', () => {
  it('down: halfway from start toward a lower target is 50 percent', () => {
    expect(metricProgressPct(90, 80, 85, 'down')).toBe(50);
  });

  it('down: reaching the target is 100, past it clamps at 100', () => {
    expect(metricProgressPct(90, 80, 80, 'down')).toBe(100);
    expect(metricProgressPct(90, 80, 78, 'down')).toBe(100);
  });

  it('up: gaining toward a higher target', () => {
    expect(metricProgressPct(60, 100, 80, 'up')).toBe(50);
    expect(metricProgressPct(60, 100, 40, 'up')).toBe(0); // going backwards clamps at 0
  });

  it('maintain: closeness to the target', () => {
    expect(metricProgressPct(70, 75, 75, 'maintain')).toBe(100);
    expect(metricProgressPct(70, 75, 70, 'maintain')).toBe(0);
    expect(metricProgressPct(70, 75, 72.5, 'maintain')).toBe(50);
  });

  it('returns null when it cannot be computed', () => {
    expect(metricProgressPct(90, null, 85, 'down')).toBeNull();
    expect(metricProgressPct(90, 80, null, 'down')).toBeNull();
    expect(metricProgressPct(null, 80, 85, 'down')).toBeNull();
    expect(metricProgressPct(80, 90, 85, 'down')).toBeNull(); // target wrong side of start
  });
});

describe('metricSeries', () => {
  it('sorts oldest first', () => {
    const s = metricSeries([entry('2026-03-01', 84), entry('2026-01-01', 90)]);
    expect(s.map((p) => p.date)).toEqual(['2026-01-01', '2026-03-01']);
    expect(s.map((p) => p.value)).toEqual([90, 84]);
  });
});

describe('reading', () => {
  it('counts only finished books', () => {
    const books = [book({ finishedDate: '2026-01-01' }), book({}), book({ finishedDate: '2026-02-01' })];
    expect(finishedBooksCount(books)).toBe(2);
  });

  it('progress is finished over target, clamped', () => {
    expect(readingProgressPct(6, 12)).toBe(50);
    expect(readingProgressPct(15, 12)).toBe(100);
    expect(readingProgressPct(3, null)).toBeNull();
    expect(readingProgressPct(3, 0)).toBeNull();
  });

  it('sorts finished newest-first then unfinished by title', () => {
    const a = book({ title: 'A', finishedDate: '2026-01-01' });
    const b = book({ title: 'B', finishedDate: '2026-03-01' });
    const z = book({ title: 'Zeta' });
    const m = book({ title: 'Mid' });
    const sorted = sortBooksForDisplay([a, z, b, m]);
    expect(sorted.map((x) => x.title)).toEqual(['B', 'A', 'Mid', 'Zeta']);
  });
});

describe('routine', () => {
  it('sessionVolume sums reps times weight', () => {
    const sets = [set({ reps: 10, weight: 60 }), set({ reps: 8, weight: 65 })];
    expect(sessionVolume(sets)).toBe(10 * 60 + 8 * 65);
  });

  it('sessionVolume treats missing reps or weight as zero', () => {
    expect(sessionVolume([set({ reps: null, weight: 60 }), set({ reps: 5, weight: null })])).toBe(0);
  });

  it('groups sets by exercise in first-seen order, sets sorted by number', () => {
    const sets = [
      set({ exerciseName: 'Squat', setNumber: 2 }),
      set({ exerciseName: 'Bench', setNumber: 1 }),
      set({ exerciseName: 'Squat', setNumber: 1 }),
    ];
    const groups = groupSetsByExercise(sets);
    expect(groups.map((g) => g.name)).toEqual(['Squat', 'Bench']);
    expect(groups[0].sets.map((s) => s.setNumber)).toEqual([1, 2]);
  });

  it('exerciseTargetLine renders sets x reps at weight', () => {
    expect(exerciseTargetLine({ targetSets: 3, targetReps: 10, targetWeight: 60, unit: 'kg' })).toBe('3 x 10 at 60 kg');
    expect(exerciseTargetLine({ targetSets: 5, targetReps: null, targetWeight: null, unit: null })).toBe('5 sets');
    expect(exerciseTargetLine({ targetSets: null, targetReps: null, targetWeight: null, unit: null })).toBe('');
  });
});

describe('formatValue', () => {
  it('drops trailing zeros but keeps real decimals', () => {
    expect(formatValue(84)).toBe('84');
    expect(formatValue(84.5)).toBe('84.5');
    expect(formatValue(84.0)).toBe('84');
    expect(formatValue(84.259)).toBe('84.26');
  });
});
