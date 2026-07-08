import { describe, it, expect } from 'vitest';
import {
  daysBetween,
  daysClean,
  computeSavings,
  splitMinutes,
  reachedMilestones,
  isMilestone,
  latestMilestone,
} from '@/lib/domain/compute';

describe('daysBetween', () => {
  it('counts whole days forward', () => {
    expect(daysBetween('2026-07-01', '2026-07-08')).toBe(7);
  });
  it('is negative when to precedes from', () => {
    expect(daysBetween('2026-07-08', '2026-07-01')).toBe(-7);
  });
  it('crosses months and years', () => {
    expect(daysBetween('2025-12-31', '2026-01-01')).toBe(1);
  });
});

describe('daysClean', () => {
  it('counts from the quit date when there is no relapse', () => {
    expect(daysClean('2026-07-01', null, '2026-07-08')).toBe(7);
  });
  it('counts from the most recent relapse after the quit date', () => {
    expect(daysClean('2026-07-01', '2026-07-05', '2026-07-08')).toBe(3);
  });
  it('ignores a relapse dated before the quit date', () => {
    expect(daysClean('2026-07-01', '2026-06-20', '2026-07-08')).toBe(7);
  });
  it('clamps a future quit date to 0', () => {
    expect(daysClean('2026-08-01', null, '2026-07-08')).toBe(0);
  });
});

describe('computeSavings', () => {
  const vice = { dailyUnits: 10, costPerUnit: 0.5, timePerUnitMinutes: 6 };
  it('multiplies days * dailyUnits * rate for both dimensions', () => {
    expect(computeSavings(vice, 10)).toEqual({ money: 50, minutes: 600 });
  });
  it('returns null money when cost is unknown, keeps time', () => {
    expect(computeSavings({ dailyUnits: 10, costPerUnit: null, timePerUnitMinutes: 6 }, 10)).toEqual({
      money: null,
      minutes: 600,
    });
  });
  it('returns null for both when dailyUnits is unknown', () => {
    expect(computeSavings({ dailyUnits: null, costPerUnit: 0.5, timePerUnitMinutes: 6 }, 10)).toEqual({
      money: null,
      minutes: null,
    });
  });
});

describe('splitMinutes', () => {
  it('splits into days/hours/minutes', () => {
    expect(splitMinutes(1500)).toEqual({ days: 1, hours: 1, minutes: 0 });
  });
  it('clamps negatives to zero', () => {
    expect(splitMinutes(-5)).toEqual({ days: 0, hours: 0, minutes: 0 });
  });
});

describe('milestones', () => {
  it('reachedMilestones returns thresholds at or below the count', () => {
    expect(reachedMilestones(30)).toEqual([7, 21, 30]);
  });
  it('isMilestone is true only on exact thresholds', () => {
    expect(isMilestone(21)).toBe(true);
    expect(isMilestone(22)).toBe(false);
  });
  it('latestMilestone returns the highest reached, or null', () => {
    expect(latestMilestone(75)).toBe(75);
    expect(latestMilestone(3)).toBeNull();
  });
});
