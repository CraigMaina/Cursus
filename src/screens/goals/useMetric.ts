import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useData } from '@/app/data-context';
import type { NewMetricEntryInput } from '@/lib/domain/schemas';

/**
 * Metric-goal data layer (D16). Lists a metric goal's measurements and adds one (an
 * upsert keyed by goalId + date, so re-logging a day overwrites it) or removes one, all
 * ONLY through the DAL (`useData()`). Progress and chart series are derived in the view
 * from pure `goalModel` helpers.
 */
export function metricEntriesKey(goalId: string) {
  return ['metric-entries', goalId] as const;
}

export function useMetric(goalId: string | undefined, authed: boolean) {
  const data = useData();
  const queryClient = useQueryClient();

  const entriesQuery = useQuery({
    queryKey: metricEntriesKey(goalId ?? 'none'),
    queryFn: () => data.listMetricEntries(goalId!),
    enabled: authed && Boolean(goalId),
  });

  function invalidate() {
    if (goalId) void queryClient.invalidateQueries({ queryKey: metricEntriesKey(goalId) });
  }

  const addMutation = useMutation({
    mutationFn: (input: NewMetricEntryInput) => data.addMetricEntry(input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (entryId: string) => data.deleteMetricEntry(entryId),
    onSuccess: invalidate,
  });

  return {
    entries: entriesQuery.data ?? [],
    loading: entriesQuery.isLoading,
    error: entriesQuery.error ?? null,

    addEntry: (input: NewMetricEntryInput) => addMutation.mutateAsync(input),
    addingEntry: addMutation.isPending,
    addEntryError: addMutation.error,
    resetAddEntry: () => addMutation.reset(),

    deleteEntry: (entryId: string) => deleteMutation.mutate(entryId),
    deletingEntry: deleteMutation.isPending,
  };
}
