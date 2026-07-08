import { z } from 'zod';
import {
  newBookInput,
  newGoalInput,
  newMetricEntryInput,
  newRoutineExerciseInput,
  logWorkoutInput,
  type Book,
  type Goal,
  type GoalKind,
  type LogWorkoutInput,
  type MetricDirection,
  type NewBookInput,
  type NewGoalInput,
  type NewMetricEntryInput,
  type RoutineExercise,
} from '@/lib/domain/schemas';

/**
 * Goal form contracts (Frontend-owned, local to the goals screens). Each FORM schema
 * validates raw control values, then a mapper re-validates the mapped result against the
 * canonical `@/lib/domain` input schema (belt and suspenders) so a bad payload can never
 * reach Supabase. Number inputs surface `NaN`/'' when cleared; helpers normalise those
 * to the schema's `null`.
 */

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

const numeric = (schema: z.ZodNumber) =>
  z.preprocess((v) => {
    if (v === '' || v === null || v === undefined) return undefined;
    if (typeof v === 'number' && Number.isNaN(v)) return undefined;
    return v;
  }, schema.optional());

function orNull(s: string | undefined): string | null {
  const t = (s ?? '').trim();
  return t.length > 0 ? t : null;
}

function numOrNull(n: number | null | undefined): number | null {
  return n != null && !Number.isNaN(n) ? n : null;
}

// ---------------------------------------------------------------------------
// Goal (add + edit)
// ---------------------------------------------------------------------------

export interface GoalFormValues {
  kind: GoalKind;
  name: string;
  // metric
  unit: string;
  startValue: number | null;
  targetValue: number | null;
  direction: MetricDirection;
  // reading
  targetCount: number | null;
}

export const goalFormSchema = z.object({
  kind: z.enum(['metric', 'reading', 'routine']),
  name: z.string().trim().min(1, 'Name the goal').max(120, 'Keep it under 120 characters'),
  unit: z.string().trim().max(24, 'Keep the unit short').optional(),
  startValue: numeric(z.number({ invalid_type_error: 'Enter a number' })),
  targetValue: numeric(z.number({ invalid_type_error: 'Enter a number' })),
  direction: z.enum(['down', 'up', 'maintain']),
  targetCount: numeric(
    z.number({ invalid_type_error: 'Enter a whole number' }).int('Whole numbers only').nonnegative('Zero or more'),
  ),
});

export function emptyGoal(kind: GoalKind = 'metric'): GoalFormValues {
  return {
    kind,
    name: '',
    unit: '',
    startValue: null,
    targetValue: null,
    direction: 'down',
    targetCount: null,
  };
}

export function goalToFormValues(g: Goal): GoalFormValues {
  return {
    kind: g.kind,
    name: g.name,
    unit: g.unit ?? '',
    startValue: g.startValue,
    targetValue: g.targetValue,
    direction: g.direction ?? 'down',
    targetCount: g.targetCount,
  };
}

/** Map validated form values to `newGoalInput`, zeroing out fields not used by the kind. */
export function toGoalDomain(values: GoalFormValues): NewGoalInput {
  const parsed = goalFormSchema.parse(values);
  const base = {
    kind: parsed.kind,
    name: parsed.name,
    unit: null as string | null,
    startValue: null as number | null,
    targetValue: null as number | null,
    direction: null as MetricDirection | null,
    targetCount: null as number | null,
  };

  if (parsed.kind === 'metric') {
    base.unit = orNull(parsed.unit);
    base.startValue = numOrNull(parsed.startValue);
    base.targetValue = numOrNull(parsed.targetValue);
    base.direction = parsed.direction;
  } else if (parsed.kind === 'reading') {
    base.targetCount = numOrNull(parsed.targetCount);
  }

  return newGoalInput.parse(base);
}

// ---------------------------------------------------------------------------
// Metric measurement
// ---------------------------------------------------------------------------

export interface MeasurementFormValues {
  entryDate: string;
  value: number | null;
  note: string;
}

export const measurementFormSchema = z.object({
  entryDate: z.string().regex(isoDatePattern, 'Choose a date'),
  value: numeric(z.number({ invalid_type_error: 'Enter a number' })).refine(
    (v) => v != null,
    'Enter a value',
  ),
  note: z.string().trim().max(2000, 'Keep it under 2000 characters').optional(),
});

export function emptyMeasurement(entryDate: string): MeasurementFormValues {
  return { entryDate, value: null, note: '' };
}

export function toMetricEntryDomain(
  goalId: string,
  values: MeasurementFormValues,
): NewMetricEntryInput {
  const parsed = measurementFormSchema.parse(values);
  return newMetricEntryInput.parse({
    goalId,
    entryDate: parsed.entryDate,
    value: parsed.value as number,
    note: orNull(parsed.note),
  });
}

// ---------------------------------------------------------------------------
// Book
// ---------------------------------------------------------------------------

export interface BookFormValues {
  title: string;
  author: string;
  finishedDate: string;
  rating: number | null;
  note: string;
}

export const bookFormSchema = z.object({
  title: z.string().trim().min(1, 'Name the book').max(300, 'Keep it under 300 characters'),
  author: z.string().trim().max(200, 'Keep it under 200 characters').optional(),
  finishedDate: z
    .string()
    .refine((s) => s === '' || isoDatePattern.test(s), 'Use a valid date')
    .optional(),
  rating: numeric(
    z.number().int('Whole stars only').min(1, 'One to five stars').max(5, 'One to five stars'),
  ),
  note: z.string().trim().max(2000, 'Keep it under 2000 characters').optional(),
});

export function emptyBook(): BookFormValues {
  return { title: '', author: '', finishedDate: '', rating: null, note: '' };
}

export function bookToFormValues(b: Book): BookFormValues {
  return {
    title: b.title,
    author: b.author ?? '',
    finishedDate: b.finishedDate ?? '',
    rating: b.rating,
    note: b.note ?? '',
  };
}

export function toBookDomain(goalId: string, values: BookFormValues): NewBookInput {
  const parsed = bookFormSchema.parse(values);
  return newBookInput.parse({
    goalId,
    title: parsed.title,
    author: orNull(parsed.author),
    finishedDate: orNull(parsed.finishedDate),
    rating: numOrNull(parsed.rating),
    note: orNull(parsed.note),
  });
}

// ---------------------------------------------------------------------------
// Routine: exercises template
// ---------------------------------------------------------------------------

export interface ExerciseRowValues {
  name: string;
  targetSets: number | null;
  targetReps: number | null;
  targetWeight: number | null;
  unit: string;
}

export function emptyExerciseRow(): ExerciseRowValues {
  return { name: '', targetSets: null, targetReps: null, targetWeight: null, unit: 'kg' };
}

export function exerciseToRow(ex: RoutineExercise): ExerciseRowValues {
  return {
    name: ex.name,
    targetSets: ex.targetSets,
    targetReps: ex.targetReps,
    targetWeight: ex.targetWeight,
    unit: ex.unit ?? 'kg',
  };
}

/**
 * Map the editable template rows to the DAL's `replaceRoutineExercises` payload. Rows
 * with a blank name are dropped (they are unfinished placeholders); each survivor is
 * validated against the routine-exercise schema (sans server-owned `id`/`goalId`, which
 * the DAL supplies) and gets its list position as sortOrder.
 */
const templateRowSchema = newRoutineExerciseInput.omit({ goalId: true });

export function toExerciseTemplate(
  rows: ExerciseRowValues[],
): Omit<RoutineExercise, 'id' | 'goalId'>[] {
  return rows
    .filter((r) => r.name.trim().length > 0)
    .map((r, i) =>
      templateRowSchema.parse({
        name: r.name.trim(),
        targetSets: numOrNull(r.targetSets),
        targetReps: numOrNull(r.targetReps),
        targetWeight: numOrNull(r.targetWeight),
        unit: orNull(r.unit),
        sortOrder: i,
      }),
    );
}

// ---------------------------------------------------------------------------
// Routine: log a session
// ---------------------------------------------------------------------------

export interface LoggedSetValues {
  reps: number | null;
  weight: number | null;
}

export interface LoggedExerciseValues {
  exerciseId: string | null;
  name: string;
  sets: LoggedSetValues[];
}

export interface SessionFormValues {
  sessionDate: string;
  note: string;
  exercises: LoggedExerciseValues[];
}

export function emptySet(): LoggedSetValues {
  return { reps: null, weight: null };
}

/** Seed the log form from the template so the user just fills in what they actually did. */
export function sessionFromTemplate(
  sessionDate: string,
  exercises: RoutineExercise[],
): SessionFormValues {
  return {
    sessionDate,
    note: '',
    exercises: exercises.map((ex) => ({
      exerciseId: ex.id,
      name: ex.name,
      sets: Array.from({ length: Math.max(1, ex.targetSets ?? 1) }, emptySet),
    })),
  };
}

/**
 * Flatten the per-exercise sets into the DAL's `logWorkout` payload. A set is kept only
 * if it recorded at least a rep count or a weight; empty rows are ignored so a partly
 * filled session logs cleanly. Set numbers are 1-based within each exercise.
 */
export function toLogWorkout(goalId: string, values: SessionFormValues): LogWorkoutInput {
  if (!isoDatePattern.test(values.sessionDate)) {
    throw new Error('Choose a session date');
  }
  const sets = values.exercises.flatMap((ex) => {
    let setNumber = 0;
    return ex.sets
      .filter((s) => numOrNull(s.reps) != null || numOrNull(s.weight) != null)
      .map((s) => {
        setNumber += 1;
        return {
          exerciseId: ex.exerciseId,
          exerciseName: ex.name.trim() || 'Exercise',
          setNumber,
          reps: numOrNull(s.reps),
          weight: numOrNull(s.weight),
        };
      });
  });

  return logWorkoutInput.parse({
    goalId,
    sessionDate: values.sessionDate,
    note: orNull(values.note),
    sets,
  });
}
