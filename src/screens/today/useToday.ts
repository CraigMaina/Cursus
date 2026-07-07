import { useMemo, useRef, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useData } from '@/app/data-context';
import type { Challenge, Entry, Rule } from '@/lib/domain/schemas';
import { computeDay, todayIso, type DayPosition } from './dates';

/**
 * Today-view data layer. Reads/writes ONLY through the DAL (`useData()`); every
 * Supabase touch is behind TanStack Query. It resolves the user's active challenge(s),
 * loads today's entries, commits rule completions optimistically (so the wax-seal
 * stamp feels instant), and, once every required daily rule is sealed, fetches a
 * `daily` reward quote — excluding ones already shown this session.
 */

export interface RuleView {
  rule: Rule;
  entry: Entry | undefined;
  completed: boolean;
  value: number | null;
}

export interface CommitPatch {
  completed?: boolean;
  value?: number | null;
  note?: string | null;
  photoPath?: string | null;
}

function entriesKey(challengeId: string, date: string) {
  return ['today-entries', challengeId, date] as const;
}

export function useToday() {
  const data = useData();
  const queryClient = useQueryClient();
  const today = todayIso();

  // --- Who is here, and what are they running? ------------------------------
  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: () => data.getSession(),
    staleTime: 60_000,
  });
  const authed = Boolean(sessionQuery.data);

  const challengesQuery = useQuery({
    queryKey: ['challenges'],
    queryFn: () => data.listChallenges(),
    enabled: authed,
  });

  const active = useMemo(() => {
    const list = challengesQuery.data ?? [];
    return list
      .map((challenge) => ({
        challenge,
        pos: computeDay(challenge.startDate, challenge.durationDays, today),
      }))
      .filter((c) => c.pos.status === 'active')
      .sort(
        (a, b) =>
          Date.parse(b.challenge.createdAt) - Date.parse(a.challenge.createdAt),
      );
  }, [challengesQuery.data, today]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    active.find((c) => c.challenge.id === selectedId) ?? active[0] ?? null;
  const challenge: Challenge | null = selected?.challenge ?? null;
  const position: DayPosition | null = selected?.pos ?? null;

  // --- Rules + today's entries for the selected challenge -------------------
  const detailQuery = useQuery({
    queryKey: ['challenge-detail', challenge?.id],
    queryFn: () => data.getChallenge(challenge!.id),
    enabled: Boolean(challenge),
  });

  const entriesQuery = useQuery({
    queryKey: challenge ? entriesKey(challenge.id, today) : ['today-entries', 'none'],
    queryFn: () => data.listEntries(challenge!.id, { from: today, to: today }),
    enabled: Boolean(challenge),
  });

  const rules = useMemo(
    () => [...(detailQuery.data?.rules ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [detailQuery.data],
  );

  const entryByRule = useMemo(() => {
    const map = new Map<string, Entry>();
    for (const e of entriesQuery.data ?? []) map.set(e.ruleId, e);
    return map;
  }, [entriesQuery.data]);

  const ruleViews: RuleView[] = useMemo(
    () =>
      rules.map((rule) => {
        const entry = entryByRule.get(rule.id);
        return {
          rule,
          entry,
          completed: entry?.completed ?? false,
          value: entry?.value ?? null,
        };
      }),
    [rules, entryByRule],
  );

  // --- Commit a rule's entry (optimistic; keyed by ruleId + today) ----------
  const commitMutation = useMutation({
    mutationFn: (vars: { ruleId: string; patch: CommitPatch }) => {
      const existing = entryByRule.get(vars.ruleId);
      return data.upsertEntry({
        ruleId: vars.ruleId,
        entryDate: today,
        completed: vars.patch.completed ?? existing?.completed ?? false,
        value: vars.patch.value ?? existing?.value ?? null,
        note: vars.patch.note ?? existing?.note ?? null,
        photoPath: vars.patch.photoPath ?? existing?.photoPath ?? null,
      });
    },
    onMutate: async (vars) => {
      if (!challenge) return;
      const key = entriesKey(challenge.id, today);
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<Entry[]>(key) ?? [];
      const existing = prev.find((e) => e.ruleId === vars.ruleId);
      const optimistic: Entry = {
        id: existing?.id ?? `optimistic-${vars.ruleId}`,
        userId: existing?.userId ?? 'optimistic',
        ruleId: vars.ruleId,
        entryDate: today,
        completed: vars.patch.completed ?? existing?.completed ?? false,
        value: vars.patch.value ?? existing?.value ?? null,
        note: vars.patch.note ?? existing?.note ?? null,
        photoPath: vars.patch.photoPath ?? existing?.photoPath ?? null,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };
      const next = existing
        ? prev.map((e) => (e.ruleId === vars.ruleId ? optimistic : e))
        : [...prev, optimistic];
      queryClient.setQueryData<Entry[]>(key, next);
      return { key, prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx) queryClient.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: () => {
      if (challenge) {
        void queryClient.invalidateQueries({
          queryKey: entriesKey(challenge.id, today),
        });
      }
    },
  });

  function commit(ruleId: string, patch: CommitPatch) {
    commitMutation.mutate({ ruleId, patch });
  }

  // --- Day completion + reward quote ----------------------------------------
  const requiredDaily = ruleViews.filter(
    (rv) => rv.rule.isRequired && rv.rule.frequency === 'daily',
  );
  const dayComplete =
    requiredDaily.length > 0 && requiredDaily.every((rv) => rv.completed);

  // Session-scoped memory of shown quotes, so the reward does not repeat.
  const shownQuoteIds = useRef<string[]>([]);
  const quoteQuery = useQuery({
    queryKey: ['reward-daily', challenge?.id, today, dayComplete],
    queryFn: async () => {
      const q = await data.getRewardQuote('daily', shownQuoteIds.current);
      if (!shownQuoteIds.current.includes(q.id)) shownQuoteIds.current.push(q.id);
      return q;
    },
    enabled: Boolean(challenge) && dayComplete,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  return {
    today,
    authed,
    loading:
      sessionQuery.isLoading ||
      (authed && challengesQuery.isLoading) ||
      (Boolean(challenge) && (detailQuery.isLoading || entriesQuery.isLoading)),
    error:
      sessionQuery.error ??
      challengesQuery.error ??
      detailQuery.error ??
      entriesQuery.error ??
      null,
    activeChallenges: active,
    challenge,
    position,
    selectChallenge: setSelectedId,
    ruleViews,
    commit,
    committing: commitMutation.isPending,
    commitError: commitMutation.error,
    dayComplete,
    quote: quoteQuery.data ?? null,
    quoteLoading: quoteQuery.isLoading,
  };
}
