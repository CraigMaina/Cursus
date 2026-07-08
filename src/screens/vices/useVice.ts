import { useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/app/data-context';
import {
  computeSavings,
  daysClean,
  isMilestone,
  latestMilestone,
  type Savings,
} from '@/lib/domain/compute';
import type { NewRelapseInput, NewViceInput, Relapse } from '@/lib/domain/schemas';
import { todayIso } from '../today/dates';
import { vicesKey } from './useVices';

/**
 * Single-vice data layer (PRD 4.1 #6). Loads the vice (from the owner-scoped list,
 * including archived so a detail link never dead-ends), its relapse history, logs a
 * relapse, and edits/archives the vice. Everything goes ONLY through the DAL
 * (`useData()`) behind TanStack Query.
 *
 * Days-clean, savings, and milestone state are derived here from the pure `compute`
 * helpers (no server round-trip): days clean since the most recent relapse (or the
 * quit date), reclaimed money/time over that span, and whether today's count is a
 * milestone. When it is, a milestone-category reward quote is fetched, excluding ones
 * already shown this session so it does not repeat.
 */
function relapsesKey(viceId: string) {
  return ['relapses', viceId] as const;
}

/** Most recent relapse date at or after the quit date, or null. */
function latestRelapseDate(relapses: Relapse[]): string | null {
  if (relapses.length === 0) return null;
  return relapses.reduce<string>((max, r) => (r.relapseDate > max ? r.relapseDate : max), relapses[0].relapseDate);
}

export function useVice(viceId: string | undefined) {
  const data = useData();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const today = todayIso();
  const shownMilestoneQuotes = useRef<string[]>([]);

  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: () => data.getSession(),
    staleTime: 60_000,
  });
  const authed = Boolean(sessionQuery.data);

  // Load from the full list (incl. archived) so an archived vice still opens.
  const vicesQuery = useQuery({
    queryKey: [...vicesKey, 'all'],
    queryFn: () => data.listVices({ includeArchived: true }),
    enabled: authed,
  });
  const vice = useMemo(
    () => vicesQuery.data?.find((v) => v.id === viceId) ?? null,
    [vicesQuery.data, viceId],
  );

  const relapsesQuery = useQuery({
    queryKey: relapsesKey(viceId ?? 'none'),
    queryFn: () => data.listRelapses(viceId!),
    enabled: authed && Boolean(viceId),
  });
  const relapses = useMemo(
    () => [...(relapsesQuery.data ?? [])].sort((a, b) => b.relapseDate.localeCompare(a.relapseDate)),
    [relapsesQuery.data],
  );

  const lastRelapse = useMemo(() => latestRelapseDate(relapses), [relapses]);
  const days = vice ? daysClean(vice.quitDate, lastRelapse, today) : 0;
  const savings: Savings = vice
    ? computeSavings(vice, days)
    : { money: null, minutes: null };
  const atMilestone = isMilestone(days);
  const milestone = latestMilestone(days);

  // Milestone reward quote — fetched only on a milestone day, keyed by the milestone
  // so a new threshold pulls a fresh inscription; excludes ones shown this session.
  const milestoneQuoteQuery = useQuery({
    queryKey: ['milestone-quote', viceId, days],
    queryFn: async () => {
      const q = await data.getRewardQuote('milestone', shownMilestoneQuotes.current);
      if (!shownMilestoneQuotes.current.includes(q.id)) {
        shownMilestoneQuotes.current.push(q.id);
      }
      return q;
    },
    enabled: authed && Boolean(vice) && atMilestone,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  function invalidateVice() {
    void queryClient.invalidateQueries({ queryKey: vicesKey });
    if (viceId) void queryClient.invalidateQueries({ queryKey: relapsesKey(viceId) });
  }

  const logRelapseMutation = useMutation({
    mutationFn: (input: NewRelapseInput) => data.logRelapse(input),
    onSuccess: () => invalidateVice(),
  });

  const updateMutation = useMutation({
    mutationFn: (patch: Partial<NewViceInput>) => data.updateVice(viceId!, patch),
    onSuccess: () => invalidateVice(),
  });

  const archiveMutation = useMutation({
    mutationFn: () => data.archiveVice(viceId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vicesKey });
      navigate('/vices', { replace: true });
    },
  });

  return {
    authed,
    loading:
      sessionQuery.isLoading ||
      (authed && Boolean(viceId) && (vicesQuery.isLoading || relapsesQuery.isLoading)),
    error: sessionQuery.error ?? vicesQuery.error ?? relapsesQuery.error ?? null,
    vice,
    relapses,
    days,
    savings,
    atMilestone,
    milestone,
    milestoneQuote: milestoneQuoteQuery.data ?? null,

    logRelapse: (input: NewRelapseInput) => logRelapseMutation.mutateAsync(input),
    loggingRelapse: logRelapseMutation.isPending,
    logRelapseError: logRelapseMutation.error,
    resetLogRelapse: () => logRelapseMutation.reset(),

    updateVice: (patch: Partial<NewViceInput>) => updateMutation.mutateAsync(patch),
    updatingVice: updateMutation.isPending,
    updateViceError: updateMutation.error,
    resetUpdateVice: () => updateMutation.reset(),

    archiveVice: () => archiveMutation.mutate(),
    archivingVice: archiveMutation.isPending,
    archiveViceError: archiveMutation.error,
  };
}
