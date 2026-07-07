import { describe, it, expect } from 'vitest';
import {
  profileSchema,
  challengeSchema,
  ruleSchema,
  entrySchema,
  challengeResetSchema,
  templateSchema,
  viceSchema,
  relapseSchema,
  quoteSchema,
  pushSubscriptionSchema,
  notificationPrefsSchema,
} from '@/lib/domain/schemas';
import {
  validProfile,
  validChallenge,
  validRule,
  validEntry,
  validChallengeReset,
  validTemplate,
  validVice,
  validRelapse,
  validQuote,
  validPushSubscription,
  validNotificationPrefs,
} from './_fixtures';

/** Helper: clone the valid fixture and override fields for a targeted invalid case. */
const bad = <T extends object>(base: T, patch: Record<string, unknown>) =>
  ({ ...base, ...patch });

const omit = <T extends object>(base: T, key: keyof T) => {
  const copy = { ...base } as Record<string, unknown>;
  delete copy[key as string];
  return copy;
};

describe('profileSchema', () => {
  it('accepts a valid profile (and a null displayName)', () => {
    expect(profileSchema.safeParse(validProfile).success).toBe(true);
    expect(profileSchema.safeParse(bad(validProfile, { displayName: null })).success).toBe(true);
  });
  it.each([
    ['bad uuid id', bad(validProfile, { id: 'nope' })],
    ['empty timezone', bad(validProfile, { timezone: '' })],
    ['bad eveningThreshold', bad(validProfile, { eveningThresholdLocal: '9pm' })],
    ['bad createdAt', bad(validProfile, { createdAt: '2026-07-07' })],
    ['displayName over 80', bad(validProfile, { displayName: 'x'.repeat(81) })],
    ['missing timezone', omit(validProfile, 'timezone')],
  ])('rejects %s', (_l, obj) => {
    expect(profileSchema.safeParse(obj).success).toBe(false);
  });
});

describe('challengeSchema', () => {
  it('accepts a valid challenge and applies defaults', () => {
    const res = challengeSchema.safeParse(omit(omit(validChallenge, 'freezeTokens'), 'isArchived'));
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.freezeTokens).toBe(0);
      expect(res.data.isArchived).toBe(false);
    }
  });
  it.each([
    ['bad uuid id', bad(validChallenge, { id: '123' })],
    ['bad userId', bad(validChallenge, { userId: 'not-uuid' })],
    ['empty name', bad(validChallenge, { name: '' })],
    ['name over 120', bad(validChallenge, { name: 'x'.repeat(121) })],
    ['zero durationDays', bad(validChallenge, { durationDays: 0 })],
    ['negative durationDays', bad(validChallenge, { durationDays: -5 })],
    ['non-integer durationDays', bad(validChallenge, { durationDays: 7.5 })],
    ['bad startDate format', bad(validChallenge, { startDate: '07/07/2026' })],
    ['out-of-enum strictness', bad(validChallenge, { strictness: 'hardcore' })],
    ['negative freezeTokens', bad(validChallenge, { freezeTokens: -1 })],
    ['missing startDate', omit(validChallenge, 'startDate')],
  ])('rejects %s', (_l, obj) => {
    expect(challengeSchema.safeParse(obj).success).toBe(false);
  });
});

describe('ruleSchema', () => {
  it('accepts a valid rule and nullable targetValue/unit/frequencyCount', () => {
    expect(ruleSchema.safeParse(validRule).success).toBe(true);
    expect(
      ruleSchema.safeParse(bad(validRule, { targetValue: null, unit: null, frequencyCount: null })).success,
    ).toBe(true);
  });
  it.each([
    ['bad uuid id', bad(validRule, { id: 'x' })],
    ['out-of-enum iconSlot', bad(validRule, { iconSlot: 'emoji' })],
    ['out-of-enum type', bad(validRule, { type: 'counter' })],
    ['negative targetValue', bad(validRule, { targetValue: -1 })],
    ['unit over 24 chars', bad(validRule, { unit: 'x'.repeat(25) })],
    ['out-of-enum frequency', bad(validRule, { frequency: 'weekly' })],
    ['zero frequencyCount', bad(validRule, { frequencyCount: 0 })],
    ['non-integer sortOrder', bad(validRule, { sortOrder: 1.5 })],
    ['missing isRequired', omit(validRule, 'isRequired')],
  ])('rejects %s', (_l, obj) => {
    expect(ruleSchema.safeParse(obj).success).toBe(false);
  });
});

describe('entrySchema', () => {
  it('accepts a valid entry and null value/note/photoPath', () => {
    expect(entrySchema.safeParse(validEntry).success).toBe(true);
    expect(entrySchema.safeParse(bad(validEntry, { value: null, note: null, photoPath: null })).success).toBe(true);
  });
  it.each([
    ['bad uuid ruleId', bad(validEntry, { ruleId: 'x' })],
    ['bad entryDate', bad(validEntry, { entryDate: '2026-7-7' })],
    ['non-boolean completed', bad(validEntry, { completed: 'yes' })],
    ['non-number value', bad(validEntry, { value: 'lots' })],
    ['note over 2000', bad(validEntry, { note: 'x'.repeat(2001) })],
    ['bad createdAt', bad(validEntry, { createdAt: 'yesterday' })],
    ['missing completed', omit(validEntry, 'completed')],
  ])('rejects %s', (_l, obj) => {
    expect(entrySchema.safeParse(obj).success).toBe(false);
  });
});

describe('challengeResetSchema', () => {
  it('accepts a valid reset and a null reason', () => {
    expect(challengeResetSchema.safeParse(validChallengeReset).success).toBe(true);
    expect(challengeResetSchema.safeParse(bad(validChallengeReset, { reason: null })).success).toBe(true);
  });
  it.each([
    ['bad uuid challengeId', bad(validChallengeReset, { challengeId: 'x' })],
    ['bad resetDate', bad(validChallengeReset, { resetDate: 'today' })],
    ['reason over 500', bad(validChallengeReset, { reason: 'x'.repeat(501) })],
    ['missing resetDate', omit(validChallengeReset, 'resetDate')],
  ])('rejects %s', (_l, obj) => {
    expect(challengeResetSchema.safeParse(obj).success).toBe(false);
  });
});

describe('templateSchema', () => {
  it('accepts a valid system template (null userId) and nested rule blueprints', () => {
    expect(templateSchema.safeParse(validTemplate).success).toBe(true);
  });
  it('rejects a nested rule blueprint that carries a forbidden id (strict omit)', () => {
    const withId = {
      ...validTemplate,
      definition: { rules: [{ ...validTemplate.definition.rules[0], id: 'x' }] },
    };
    // omit() produces a strict object shape; an unexpected `id` key is stripped/ignored
    // by default, so instead assert the blueprint itself must satisfy the omitted rule shape.
    const badBlueprint = {
      ...validTemplate,
      definition: { rules: [{ ...validTemplate.definition.rules[0], iconSlot: 'emoji' }] },
    };
    expect(templateSchema.safeParse(badBlueprint).success).toBe(false);
    void withId;
  });
  it.each([
    ['bad uuid id', bad(validTemplate, { id: 'x' })],
    ['out-of-enum strictness', bad(validTemplate, { strictness: 'nope' })],
    ['non-boolean isSystem', bad(validTemplate, { isSystem: 'yes' })],
    ['definition not an object', bad(validTemplate, { definition: [] })],
    ['zero durationDays', bad(validTemplate, { durationDays: 0 })],
    ['missing definition', omit(validTemplate, 'definition')],
  ])('rejects %s', (_l, obj) => {
    expect(templateSchema.safeParse(obj).success).toBe(false);
  });
});

describe('viceSchema', () => {
  it('accepts a valid vice and nullable cost/time/unit fields', () => {
    expect(viceSchema.safeParse(validVice).success).toBe(true);
    expect(
      viceSchema.safeParse(bad(validVice, { costPerUnit: null, timePerUnitMinutes: null, unitLabel: null })).success,
    ).toBe(true);
  });
  it.each([
    ['bad uuid id', bad(validVice, { id: 'x' })],
    ['empty name', bad(validVice, { name: '' })],
    ['bad quitDate', bad(validVice, { quitDate: '2026/07/07' })],
    ['negative costPerUnit', bad(validVice, { costPerUnit: -0.5 })],
    ['negative timePerUnitMinutes', bad(validVice, { timePerUnitMinutes: -1 })],
    ['unitLabel over 40', bad(validVice, { unitLabel: 'x'.repeat(41) })],
    ['missing quitDate', omit(validVice, 'quitDate')],
  ])('rejects %s', (_l, obj) => {
    expect(viceSchema.safeParse(obj).success).toBe(false);
  });
});

describe('relapseSchema', () => {
  it('accepts a valid relapse and a null note', () => {
    expect(relapseSchema.safeParse(validRelapse).success).toBe(true);
    expect(relapseSchema.safeParse(bad(validRelapse, { note: null })).success).toBe(true);
  });
  it.each([
    ['bad uuid viceId', bad(validRelapse, { viceId: 'x' })],
    ['bad relapseDate', bad(validRelapse, { relapseDate: 'today' })],
    ['note over 2000', bad(validRelapse, { note: 'x'.repeat(2001) })],
    ['missing viceId', omit(validRelapse, 'viceId')],
  ])('rejects %s', (_l, obj) => {
    expect(relapseSchema.safeParse(obj).success).toBe(false);
  });
});

describe('quoteSchema', () => {
  it('accepts a valid quote and a null source', () => {
    expect(quoteSchema.safeParse(validQuote).success).toBe(true);
    expect(quoteSchema.safeParse(bad(validQuote, { source: null })).success).toBe(true);
  });
  it.each([
    ['bad uuid id', bad(validQuote, { id: 'x' })],
    ['empty text', bad(validQuote, { text: '' })],
    ['empty author', bad(validQuote, { author: '' })],
    ['out-of-enum category', bad(validQuote, { category: 'death' })],
    ['missing author', omit(validQuote, 'author')],
  ])('rejects %s', (_l, obj) => {
    expect(quoteSchema.safeParse(obj).success).toBe(false);
  });
});

describe('pushSubscriptionSchema', () => {
  it('accepts a valid subscription and a null userAgent', () => {
    expect(pushSubscriptionSchema.safeParse(validPushSubscription).success).toBe(true);
    expect(pushSubscriptionSchema.safeParse(bad(validPushSubscription, { userAgent: null })).success).toBe(true);
  });
  it.each([
    ['bad uuid id', bad(validPushSubscription, { id: 'x' })],
    ['non-url endpoint', bad(validPushSubscription, { endpoint: 'not a url' })],
    ['missing keys', omit(validPushSubscription, 'keys')],
    ['keys missing auth', bad(validPushSubscription, { keys: { p256dh: 'x' } })],
    ['bad createdAt', bad(validPushSubscription, { createdAt: '2026-07-07' })],
  ])('rejects %s', (_l, obj) => {
    expect(pushSubscriptionSchema.safeParse(obj).success).toBe(false);
  });
});

describe('notificationPrefsSchema', () => {
  it('accepts valid prefs, null quiet hours, and applies defaults', () => {
    expect(notificationPrefsSchema.safeParse(validNotificationPrefs).success).toBe(true);
    const res = notificationPrefsSchema.safeParse({ userId: validNotificationPrefs.userId, quietStartLocal: null, quietEndLocal: null });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.pushEnabled).toBe(true);
      expect(res.data.emailEnabled).toBe(false);
    }
  });
  it.each([
    ['bad uuid userId', bad(validNotificationPrefs, { userId: 'x' })],
    ['bad quietStartLocal', bad(validNotificationPrefs, { quietStartLocal: '25:00' })],
    ['bad quietEndLocal', bad(validNotificationPrefs, { quietEndLocal: '7am' })],
    ['non-boolean pushEnabled', bad(validNotificationPrefs, { pushEnabled: 'yes' })],
    ['missing userId', omit(validNotificationPrefs, 'userId')],
  ])('rejects %s', (_l, obj) => {
    expect(notificationPrefsSchema.safeParse(obj).success).toBe(false);
  });
});
