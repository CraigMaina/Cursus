import { describe, it, expect } from 'vitest';
import {
  newChallengeInput,
  newRuleInput,
  upsertEntryInput,
  newViceInput,
  newRelapseInput,
} from '@/lib/domain/schemas';
import {
  validChallenge,
  validRule,
  validEntry,
  validVice,
  validRelapse,
} from './_fixtures';

const bad = <T extends object>(base: T, patch: Record<string, unknown>) =>
  ({ ...base, ...patch });

// --- newChallengeInput: omits id/userId/createdAt/isArchived/freezeTokens; freezeTokens optional ---
const validNewChallenge = {
  name: validChallenge.name,
  description: validChallenge.description,
  durationDays: validChallenge.durationDays,
  startDate: validChallenge.startDate,
  strictness: validChallenge.strictness,
};

describe('newChallengeInput', () => {
  it('accepts input without server-owned fields', () => {
    expect(newChallengeInput.safeParse(validNewChallenge).success).toBe(true);
  });
  it('accepts an optional freezeTokens', () => {
    expect(newChallengeInput.safeParse({ ...validNewChallenge, freezeTokens: 2 }).success).toBe(true);
  });
  it('does not require id/userId/createdAt (they are server-owned)', () => {
    const res = newChallengeInput.safeParse(validNewChallenge);
    expect(res.success).toBe(true);
    if (res.success) {
      expect('id' in res.data).toBe(false);
      expect('userId' in res.data).toBe(false);
    }
  });
  it.each([
    ['empty name', bad(validNewChallenge, { name: '' })],
    ['zero durationDays', bad(validNewChallenge, { durationDays: 0 })],
    ['bad startDate', bad(validNewChallenge, { startDate: '07-07-2026' })],
    ['out-of-enum strictness', bad(validNewChallenge, { strictness: 'nope' })],
    ['negative freezeTokens', bad(validNewChallenge, { freezeTokens: -1 })],
  ])('rejects %s', (_l, obj) => {
    expect(newChallengeInput.safeParse(obj).success).toBe(false);
  });
});

// --- newRuleInput: ruleSchema without id/challengeId ---
const validNewRule = {
  name: validRule.name,
  iconSlot: validRule.iconSlot,
  type: validRule.type,
  targetValue: validRule.targetValue,
  unit: validRule.unit,
  frequency: validRule.frequency,
  frequencyCount: validRule.frequencyCount,
  isRequired: validRule.isRequired,
  sortOrder: validRule.sortOrder,
};

describe('newRuleInput', () => {
  it('accepts a rule blueprint without id/challengeId', () => {
    expect(newRuleInput.safeParse(validNewRule).success).toBe(true);
  });
  it.each([
    ['out-of-enum iconSlot', bad(validNewRule, { iconSlot: 'emoji' })],
    ['out-of-enum type', bad(validNewRule, { type: 'counter' })],
    ['negative targetValue', bad(validNewRule, { targetValue: -3 })],
    ['out-of-enum frequency', bad(validNewRule, { frequency: 'monthly' })],
    ['missing isRequired', (() => { const c: Record<string, unknown> = { ...validNewRule }; delete c.isRequired; return c; })()],
  ])('rejects %s', (_l, obj) => {
    expect(newRuleInput.safeParse(obj).success).toBe(false);
  });
});

// --- upsertEntryInput: entrySchema without id/userId/createdAt; keyed by (ruleId, entryDate) ---
const validUpsertEntry = {
  ruleId: validEntry.ruleId,
  entryDate: validEntry.entryDate,
  completed: validEntry.completed,
  value: validEntry.value,
  note: validEntry.note,
  photoPath: validEntry.photoPath,
};

describe('upsertEntryInput', () => {
  it('accepts an upsert payload keyed by ruleId + entryDate', () => {
    expect(upsertEntryInput.safeParse(validUpsertEntry).success).toBe(true);
  });
  it.each([
    ['bad uuid ruleId', bad(validUpsertEntry, { ruleId: 'x' })],
    ['bad entryDate', bad(validUpsertEntry, { entryDate: 'today' })],
    ['non-boolean completed', bad(validUpsertEntry, { completed: 1 })],
    ['non-number value', bad(validUpsertEntry, { value: 'x' })],
  ])('rejects %s', (_l, obj) => {
    expect(upsertEntryInput.safeParse(obj).success).toBe(false);
  });
});

// --- newViceInput: viceSchema without id/userId/isArchived ---
const validNewVice = {
  name: validVice.name,
  quitDate: validVice.quitDate,
  reason: validVice.reason,
  triggers: validVice.triggers,
  costPerUnit: validVice.costPerUnit,
  timePerUnitMinutes: validVice.timePerUnitMinutes,
  unitLabel: validVice.unitLabel,
};

describe('newViceInput', () => {
  it('accepts a new-vice payload without server-owned fields', () => {
    expect(newViceInput.safeParse(validNewVice).success).toBe(true);
  });
  it.each([
    ['empty name', bad(validNewVice, { name: '' })],
    ['bad quitDate', bad(validNewVice, { quitDate: '07/07/2026' })],
    ['negative costPerUnit', bad(validNewVice, { costPerUnit: -1 })],
    ['negative timePerUnitMinutes', bad(validNewVice, { timePerUnitMinutes: -5 })],
  ])('rejects %s', (_l, obj) => {
    expect(newViceInput.safeParse(obj).success).toBe(false);
  });
});

// --- newRelapseInput: relapseSchema without id ---
const validNewRelapse = {
  viceId: validRelapse.viceId,
  relapseDate: validRelapse.relapseDate,
  note: validRelapse.note,
};

describe('newRelapseInput', () => {
  it('accepts a new-relapse payload without id', () => {
    expect(newRelapseInput.safeParse(validNewRelapse).success).toBe(true);
  });
  it.each([
    ['bad uuid viceId', bad(validNewRelapse, { viceId: 'x' })],
    ['bad relapseDate', bad(validNewRelapse, { relapseDate: 'today' })],
    ['note over 2000', bad(validNewRelapse, { note: 'x'.repeat(2001) })],
  ])('rejects %s', (_l, obj) => {
    expect(newRelapseInput.safeParse(obj).success).toBe(false);
  });
});
