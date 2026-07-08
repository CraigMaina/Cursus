import { z } from 'zod';

/**
 * Domain schemas and types — the shared contract (PRD sections 3 and 10).
 *
 * These describe the APP-FACING (camelCase) domain shape. Postgres columns are
 * snake_case; the data-access layer (src/data) is the single place that maps rows
 * to/from these shapes and validates I/O with these schemas. No component or
 * migration should redefine these — import from here.
 *
 * Convention:
 *   - Dates without a time component (entry_date, quit_date, start_date) are
 *     ISO calendar strings 'YYYY-MM-DD' (isoDate).
 *   - Timestamps (createdAt, ...) are ISO 8601 datetime strings (isoDateTime).
 */

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
export const isoDateTime = z.string().datetime({ offset: true });

/** HH:MM local wall-clock, used for evening threshold and quiet hours. */
export const localTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:MM (24h)');

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** PRD 3: Strict resets on any missed required rule; Standard records misses.
 *  `freeze` is reserved (column exists from first migration) but not built in v1. */
export const strictnessEnum = z.enum(['strict', 'standard', 'freeze']);
export type Strictness = z.infer<typeof strictnessEnum>;

/** PRD 3: Rule types. */
export const ruleTypeEnum = z.enum(['boolean', 'quantity', 'duration', 'photo']);
export type RuleType = z.infer<typeof ruleTypeEnum>;

/** PRD 3: Rule frequency. */
export const ruleFrequencyEnum = z.enum(['daily', 'n_per_week']);
export type RuleFrequency = z.infer<typeof ruleFrequencyEnum>;

/** PRD 7: Quote categories drive reward-card selection. */
export const quoteCategoryEnum = z.enum(['daily', 'milestone', 'reset']);
export type QuoteCategory = z.infer<typeof quoteCategoryEnum>;

/** PRD 8: Icon slot registry. No emoji — every slot maps to a Student Pack line icon. */
export const iconSlotEnum = z.enum([
  'water',
  'indoor_workout',
  'outdoor_workout',
  'reading',
  'diet',
  'photo',
  'streak',
  'milestone',
  'vice',
  'days_clean',
  'relapse',
  'reminder',
  'calendar',
  'settings',
  'savings',
  'add',
]);
export type IconSlot = z.infer<typeof iconSlotEnum>;

// ---------------------------------------------------------------------------
// Entities (PRD section 10 tables, app-facing camelCase)
// ---------------------------------------------------------------------------

export const profileSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(1).max(80).nullable(),
  timezone: z.string().min(1), // IANA tz, e.g. 'Africa/Nairobi'
  eveningThresholdLocal: localTime, // when "at risk" evaluation fires
  createdAt: isoDateTime,
});
export type Profile = z.infer<typeof profileSchema>;

export const challengeSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(120),
  description: z.string().max(2000).nullable(),
  durationDays: z.number().int().positive(),
  startDate: isoDate,
  strictness: strictnessEnum,
  freezeTokens: z.number().int().min(0).default(0), // reserved, unused in v1
  isArchived: z.boolean().default(false),
  createdAt: isoDateTime,
});
export type Challenge = z.infer<typeof challengeSchema>;

export const ruleSchema = z.object({
  id: z.string().uuid(),
  challengeId: z.string().uuid(),
  name: z.string().min(1).max(120),
  iconSlot: iconSlotEnum,
  type: ruleTypeEnum,
  targetValue: z.number().nonnegative().nullable(), // e.g. 3.7 (L), 10 (pages), 45 (min)
  unit: z.string().max(24).nullable(), // e.g. 'L', 'pages', 'min'
  frequency: ruleFrequencyEnum,
  frequencyCount: z.number().int().positive().nullable(), // n for n_per_week
  isRequired: z.boolean(),
  sortOrder: z.number().int(),
});
export type Rule = z.infer<typeof ruleSchema>;

export const entrySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  ruleId: z.string().uuid(),
  entryDate: isoDate,
  completed: z.boolean(),
  value: z.number().nullable(), // logged quantity/duration
  note: z.string().max(2000).nullable(),
  photoPath: z.string().nullable(), // storage path, per-user prefix
  createdAt: isoDateTime,
});
export type Entry = z.infer<typeof entrySchema>;

export const challengeResetSchema = z.object({
  id: z.string().uuid(),
  challengeId: z.string().uuid(),
  resetDate: isoDate,
  reason: z.string().max(500).nullable(),
});
export type ChallengeReset = z.infer<typeof challengeResetSchema>;

export const templateSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(), // null => system template
  name: z.string().min(1).max(120),
  description: z.string().max(2000).nullable(),
  durationDays: z.number().int().positive(),
  strictness: strictnessEnum,
  isSystem: z.boolean(),
  /** Rule blueprints, without ids/challengeId — instantiated on start. */
  definition: z.object({
    rules: z.array(
      ruleSchema.omit({ id: true, challengeId: true }),
    ),
  }),
});
export type Template = z.infer<typeof templateSchema>;

export const viceSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(120),
  quitDate: isoDate,
  reason: z.string().max(2000).nullable(),
  triggers: z.string().max(2000).nullable(),
  costPerUnit: z.number().nonnegative().nullable(),
  timePerUnitMinutes: z.number().nonnegative().nullable(),
  unitLabel: z.string().max(40).nullable(), // e.g. 'cigarette', 'drink'
  dailyUnits: z.number().nonnegative().nullable().default(null), // units/day avoided; drives savings
  isArchived: z.boolean().default(false),
});
export type Vice = z.infer<typeof viceSchema>;

export const relapseSchema = z.object({
  id: z.string().uuid(),
  viceId: z.string().uuid(),
  relapseDate: isoDate,
  note: z.string().max(2000).nullable(),
});
export type Relapse = z.infer<typeof relapseSchema>;

export const quoteSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1),
  author: z.string().min(1),
  source: z.string().nullable(),
  category: quoteCategoryEnum,
});
export type Quote = z.infer<typeof quoteSchema>;

export const pushSubscriptionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
  userAgent: z.string().nullable(),
  createdAt: isoDateTime,
});
export type PushSubscriptionRow = z.infer<typeof pushSubscriptionSchema>;

export const notificationPrefsSchema = z.object({
  userId: z.string().uuid(),
  pushEnabled: z.boolean().default(true),
  emailEnabled: z.boolean().default(false),
  quietStartLocal: localTime.nullable(),
  quietEndLocal: localTime.nullable(),
});
export type NotificationPrefs = z.infer<typeof notificationPrefsSchema>;

// ---------------------------------------------------------------------------
// Input schemas (mutations) — omit server-owned fields
// ---------------------------------------------------------------------------

export const newChallengeInput = challengeSchema
  .omit({ id: true, userId: true, createdAt: true, isArchived: true, freezeTokens: true })
  .extend({ freezeTokens: z.number().int().min(0).optional() });
export type NewChallengeInput = z.infer<typeof newChallengeInput>;

export const newRuleInput = ruleSchema.omit({ id: true, challengeId: true });
export type NewRuleInput = z.infer<typeof newRuleInput>;

/** Upsert shape for the Today view; keyed by (ruleId, entryDate). */
export const upsertEntryInput = entrySchema.omit({
  id: true,
  userId: true,
  createdAt: true,
});
export type UpsertEntryInput = z.infer<typeof upsertEntryInput>;

export const newViceInput = viceSchema.omit({ id: true, userId: true, isArchived: true });
export type NewViceInput = z.infer<typeof newViceInput>;

export const newRelapseInput = relapseSchema.omit({ id: true });
export type NewRelapseInput = z.infer<typeof newRelapseInput>;

// ---------------------------------------------------------------------------
// Goals (D16) — one Goals area, three kinds: metric | reading | routine
// ---------------------------------------------------------------------------

export const goalKindEnum = z.enum(['metric', 'reading', 'routine']);
export type GoalKind = z.infer<typeof goalKindEnum>;

/** For a metric goal: is the target below, above, or at the start value. */
export const metricDirectionEnum = z.enum(['down', 'up', 'maintain']);
export type MetricDirection = z.infer<typeof metricDirectionEnum>;

export const goalSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  kind: goalKindEnum,
  name: z.string().min(1).max(120),
  // metric-only (null for other kinds)
  unit: z.string().max(24).nullable(),
  startValue: z.number().nullable(),
  targetValue: z.number().nullable(),
  direction: metricDirectionEnum.nullable(),
  // reading-only (null otherwise)
  targetCount: z.number().int().nonnegative().nullable(),
  isArchived: z.boolean().default(false),
  createdAt: isoDateTime,
});
export type Goal = z.infer<typeof goalSchema>;

/** A metric measurement on a date (weight, body fat, ...). */
export const metricEntrySchema = z.object({
  id: z.string().uuid(),
  goalId: z.string().uuid(),
  entryDate: isoDate,
  value: z.number(),
  note: z.string().max(2000).nullable(),
});
export type MetricEntry = z.infer<typeof metricEntrySchema>;

/** A book logged against a reading goal. */
export const bookSchema = z.object({
  id: z.string().uuid(),
  goalId: z.string().uuid(),
  title: z.string().min(1).max(300),
  author: z.string().max(200).nullable(),
  finishedDate: isoDate.nullable(),
  rating: z.number().int().min(1).max(5).nullable(),
  note: z.string().max(2000).nullable(),
});
export type Book = z.infer<typeof bookSchema>;

/** An exercise in a routine's template (target sets/reps/weight). */
export const routineExerciseSchema = z.object({
  id: z.string().uuid(),
  goalId: z.string().uuid(),
  name: z.string().min(1).max(120),
  targetSets: z.number().int().nonnegative().nullable(),
  targetReps: z.number().int().nonnegative().nullable(),
  targetWeight: z.number().nullable(),
  unit: z.string().max(12).nullable(), // 'kg' | 'lb'
  sortOrder: z.number().int(),
});
export type RoutineExercise = z.infer<typeof routineExerciseSchema>;

/** A logged workout session for a routine goal. */
export const workoutSessionSchema = z.object({
  id: z.string().uuid(),
  goalId: z.string().uuid(),
  sessionDate: isoDate,
  note: z.string().max(2000).nullable(),
  createdAt: isoDateTime,
});
export type WorkoutSession = z.infer<typeof workoutSessionSchema>;

/** One actual set performed within a session. */
export const workoutSetSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  exerciseId: z.string().uuid().nullable(),
  exerciseName: z.string().min(1).max(120),
  setNumber: z.number().int().positive(),
  reps: z.number().int().nonnegative().nullable(),
  weight: z.number().nullable(),
});
export type WorkoutSet = z.infer<typeof workoutSetSchema>;

// Input schemas (omit server-owned fields)
export const newGoalInput = goalSchema.omit({ id: true, userId: true, isArchived: true, createdAt: true });
export type NewGoalInput = z.infer<typeof newGoalInput>;

export const newMetricEntryInput = metricEntrySchema.omit({ id: true });
export type NewMetricEntryInput = z.infer<typeof newMetricEntryInput>;

export const newBookInput = bookSchema.omit({ id: true });
export type NewBookInput = z.infer<typeof newBookInput>;

export const newRoutineExerciseInput = routineExerciseSchema.omit({ id: true });
export type NewRoutineExerciseInput = z.infer<typeof newRoutineExerciseInput>;

/** Logging a session sends the session plus its sets in one call. */
export const newWorkoutSetInput = workoutSetSchema.omit({ id: true, sessionId: true });
export type NewWorkoutSetInput = z.infer<typeof newWorkoutSetInput>;
export const logWorkoutInput = z.object({
  goalId: z.string().uuid(),
  sessionDate: isoDate,
  note: z.string().max(2000).nullable(),
  sets: z.array(newWorkoutSetInput),
});
export type LogWorkoutInput = z.infer<typeof logWorkoutInput>;
