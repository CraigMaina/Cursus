import { describe, it, expect } from 'vitest';
import {
  strictnessEnum,
  ruleTypeEnum,
  ruleFrequencyEnum,
  quoteCategoryEnum,
  iconSlotEnum,
} from '@/lib/domain/schemas';

describe('strictnessEnum', () => {
  it.each(['strict', 'standard', 'freeze'])('accepts %s', (v) => {
    expect(strictnessEnum.safeParse(v).success).toBe(true);
  });
  it.each(['Strict', 'lenient', '', 'STANDARD', null, 1])(
    'rejects %s',
    (v) => {
      expect(strictnessEnum.safeParse(v).success).toBe(false);
    },
  );
});

describe('ruleTypeEnum', () => {
  it.each(['boolean', 'quantity', 'duration', 'photo'])('accepts %s', (v) => {
    expect(ruleTypeEnum.safeParse(v).success).toBe(true);
  });
  it.each(['bool', 'count', 'image', ''])('rejects %s', (v) => {
    expect(ruleTypeEnum.safeParse(v).success).toBe(false);
  });
});

describe('ruleFrequencyEnum', () => {
  it.each(['daily', 'n_per_week'])('accepts %s', (v) => {
    expect(ruleFrequencyEnum.safeParse(v).success).toBe(true);
  });
  it.each(['weekly', 'per_week', 'monthly', ''])('rejects %s', (v) => {
    expect(ruleFrequencyEnum.safeParse(v).success).toBe(false);
  });
});

describe('quoteCategoryEnum', () => {
  it.each(['daily', 'milestone', 'reset'])('accepts %s', (v) => {
    expect(quoteCategoryEnum.safeParse(v).success).toBe(true);
  });
  it.each(['death', 'streak', 'motivation', ''])('rejects %s', (v) => {
    expect(quoteCategoryEnum.safeParse(v).success).toBe(false);
  });
});

describe('iconSlotEnum', () => {
  const valid = [
    'water', 'indoor_workout', 'outdoor_workout', 'reading', 'diet', 'photo',
    'streak', 'milestone', 'vice', 'days_clean', 'relapse', 'reminder',
    'calendar', 'settings', 'savings', 'add',
  ];
  it('has exactly the 16 PRD-8 slots', () => {
    expect(iconSlotEnum.options).toHaveLength(16);
    expect([...iconSlotEnum.options].sort()).toEqual([...valid].sort());
  });
  it.each(valid)('accepts slot %s', (v) => {
    expect(iconSlotEnum.safeParse(v).success).toBe(true);
  });
  it.each(['emoji', 'dumbbell', 'workout', 'fire', ''])('rejects %s', (v) => {
    expect(iconSlotEnum.safeParse(v).success).toBe(false);
  });
});
