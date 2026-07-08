/**
 * Row <-> domain mapping for the Goals feature (D16). Same contract as mappers.ts:
 * snake_case DB rows in, zod-validated camelCase domain out; inserts omit user_id and
 * rely on the `default auth.uid()` + owner RLS. Kept in its own file so the Goals surface
 * does not bloat the core mappers.
 */
import {
  goalSchema,
  metricEntrySchema,
  bookSchema,
  routineExerciseSchema,
  workoutSessionSchema,
  workoutSetSchema,
  type Goal,
  type MetricEntry,
  type Book,
  type RoutineExercise,
  type WorkoutSession,
  type WorkoutSet,
  type NewGoalInput,
  type NewMetricEntryInput,
  type NewBookInput,
  type RoutineExercise as RoutineExerciseType,
} from '@/lib/domain/schemas';

type Row = Record<string, unknown>;

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  return typeof v === 'number' ? v : Number(v);
}

// --- Row -> domain -----------------------------------------------------------

export function toGoal(row: Row): Goal {
  return goalSchema.parse({
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    name: row.name,
    unit: row.unit ?? null,
    startValue: num(row.start_value),
    targetValue: num(row.target_value),
    direction: row.direction ?? null,
    targetCount: row.target_count === null || row.target_count === undefined ? null : Number(row.target_count),
    isArchived: row.is_archived,
    createdAt: row.created_at,
  });
}

export function toMetricEntry(row: Row): MetricEntry {
  return metricEntrySchema.parse({
    id: row.id,
    goalId: row.goal_id,
    entryDate: row.entry_date,
    value: num(row.value),
    note: row.note ?? null,
  });
}

export function toBook(row: Row): Book {
  return bookSchema.parse({
    id: row.id,
    goalId: row.goal_id,
    title: row.title,
    author: row.author ?? null,
    finishedDate: row.finished_date ?? null,
    rating: row.rating === null || row.rating === undefined ? null : Number(row.rating),
    note: row.note ?? null,
  });
}

export function toRoutineExercise(row: Row): RoutineExercise {
  return routineExerciseSchema.parse({
    id: row.id,
    goalId: row.goal_id,
    name: row.name,
    targetSets: row.target_sets === null || row.target_sets === undefined ? null : Number(row.target_sets),
    targetReps: row.target_reps === null || row.target_reps === undefined ? null : Number(row.target_reps),
    targetWeight: num(row.target_weight),
    unit: row.unit ?? null,
    sortOrder: row.sort_order,
  });
}

export function toWorkoutSession(row: Row): WorkoutSession {
  return workoutSessionSchema.parse({
    id: row.id,
    goalId: row.goal_id,
    sessionDate: row.session_date,
    note: row.note ?? null,
    createdAt: row.created_at,
  });
}

export function toWorkoutSet(row: Row): WorkoutSet {
  return workoutSetSchema.parse({
    id: row.id,
    sessionId: row.session_id,
    exerciseId: row.exercise_id ?? null,
    exerciseName: row.exercise_name,
    setNumber: row.set_number,
    reps: row.reps === null || row.reps === undefined ? null : Number(row.reps),
    weight: num(row.weight),
  });
}

// --- Domain -> row (inserts/updates; user_id via DB default auth.uid()) -------

export function goalToRow(input: NewGoalInput): Row {
  return {
    kind: input.kind,
    name: input.name,
    unit: input.unit ?? null,
    start_value: input.startValue ?? null,
    target_value: input.targetValue ?? null,
    direction: input.direction ?? null,
    target_count: input.targetCount ?? null,
  };
}

export function goalPatchToRow(patch: Partial<NewGoalInput>): Row {
  const row: Row = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.unit !== undefined) row.unit = patch.unit;
  if (patch.startValue !== undefined) row.start_value = patch.startValue;
  if (patch.targetValue !== undefined) row.target_value = patch.targetValue;
  if (patch.direction !== undefined) row.direction = patch.direction;
  if (patch.targetCount !== undefined) row.target_count = patch.targetCount;
  return row;
}

export function metricEntryToRow(input: NewMetricEntryInput): Row {
  return {
    goal_id: input.goalId,
    entry_date: input.entryDate,
    value: input.value,
    note: input.note ?? null,
  };
}

export function bookToRow(input: NewBookInput): Row {
  return {
    goal_id: input.goalId,
    title: input.title,
    author: input.author ?? null,
    finished_date: input.finishedDate ?? null,
    rating: input.rating ?? null,
    note: input.note ?? null,
  };
}

export function bookPatchToRow(patch: Partial<NewBookInput>): Row {
  const row: Row = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.author !== undefined) row.author = patch.author;
  if (patch.finishedDate !== undefined) row.finished_date = patch.finishedDate;
  if (patch.rating !== undefined) row.rating = patch.rating;
  if (patch.note !== undefined) row.note = patch.note;
  return row;
}

export function routineExerciseToRow(goalId: string, ex: Omit<RoutineExerciseType, 'id' | 'goalId'>): Row {
  return {
    goal_id: goalId,
    name: ex.name,
    target_sets: ex.targetSets ?? null,
    target_reps: ex.targetReps ?? null,
    target_weight: ex.targetWeight ?? null,
    unit: ex.unit ?? null,
    sort_order: ex.sortOrder,
  };
}
