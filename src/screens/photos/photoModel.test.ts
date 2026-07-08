import { describe, it, expect } from 'vitest';
import {
  addDays,
  buildPhotoDays,
  fitDimensions,
  validatePhotoFile,
  PhotoValidationError,
} from './photoModel';

describe('addDays', () => {
  it('adds and subtracts days across month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-07-07', 0)).toBe('2026-07-07');
  });
});

describe('buildPhotoDays', () => {
  it('lists start..today inclusive, newest first, 1-based day numbers', () => {
    const days = buildPhotoDays('2026-07-01', 75, '2026-07-04');
    expect(days.map((d) => d.date)).toEqual([
      '2026-07-04',
      '2026-07-03',
      '2026-07-02',
      '2026-07-01',
    ]);
    expect(days[0]).toEqual({ date: '2026-07-04', dayNumber: 4 });
    expect(days[3]).toEqual({ date: '2026-07-01', dayNumber: 1 });
  });

  it('caps at the final challenge day when today is past the end', () => {
    const days = buildPhotoDays('2026-07-01', 3, '2026-07-30');
    expect(days.map((d) => d.date)).toEqual(['2026-07-03', '2026-07-02', '2026-07-01']);
    expect(days).toHaveLength(3);
  });

  it('returns an empty timeline before the challenge starts', () => {
    expect(buildPhotoDays('2026-07-10', 30, '2026-07-07')).toEqual([]);
  });

  it('returns a single day on the start date', () => {
    expect(buildPhotoDays('2026-07-07', 30, '2026-07-07')).toEqual([
      { date: '2026-07-07', dayNumber: 1 },
    ]);
  });
});

describe('fitDimensions', () => {
  it('scales the longest edge down to the bound, preserving aspect ratio', () => {
    expect(fitDimensions(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitDimensions(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 });
  });

  it('never upscales a smaller image', () => {
    expect(fitDimensions(800, 600, 1600)).toEqual({ width: 800, height: 600 });
    expect(fitDimensions(1600, 900, 1600)).toEqual({ width: 1600, height: 900 });
  });

  it('handles a zero-size source without dividing by zero', () => {
    expect(fitDimensions(0, 0, 1600)).toEqual({ width: 0, height: 0 });
  });
});

describe('validatePhotoFile', () => {
  const asFile = (type: string, size: number): File =>
    ({ type, size } as File);

  it('accepts a reasonable image', () => {
    expect(() => validatePhotoFile(asFile('image/jpeg', 2_000_000))).not.toThrow();
  });

  it('rejects a non-image', () => {
    expect(() => validatePhotoFile(asFile('application/pdf', 1000))).toThrow(
      PhotoValidationError,
    );
  });

  it('rejects an oversized image', () => {
    expect(() => validatePhotoFile(asFile('image/png', 30 * 1024 * 1024))).toThrow(
      PhotoValidationError,
    );
  });
});
