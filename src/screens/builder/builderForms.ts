import { z } from 'zod';
import {
  iconSlotEnum,
  ruleFrequencyEnum,
  ruleTypeEnum,
  newChallengeInput,
  newRuleInput,
  type IconSlot,
  type NewChallengeInput,
  type NewRuleInput,
  type Rule,
  type RuleFrequency,
  type RuleType,
} from '@/lib/domain/schemas';

/**
 * Builder form contract (Frontend-owned, local to the builder screens). These
 * validate the FORM before it is mapped to the shared domain inputs and handed to
 * the DAL. They compose the same enums the domain uses (`iconSlotEnum`, `ruleTypeEnum`,
 * `ruleFrequencyEnum`) so field choices can never drift from the schema, and the
 * mapper re-validates the mapped result with `newChallengeInput` / `newRuleInput`
 * (belt and suspenders) before any write.
 *
 * Numbers arrive from number inputs as `NaN` (when cleared) or numeric; the `numeric`
 * preprocessor normalises empty/NaN to `undefined` so conditional validation reads
 * cleanly.
 */

/** Duration quick-pick chips (PRD 4.1 #3). Any positive integer is also allowed. */
export const DURATION_PRESETS = [21, 30, 66, 75, 90] as const;

/** Builder never offers the reserved `freeze` strictness (unused in v1). */
export const builderStrictnessEnum = z.enum(['strict', 'standard']);
export type BuilderStrictness = z.infer<typeof builderStrictnessEnum>;

/** Rule types that carry a numeric target + unit. */
export function ruleNeedsTarget(type: RuleType): boolean {
  return type === 'quantity' || type === 'duration';
}

const numeric = (schema: z.ZodNumber) =>
  z.preprocess((v) => {
    if (v === '' || v === null || v === undefined) return undefined;
    if (typeof v === 'number' && Number.isNaN(v)) return undefined;
    return v;
  }, schema.optional());

/** Human labels for the enum option lists (no emoji; sentence case). */
export const RULE_TYPE_LABELS: Record<RuleType, string> = {
  boolean: 'Done or not done',
  quantity: 'A measured amount',
  duration: 'A length of time',
  photo: 'A progress photo',
};

export const RULE_FREQUENCY_LABELS: Record<RuleFrequency, string> = {
  daily: 'Every day',
  n_per_week: 'Several days a week',
};

export const ICON_SLOT_OPTIONS = iconSlotEnum.options as readonly IconSlot[];

export const builderRuleSchema = z
  .object({
    name: z.string().trim().min(1, 'Name this rule').max(120, 'Keep it under 120 characters'),
    iconSlot: iconSlotEnum,
    type: ruleTypeEnum,
    targetValue: numeric(z.number({ invalid_type_error: 'Enter a number' }).nonnegative('Zero or more')),
    unit: z.string().trim().max(24, 'Keep the unit short').optional(),
    frequency: ruleFrequencyEnum,
    frequencyCount: numeric(
      z.number({ invalid_type_error: 'Enter a count' }).int('Whole days only').positive('At least one'),
    ),
    isRequired: z.boolean(),
  })
  .superRefine((r, ctx) => {
    if (ruleNeedsTarget(r.type)) {
      if (r.targetValue === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['targetValue'], message: 'Set a target' });
      }
      if (!r.unit || r.unit.trim() === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['unit'], message: 'Add a unit' });
      }
    }
    if (r.frequency === 'n_per_week' && r.frequencyCount === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['frequencyCount'], message: 'How many days per week?' });
    }
  });

export const builderSchema = z.object({
  name: z.string().trim().min(1, 'Name your challenge').max(120, 'Keep it under 120 characters'),
  description: z.string().trim().max(2000, 'Keep it under 2000 characters').optional(),
  durationDays: numeric(
    z.number({ invalid_type_error: 'Enter a duration' }).int('Whole days only').positive('At least one day'),
  ),
  strictness: builderStrictnessEnum,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a start date'),
  rules: z.array(builderRuleSchema).min(1, 'Add at least one rule'),
});

/**
 * Form value shape used by react-hook-form. Numeric fields are typed loosely because
 * number inputs surface `number | null` (and transiently `NaN`); the schema above is
 * the authority on validity.
 */
export interface RuleFormValues {
  name: string;
  iconSlot: IconSlot;
  type: RuleType;
  targetValue: number | null;
  unit: string;
  frequency: RuleFrequency;
  frequencyCount: number | null;
  isRequired: boolean;
}

export interface BuilderFormValues {
  name: string;
  description: string;
  durationDays: number | null;
  strictness: BuilderStrictness;
  startDate: string;
  rules: RuleFormValues[];
}

/** A fresh, valid-by-default rule row (a required daily boolean check). */
export function emptyRule(): RuleFormValues {
  return {
    name: '',
    iconSlot: 'reading',
    type: 'boolean',
    targetValue: null,
    unit: '',
    frequency: 'daily',
    frequencyCount: null,
    isRequired: true,
  };
}

/** Default values for a brand-new challenge (a sensible 75-day standard blank). */
export function emptyBuilder(startDate: string): BuilderFormValues {
  return {
    name: '',
    description: '',
    durationDays: 75,
    strictness: 'standard',
    startDate,
    rules: [emptyRule()],
  };
}

/** Load an existing challenge + its rules into the form shape (edit mode). */
export function toFormValues(challenge: {
  name: string;
  description: string | null;
  durationDays: number;
  strictness: string;
  startDate: string;
}, rules: Rule[]): BuilderFormValues {
  const strictness: BuilderStrictness = challenge.strictness === 'strict' ? 'strict' : 'standard';
  return {
    name: challenge.name,
    description: challenge.description ?? '',
    durationDays: challenge.durationDays,
    strictness,
    startDate: challenge.startDate,
    rules: [...rules]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((r) => ({
        name: r.name,
        iconSlot: r.iconSlot,
        type: r.type,
        targetValue: r.targetValue,
        unit: r.unit ?? '',
        frequency: r.frequency,
        frequencyCount: r.frequencyCount,
        isRequired: r.isRequired,
      })),
  };
}

/**
 * Map validated form values to the shared domain inputs and re-validate with the
 * canonical schemas. Throws (via zod) if anything is off, so a bad payload can never
 * reach the DAL. `sortOrder` is derived from array position (the reorder result).
 */
export function toDomain(values: BuilderFormValues): {
  input: NewChallengeInput;
  rules: Omit<Rule, 'id' | 'challengeId'>[];
} {
  const parsed = builderSchema.parse(values);

  const input = newChallengeInput.parse({
    name: parsed.name,
    description: parsed.description && parsed.description.length > 0 ? parsed.description : null,
    durationDays: parsed.durationDays,
    startDate: parsed.startDate,
    strictness: parsed.strictness,
  });

  const rules: Omit<Rule, 'id' | 'challengeId'>[] = parsed.rules.map((r, index) => {
    const needsTarget = ruleNeedsTarget(r.type);
    const rule: NewRuleInput = newRuleInput.parse({
      name: r.name,
      iconSlot: r.iconSlot,
      type: r.type,
      targetValue: needsTarget ? r.targetValue ?? null : null,
      unit: needsTarget && r.unit ? r.unit : null,
      frequency: r.frequency,
      frequencyCount: r.frequency === 'n_per_week' ? r.frequencyCount ?? null : null,
      isRequired: r.isRequired,
      sortOrder: index,
    });
    return rule;
  });

  return { input, rules };
}
