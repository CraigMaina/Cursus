import { z } from 'zod';
import { newViceInput, type NewViceInput, type Vice } from '@/lib/domain/schemas';

/**
 * Vice form contract (Frontend-owned, local to the vices screens). Validates the FORM
 * before it is mapped to the shared `newViceInput` domain shape and handed to the DAL.
 * The mapper re-validates the mapped result with `newViceInput` (belt and suspenders)
 * so a bad payload can never reach Supabase.
 *
 * Numbers arrive from number inputs as `NaN` (when cleared) or numeric; the `numeric`
 * preprocessor normalises empty/NaN to `undefined`, and the mapper turns those (and
 * empty strings) into the schema's `null`.
 */

const numeric = (schema: z.ZodNumber) =>
  z.preprocess((v) => {
    if (v === '' || v === null || v === undefined) return undefined;
    if (typeof v === 'number' && Number.isNaN(v)) return undefined;
    return v;
  }, schema.optional());

export const viceFormSchema = z.object({
  name: z.string().trim().min(1, 'Name the vice').max(120, 'Keep it under 120 characters'),
  quitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a quit date'),
  reason: z.string().trim().max(2000, 'Keep it under 2000 characters').optional(),
  triggers: z.string().trim().max(2000, 'Keep it under 2000 characters').optional(),
  unitLabel: z.string().trim().max(40, 'Keep the unit short').optional(),
  costPerUnit: numeric(
    z.number({ invalid_type_error: 'Enter a number' }).nonnegative('Zero or more'),
  ),
  timePerUnitMinutes: numeric(
    z.number({ invalid_type_error: 'Enter minutes' }).nonnegative('Zero or more'),
  ),
  dailyUnits: numeric(
    z.number({ invalid_type_error: 'Enter a number' }).nonnegative('Zero or more'),
  ),
});

/**
 * Form value shape used by react-hook-form. Numeric fields are typed loosely because
 * number inputs surface `number | null` (and transiently `NaN`); the schema above is
 * the authority on validity.
 */
export interface ViceFormValues {
  name: string;
  quitDate: string;
  reason: string;
  triggers: string;
  unitLabel: string;
  costPerUnit: number | null;
  timePerUnitMinutes: number | null;
  dailyUnits: number | null;
}

/** A blank vice, quit as of `quitDate` (defaults to today at the call site). */
export function emptyVice(quitDate: string): ViceFormValues {
  return {
    name: '',
    quitDate,
    reason: '',
    triggers: '',
    unitLabel: '',
    costPerUnit: null,
    timePerUnitMinutes: null,
    dailyUnits: null,
  };
}

/** Load an existing vice into the form shape (edit mode). */
export function toFormValues(v: Vice): ViceFormValues {
  return {
    name: v.name,
    quitDate: v.quitDate,
    reason: v.reason ?? '',
    triggers: v.triggers ?? '',
    unitLabel: v.unitLabel ?? '',
    costPerUnit: v.costPerUnit,
    timePerUnitMinutes: v.timePerUnitMinutes,
    dailyUnits: v.dailyUnits,
  };
}

function orNull(s: string): string | null {
  const t = s.trim();
  return t.length > 0 ? t : null;
}

function numOrNull(n: number | null): number | null {
  return n != null && !Number.isNaN(n) ? n : null;
}

/**
 * Map validated form values to `newViceInput` and re-validate with the canonical
 * schema. Throws (via zod) if anything is off.
 */
export function toDomain(values: ViceFormValues): NewViceInput {
  const parsed = viceFormSchema.parse(values);
  return newViceInput.parse({
    name: parsed.name,
    quitDate: parsed.quitDate,
    reason: orNull(parsed.reason ?? ''),
    triggers: orNull(parsed.triggers ?? ''),
    unitLabel: orNull(parsed.unitLabel ?? ''),
    costPerUnit: numOrNull(parsed.costPerUnit ?? null),
    timePerUnitMinutes: numOrNull(parsed.timePerUnitMinutes ?? null),
    dailyUnits: numOrNull(parsed.dailyUnits ?? null),
  });
}
