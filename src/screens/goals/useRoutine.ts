import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useData } from '@/app/data-context';
import type { LogWorkoutInput, RoutineExercise } from '@/lib/domain/schemas';

/**
 * Routine-goal data layer (D16). Owns the exercises TEMPLATE (replaced wholesale) and
 * the logged SESSIONS (each holding actual sets). Reads and writes ONLY through the DAL
 * (`useData()`). Set-level detail for a session is fetched lazily by the history row via
 * `useWorkoutSets` when it is expanded, so the list stays cheap.
 */
export function routineExercisesKey(goalId: string) {
  return ['routine-exercises', goalId] as const;
}
export function workoutSessionsKey(goalId: string) {
  return ['workout-sessions', goalId] as const;
}
export function workoutSetsKey(sessionId: string) {
  return ['workout-sets', sessionId] as const;
}

export function useRoutine(goalId: string | undefined, authed: boolean) {
  const data = useData();
  const queryClient = useQueryClient();

  const exercisesQuery = useQuery({
    queryKey: routineExercisesKey(goalId ?? 'none'),
    queryFn: () => data.listRoutineExercises(goalId!),
    enabled: authed && Boolean(goalId),
  });

  const sessionsQuery = useQuery({
    queryKey: workoutSessionsKey(goalId ?? 'none'),
    queryFn: () => data.listWorkoutSessions(goalId!),
    enabled: authed && Boolean(goalId),
  });

  const replaceMutation = useMutation({
    mutationFn: (exercises: Omit<RoutineExercise, 'id' | 'goalId'>[]) =>
      data.replaceRoutineExercises(goalId!, exercises),
    onSuccess: () => {
      if (goalId) void queryClient.invalidateQueries({ queryKey: routineExercisesKey(goalId) });
    },
  });

  const logMutation = useMutation({
    mutationFn: (input: LogWorkoutInput) => data.logWorkout(input),
    onSuccess: () => {
      if (goalId) void queryClient.invalidateQueries({ queryKey: workoutSessionsKey(goalId) });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) => data.deleteWorkoutSession(sessionId),
    onSuccess: (_res, sessionId) => {
      if (goalId) void queryClient.invalidateQueries({ queryKey: workoutSessionsKey(goalId) });
      void queryClient.removeQueries({ queryKey: workoutSetsKey(sessionId) });
    },
  });

  return {
    exercises: exercisesQuery.data ?? [],
    sessions: sessionsQuery.data ?? [],
    loading: exercisesQuery.isLoading || sessionsQuery.isLoading,
    error: exercisesQuery.error ?? sessionsQuery.error ?? null,

    replaceExercises: (exercises: Omit<RoutineExercise, 'id' | 'goalId'>[]) =>
      replaceMutation.mutateAsync(exercises),
    replacing: replaceMutation.isPending,
    replaceError: replaceMutation.error,
    resetReplace: () => replaceMutation.reset(),

    logSession: (input: LogWorkoutInput) => logMutation.mutateAsync(input),
    logging: logMutation.isPending,
    logError: logMutation.error,
    resetLog: () => logMutation.reset(),

    deleteSession: (sessionId: string) => deleteSessionMutation.mutate(sessionId),
    deletingSession: deleteSessionMutation.isPending,
  };
}

/** Lazily load a single session's sets (enabled only when its history row is expanded). */
export function useWorkoutSets(sessionId: string, enabled: boolean) {
  const data = useData();
  return useQuery({
    queryKey: workoutSetsKey(sessionId),
    queryFn: () => data.getWorkoutSets(sessionId),
    enabled,
  });
}
