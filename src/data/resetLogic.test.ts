/**
 * Unit tests for the pure Strict-reset mirror (src/data/resetLogic.ts). These prove the
 * day-walk in isolation; the AUTHORITATIVE server routine is proven separately by
 * supabase/tests/reset.mjs against the live DB.
 */
import { describe, it, expect } from 'vitest';
import {
  addDays,
  computeStrictResets,
  effectiveStartDate,
  type ResetEvaluationInput,
} from './resetLogic';

/** Build a completedKeys set from [ruleId, date] pairs. */
function completed(pairs: Array<[string, string]>): Set<string> {
  return new Set(pairs.map(([r, d]) => `${r}|${d}`));
}

const RULE = 'rule-1';

function base(overrides: Partial<ResetEvaluationInput> = {}): ResetEvaluationInput {
  return {
    strictness: 'strict',
    startDate: '2026-01-01',
    durationDays: 30,
    requiredDailyRuleIds: [RULE],
    completedKeys: new Set<string>(),
    horizonDate: '2026-01-05',
    ...overrides,
  };
}

describe('computeStrictResets', () => {
  it('produces one reset on a single missed day and rewinds effective start', () => {
    // days 01,02 done; 03 missed; 04,05 done
    const keys = completed([
      [RULE, '2026-01-01'],
      [RULE, '2026-01-02'],
      [RULE, '2026-01-04'],
      [RULE, '2026-01-05'],
    ]);
    const resets = computeStrictResets(base({ completedKeys: keys }));
    expect(resets).toEqual(['2026-01-03']);
    expect(effectiveStartDate('2026-01-01', resets)).toBe('2026-01-04');
  });

  it('never resets a Standard challenge even with misses', () => {
    const resets = computeStrictResets(
      base({ strictness: 'standard', completedKeys: new Set() }),
    );
    expect(resets).toEqual([]);
  });

  it('never resets a reserved-freeze challenge', () => {
    const resets = computeStrictResets(base({ strictness: 'freeze' }));
    expect(resets).toEqual([]);
  });

  it('records multiple resets across successive misses', () => {
    // 01 missed -> reset, restart 02; 02 done; 03 missed -> reset, restart 04; 04,05 done
    const keys = completed([
      [RULE, '2026-01-02'],
      [RULE, '2026-01-04'],
      [RULE, '2026-01-05'],
    ]);
    const resets = computeStrictResets(base({ completedKeys: keys }));
    expect(resets).toEqual(['2026-01-01', '2026-01-03']);
    expect(effectiveStartDate('2026-01-01', resets)).toBe('2026-01-04');
  });

  it('does not evaluate days beyond the horizon (open days cannot miss)', () => {
    // nothing completed, but horizon only reaches 01-02
    const resets = computeStrictResets(
      base({ completedKeys: new Set(), horizonDate: '2026-01-02' }),
    );
    expect(resets).toEqual(['2026-01-01', '2026-01-02']);
  });

  it('never resets when there are no required daily rules', () => {
    const resets = computeStrictResets(
      base({ requiredDailyRuleIds: [], completedKeys: new Set() }),
    );
    expect(resets).toEqual([]);
  });

  it('is idempotent: recomputing yields the identical reset set', () => {
    const keys = completed([
      [RULE, '2026-01-01'],
      [RULE, '2026-01-02'],
      [RULE, '2026-01-04'],
      [RULE, '2026-01-05'],
    ]);
    const a = computeStrictResets(base({ completedKeys: keys }));
    const b = computeStrictResets(base({ completedKeys: keys }));
    expect(a).toEqual(b);
    expect(a).toEqual(['2026-01-03']);
  });

  it('stops evaluating once the run has completed cleanly', () => {
    // 2-day challenge, both days done; a later "miss" is past completion and ignored
    const keys = completed([
      [RULE, '2026-01-01'],
      [RULE, '2026-01-02'],
    ]);
    const resets = computeStrictResets(
      base({ durationDays: 2, completedKeys: keys, horizonDate: '2026-01-10' }),
    );
    expect(resets).toEqual([]);
  });

  it('treats a day with only an incomplete entry as a miss', () => {
    // completedKeys omits 01-03 (entry exists but completed=false, or no entry at all)
    const keys = completed([
      [RULE, '2026-01-01'],
      [RULE, '2026-01-02'],
      [RULE, '2026-01-04'],
      [RULE, '2026-01-05'],
    ]);
    const resets = computeStrictResets(base({ completedKeys: keys }));
    expect(resets).toContain('2026-01-03');
  });
});

describe('effectiveStartDate', () => {
  it('returns the original start when never reset', () => {
    expect(effectiveStartDate('2026-01-01', [])).toBe('2026-01-01');
  });

  it('returns the day after the most recent reset', () => {
    expect(effectiveStartDate('2026-01-01', ['2026-01-03', '2026-01-07'])).toBe(
      '2026-01-08',
    );
  });
});

describe('addDays', () => {
  it('crosses month boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});
