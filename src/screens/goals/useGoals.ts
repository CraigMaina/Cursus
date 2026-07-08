import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useData } from '@/app/data-context';
import type { NewGoalInput } from '@/lib/domain/schemas';

/**
 * Goals-list data layer (D16). Lists the user's active goals and creates one, both ONLY
 * through the DAL (`useData()`) behind TanStack Query. It gates on the session so the
 * screen can prompt sign-in rather than throwing on an owner-scoped read. Per-kind
 * progress math is derived in components from pure `goalModel` helpers; nothing
 * server-authoritative is computed here.
 */
export const goalsKey = ['goals'] as const;

export function useGoals() {
  const data = useData();
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: () => data.getSession(),
    staleTime: 60_000,
  });
  const authed = Boolean(sessionQuery.data);

  const goalsQuery = useQuery({
    queryKey: [...goalsKey, 'active'],
    queryFn: () => data.listGoals(),
    enabled: authed,
  });

  const createMutation = useMutation({
    mutationFn: (input: NewGoalInput) => data.createGoal(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: goalsKey });
    },
  });

  return {
    authed,
    loading: sessionQuery.isLoading || (authed && goalsQuery.isLoading),
    error: sessionQuery.error ?? goalsQuery.error ?? null,
    goals: goalsQuery.data ?? [],
    create: (input: NewGoalInput) => createMutation.mutateAsync(input),
    creating: createMutation.isPending,
    createError: createMutation.error,
    resetCreate: () => createMutation.reset(),
  };
}
