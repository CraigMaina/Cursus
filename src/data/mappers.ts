/**
 * Row <-> domain mapping. This is the ONLY place snake_case Postgres columns meet the
 * camelCase domain shapes. Every value returned to the app is run through its zod schema
 * (`parse`), so the DAL never hands back an unvalidated row (dal.ts contract).
 */
import {
  challengeResetSchema,
  challengeSchema,
  entrySchema,
  notificationPrefsSchema,
  profileSchema,
  quoteSchema,
  ruleSchema,
  templateSchema,
  viceSchema,
  relapseSchema,
  type Challenge,
  type ChallengeReset,
  type Entry,
  type NewChallengeInput,
  type NewRelapseInput,
  type NewViceInput,
  type NotificationPrefs,
  type Profile,
  type Quote,
  type Relapse,
  type Rule,
  type Template,
  type UpsertEntryInput,
  type Vice,
} from '@/lib/domain/schemas';

// PostgREST may serialize numeric columns as strings to preserve precision; coerce.
function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  return typeof v === 'number' ? v : Number(v);
}

type Row = Record<string, unknown>;

// --- Row -> domain -----------------------------------------------------------

export function toProfile(row: Row): Profile {
  return profileSchema.parse({
    id: row.id,
    displayName: row.display_name ?? null,
    timezone: row.timezone,
    eveningThresholdLocal: row.evening_threshold_local,
    createdAt: row.created_at,
  });
}

export function toChallenge(row: Row): Challenge {
  return challengeSchema.parse({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? null,
    durationDays: row.duration_days,
    startDate: row.start_date,
    strictness: row.strictness,
    freezeTokens: row.freeze_tokens,
    isArchived: row.is_archived,
    createdAt: row.created_at,
  });
}

export function toRule(row: Row): Rule {
  return ruleSchema.parse({
    id: row.id,
    challengeId: row.challenge_id,
    name: row.name,
    iconSlot: row.icon_slot,
    type: row.type,
    targetValue: num(row.target_value),
    unit: row.unit ?? null,
    frequency: row.frequency,
    frequencyCount: row.frequency_count === null || row.frequency_count === undefined
      ? null
      : Number(row.frequency_count),
    isRequired: row.is_required,
    sortOrder: row.sort_order,
  });
}

export function toEntry(row: Row): Entry {
  return entrySchema.parse({
    id: row.id,
    userId: row.user_id,
    ruleId: row.rule_id,
    entryDate: row.entry_date,
    completed: row.completed,
    value: num(row.value),
    note: row.note ?? null,
    photoPath: row.photo_path ?? null,
    createdAt: row.created_at,
  });
}

export function toChallengeReset(row: Row): ChallengeReset {
  return challengeResetSchema.parse({
    id: row.id,
    challengeId: row.challenge_id,
    resetDate: row.reset_date,
    reason: row.reason ?? null,
  });
}

export function toTemplate(row: Row): Template {
  return templateSchema.parse({
    id: row.id,
    userId: row.user_id ?? null,
    name: row.name,
    description: row.description ?? null,
    durationDays: row.duration_days,
    strictness: row.strictness,
    isSystem: row.is_system,
    definition: row.definition,
  });
}

export function toVice(row: Row): Vice {
  return viceSchema.parse({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    quitDate: row.quit_date,
    reason: row.reason ?? null,
    triggers: row.triggers ?? null,
    costPerUnit: num(row.cost_per_unit),
    timePerUnitMinutes: num(row.time_per_unit_minutes),
    unitLabel: row.unit_label ?? null,
    isArchived: row.is_archived,
  });
}

export function toRelapse(row: Row): Relapse {
  return relapseSchema.parse({
    id: row.id,
    viceId: row.vice_id,
    relapseDate: row.relapse_date,
    note: row.note ?? null,
  });
}

export function toQuote(row: Row): Quote {
  return quoteSchema.parse({
    id: row.id,
    text: row.text,
    author: row.author,
    source: row.source ?? null,
    category: row.category,
  });
}

export function toNotificationPrefs(row: Row): NotificationPrefs {
  return notificationPrefsSchema.parse({
    userId: row.user_id,
    pushEnabled: row.push_enabled,
    emailEnabled: row.email_enabled,
    quietStartLocal: row.quiet_start_local ?? null,
    quietEndLocal: row.quiet_end_local ?? null,
  });
}

// --- Domain -> row (inserts / updates); user_id defaults to auth.uid() in SQL ---

export function ruleToRow(
  challengeId: string,
  r: Omit<Rule, 'id' | 'challengeId'>,
): Row {
  return {
    challenge_id: challengeId,
    name: r.name,
    icon_slot: r.iconSlot,
    type: r.type,
    target_value: r.targetValue,
    unit: r.unit,
    frequency: r.frequency,
    frequency_count: r.frequencyCount,
    is_required: r.isRequired,
    sort_order: r.sortOrder,
  };
}

export function challengeToRow(input: NewChallengeInput): Row {
  return {
    name: input.name,
    description: input.description ?? null,
    duration_days: input.durationDays,
    start_date: input.startDate,
    strictness: input.strictness,
    freeze_tokens: input.freezeTokens ?? 0,
  };
}

export function challengePatchToRow(patch: Partial<NewChallengeInput>): Row {
  const row: Row = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.durationDays !== undefined) row.duration_days = patch.durationDays;
  if (patch.startDate !== undefined) row.start_date = patch.startDate;
  if (patch.strictness !== undefined) row.strictness = patch.strictness;
  if (patch.freezeTokens !== undefined) row.freeze_tokens = patch.freezeTokens;
  return row;
}

export function entryToRow(input: UpsertEntryInput): Row {
  return {
    rule_id: input.ruleId,
    entry_date: input.entryDate,
    completed: input.completed,
    value: input.value,
    note: input.note,
    photo_path: input.photoPath,
  };
}

export function viceToRow(input: NewViceInput): Row {
  return {
    name: input.name,
    quit_date: input.quitDate,
    reason: input.reason ?? null,
    triggers: input.triggers ?? null,
    cost_per_unit: input.costPerUnit ?? null,
    time_per_unit_minutes: input.timePerUnitMinutes ?? null,
    unit_label: input.unitLabel ?? null,
  };
}

export function vicePatchToRow(patch: Partial<NewViceInput>): Row {
  const row: Row = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.quitDate !== undefined) row.quit_date = patch.quitDate;
  if (patch.reason !== undefined) row.reason = patch.reason;
  if (patch.triggers !== undefined) row.triggers = patch.triggers;
  if (patch.costPerUnit !== undefined) row.cost_per_unit = patch.costPerUnit;
  if (patch.timePerUnitMinutes !== undefined) row.time_per_unit_minutes = patch.timePerUnitMinutes;
  if (patch.unitLabel !== undefined) row.unit_label = patch.unitLabel;
  return row;
}

export function relapseToRow(input: NewRelapseInput): Row {
  return {
    vice_id: input.viceId,
    relapse_date: input.relapseDate,
    note: input.note ?? null,
  };
}
