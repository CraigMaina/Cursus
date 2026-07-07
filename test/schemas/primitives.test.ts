import { describe, it, expect } from 'vitest';
import { isoDate, isoDateTime, localTime } from '@/lib/domain/schemas';

describe('isoDate (YYYY-MM-DD)', () => {
  it('accepts a well-formed calendar date', () => {
    expect(isoDate.safeParse('2026-07-07').success).toBe(true);
  });

  it.each([
    ['single-digit month', '2026-7-07'],
    ['single-digit day', '2026-07-7'],
    ['slash separators', '2026/07/07'],
    ['no separators', '20260707'],
    ['datetime, not date', '2026-07-07T00:00:00Z'],
    ['prose', 'July 7, 2026'],
    ['empty', ''],
    ['two-digit year', '26-07-07'],
  ])('rejects %s', (_label, value) => {
    expect(isoDate.safeParse(value).success).toBe(false);
  });

  it('is regex-only and does NOT validate real calendar ranges (documented limitation)', () => {
    // 2026-13-45 is not a real date but matches \d{4}-\d{2}-\d{2}. This is a known
    // gap: range validation must happen at the DB / data-access layer, not here.
    expect(isoDate.safeParse('2026-13-45').success).toBe(true);
  });
});

describe('isoDateTime (ISO 8601 with offset)', () => {
  it.each([
    ['UTC Z', '2026-07-07T09:30:00.000Z'],
    ['zero fractional Z', '2026-07-07T09:30:00Z'],
    ['explicit offset', '2026-07-07T12:30:00+03:00'],
  ])('accepts %s', (_label, value) => {
    expect(isoDateTime.safeParse(value).success).toBe(true);
  });

  it.each([
    ['no timezone offset', '2026-07-07T09:30:00'],
    ['date only', '2026-07-07'],
    ['space instead of T', '2026-07-07 09:30:00Z'],
    ['garbage', 'not-a-timestamp'],
    ['empty', ''],
  ])('rejects %s', (_label, value) => {
    expect(isoDateTime.safeParse(value).success).toBe(false);
  });
});

describe('localTime (HH:MM 24h)', () => {
  it.each([
    ['midnight', '00:00'],
    ['evening threshold', '21:00'],
    ['last minute', '23:59'],
  ])('accepts %s', (_label, value) => {
    expect(localTime.safeParse(value).success).toBe(true);
  });

  it.each([
    ['hour out of range', '24:00'],
    ['minute out of range', '12:60'],
    ['unpadded hour', '9:00'],
    ['seconds included', '21:00:00'],
    ['am/pm', '9:00pm'],
    ['empty', ''],
  ])('rejects %s', (_label, value) => {
    expect(localTime.safeParse(value).success).toBe(false);
  });
});
