import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/app/data-context';
import type { NewGoalInput } from '@/lib/domain/schemas';
import { goalsKey } from './useGoals';

/**
 * Single-goal data layer (D16). Loads the goal from the owner-scoped list (including
 * archived, so a detail link never dead-ends), and edits or archives it. Kind-specific
 * data (metric entries, books, routine sessions) lives in the per-kind hooks; this one
 * only owns the parent goal record. Everything goes ONLY through the DAL (`useData()`).
 */
export function useGoal(goalId: string | undefined) {
  const data = useData();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: () => data.getSession(),
    staleTime: 60_000,
  });
  const authed = Boolean(sessionQuery.data);

  const goalsQuery = useQuery({
    queryKey: [...goalsKey, 'all'],
    queryFn: () => data.listGoals({ includeArchived: true }),
    enabled: authed,
  });
  const goal = useMemo(
    () => goalsQuery.data?.find((g) => g.id === goalId) ?? null,
    [goalsQuery.data, goalId],
  );

  const updateMutation = useMutation({
    mutationFn: (patch: Partial<NewGoalInput>) => data.updateGoal(goalId!, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: goalsKey });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => data.archiveGoal(goalId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: goalsKey });
      navigate('/goals', { replace: true });
    },
  });

  return {
    authed,
    loading: sessionQuery.isLoading || (authed && Boolean(goalId) && goalsQuery.isLoading),
    error: sessionQuery.error ?? goalsQuery.error ?? null,
    goal,

    updateGoal: (patch: Partial<NewGoalInput>) => updateMutation.mutateAsync(patch),
    updatingGoal: updateMutation.isPending,
    updateGoalError: updateMutation.error,
    resetUpdateGoal: () => updateMutation.reset(),

    archiveGoal: () => archiveMutation.mutate(),
    archivingGoal: archiveMutation.isPending,
    archiveGoalError: archiveMutation.error,
  };
}
