import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useData } from '@/app/data-context';
import type { NewViceInput } from '@/lib/domain/schemas';

/**
 * Vice-list data layer (PRD 4.1 #6). Lists the user's active vices and creates a new
 * one, both ONLY through the DAL (`useData()`) behind TanStack Query. It gates on the
 * session so the screen can prompt sign-in rather than throwing on an owner-scoped
 * read. Days-clean / savings math is derived in the components from pure `compute`
 * helpers; nothing server-authoritative is computed here.
 */
export const vicesKey = ['vices'] as const;

export function useVices() {
  const data = useData();
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: () => data.getSession(),
    staleTime: 60_000,
  });
  const authed = Boolean(sessionQuery.data);

  const vicesQuery = useQuery({
    queryKey: [...vicesKey, 'active'],
    queryFn: () => data.listVices(),
    enabled: authed,
  });

  const createMutation = useMutation({
    mutationFn: (input: NewViceInput) => data.createVice(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vicesKey });
    },
  });

  return {
    authed,
    loading: sessionQuery.isLoading || (authed && vicesQuery.isLoading),
    error: sessionQuery.error ?? vicesQuery.error ?? null,
    vices: vicesQuery.data ?? [],
    create: (input: NewViceInput) => createMutation.mutateAsync(input),
    creating: createMutation.isPending,
    createError: createMutation.error,
    resetCreate: () => createMutation.reset(),
  };
}
