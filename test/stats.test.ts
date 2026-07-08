import { describe, it, expect } from 'vitest';
import { computeChallengeStats } from '@/lib/domain/stats';
import type { Entry, Rule } from '@/lib/domain/schemas';

function rule(id: string, over: Partial<Rule> = {}): Rule {
  return {
    id,
    challengeId: 'c1',
    name: id,
    iconSlot: 'water',
    type: 'boolean',
    targetValue: null,
    unit: null,
    frequency: 'daily',
    frequencyCount: null,
    isRequired: true,
    sortOrder: 0,
    ...over,
  };
}
function entry(ruleId: string, date: string, completed = true): Entry {
  return {
    id: `${ruleId}-${date}`,
    userId: 'u1',
    ruleId,
    entryDate: date,
    completed,
    value: null,
    note: null,
    photoPath: null,
    createdAt: '2026-07-01T00:00:00Z',
  };
}

const rules = [rule('a'), rule('b')];

describe('computeChallengeStats', () => {
  it('counts elapsed days from start through today, clamped to the challenge end', () => {
    const s = computeChallengeStats({
      startDate: '2026-07-01',
      durationDays: 75,
      today: '2026-07-05',
      rules,
      entries: [],
    });
    expect(s.elapsedDays).toBe(5);
    expect(s.days).toHaveLength(5);
    expect(s.overallRate).toBe(0);
  });

  it('never counts past the last day even if today is later', () => {
    const s = computeChallengeStats({
      startDate: '2026-07-01',
      durationDays: 3,
      today: '2026-07-31',
      rules,
      entries: [],
    });
    expect(s.elapsedDays).toBe(3);
  });

  it('marks a day complete only when every required daily rule is sealed', () => {
    const entries = [
      entry('a', '2026-07-01'),
      entry('b', '2026-07-01'),
      entry('a', '2026-07-02'), // b missing -> day 2 incomplete
    ];
    const s = computeChallengeStats({
      startDate: '2026-07-01',
      durationDays: 75,
      today: '2026-07-02',
      rules,
      entries,
    });
    expect(s.days[0].complete).toBe(true);
    expect(s.days[1].complete).toBe(false);
    expect(s.overallRate).toBeCloseTo(3 / 4); // 3 sealed of 4 required rule-days
  });

  it('tracks current and longest streaks, broken by a missed day', () => {
    // days 1,2 complete; day 3 broken; days 4,5 complete
    const entries = [
      entry('a', '2026-07-01'), entry('b', '2026-07-01'),
      entry('a', '2026-07-02'), entry('b', '2026-07-02'),
      entry('a', '2026-07-04'), entry('b', '2026-07-04'),
      entry('a', '2026-07-05'), entry('b', '2026-07-05'),
    ];
    const s = computeChallengeStats({
      startDate: '2026-07-01',
      durationDays: 75,
      today: '2026-07-05',
      rules,
      entries,
    });
    expect(s.longestStreak).toBe(2);
    expect(s.currentStreak).toBe(2); // trailing days 4,5
  });

  it('computes per-rule adherence with n_per_week expectation', () => {
    const weekly = rule('w', { frequency: 'n_per_week', frequencyCount: 3, isRequired: false });
    const s = computeChallengeStats({
      startDate: '2026-07-01',
      durationDays: 75,
      today: '2026-07-07', // 7 elapsed days = 1 week -> expected 3
      rules: [weekly],
      entries: [entry('w', '2026-07-01'), entry('w', '2026-07-03')],
    });
    const w = s.perRule.find((r) => r.ruleId === 'w')!;
    expect(w.expected).toBe(3);
    expect(w.completed).toBe(2);
    expect(w.rate).toBeCloseTo(2 / 3);
  });

  it('returns zeroed stats before the challenge starts', () => {
    const s = computeChallengeStats({
      startDate: '2026-07-10',
      durationDays: 75,
      today: '2026-07-05',
      rules,
      entries: [],
    });
    expect(s.elapsedDays).toBe(0);
    expect(s.currentStreak).toBe(0);
    expect(s.longestStreak).toBe(0);
  });
});
