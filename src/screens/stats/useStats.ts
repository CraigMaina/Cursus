import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useData } from '@/app/data-context';
import { computeChallengeStats, type ChallengeStats } from '@/lib/domain/stats';
import type { Challenge } from '@/lib/domain/schemas';
import { computeDay, todayIso } from '../today/dates';

/**
 * Stats-screen data layer for one challenge. Reads ONLY through the DAL (`useData()`),
 * every Supabase touch behind TanStack Query. It resolves the user's non-archived
 * challenges (defaulting to the active one, offering a selector when several exist),
 * loads that challenge's rules + full entry range (start..today) + Strict resets, and
 * derives the day-by-day stats via the pure `computeChallengeStats` (PRD 4.1 #9).
 * Reset evaluation stays server-authoritative; the client only reads reset rows.
 */

export interface StatsChallengeOption {
  id: string;
  name: string;
  active: boolean;
}

export function useStats() {
  const data = useData();
  const today = todayIso();

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

  // All non-archived challenges are selectable (you review finished ones too); the
  // active challenge is the default and is flagged so the selector can mark it.
  const options = useMemo<{ challenge: Challenge; active: boolean }[]>(() => {
    const list = challengesQuery.data ?? [];
    return list
      .map((challenge) => ({
        challenge,
        active:
          computeDay(challenge.startDate, challenge.durationDays, today).status ===
          'active',
      }))
      .sort((a, b) => {
        // Active first, then most recently created.
        if (a.active !== b.active) return a.active ? -1 : 1;
        return Date.parse(b.challenge.createdAt) - Date.parse(a.challenge.createdAt);
      });
  }, [challengesQuery.data, today]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    options.find((o) => o.challenge.id === selectedId) ?? options[0] ?? null;
  const challenge: Challenge | null = selected?.challenge ?? null;

  const detailQuery = useQuery({
    queryKey: ['challenge-detail', challenge?.id],
    queryFn: () => data.getChallenge(challenge!.id),
    enabled: Boolean(challenge),
  });
  const rules = useMemo(
    () => [...(detailQuery.data?.rules ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [detailQuery.data],
  );

  const entriesQuery = useQuery({
    queryKey: ['stats-entries', challenge?.id],
    queryFn: () => data.listEntries(challenge!.id, { from: challenge!.startDate, to: today }),
    enabled: Boolean(challenge),
  });

  const resetsQuery = useQuery({
    queryKey: ['stats-resets', challenge?.id],
    queryFn: () => data.listResets(challenge!.id),
    enabled: Boolean(challenge),
  });
  const resetDates = useMemo(
    () => (resetsQuery.data ?? []).map((r) => r.resetDate).sort(),
    [resetsQuery.data],
  );

  const stats: ChallengeStats | null = useMemo(() => {
    if (!challenge || !detailQuery.data || !entriesQuery.data) return null;
    return computeChallengeStats({
      startDate: challenge.startDate,
      durationDays: challenge.durationDays,
      today,
      rules,
      entries: entriesQuery.data,
    });
  }, [challenge, detailQuery.data, entriesQuery.data, rules, today]);

  const selectorItems: StatsChallengeOption[] = options.map((o) => ({
    id: o.challenge.id,
    name: o.challenge.name,
    active: o.active,
  }));

  return {
    today,
    authed,
    loading:
      sessionQuery.isLoading ||
      (authed && challengesQuery.isLoading) ||
      (Boolean(challenge) &&
        (detailQuery.isLoading || entriesQuery.isLoading || resetsQuery.isLoading)),
    error:
      sessionQuery.error ??
      challengesQuery.error ??
      detailQuery.error ??
      entriesQuery.error ??
      resetsQuery.error ??
      null,
    hasChallenges: options.length > 0,
    challenge,
    rules,
    stats,
    resetDates,
    selectorItems,
    selectedId: challenge?.id ?? null,
    selectChallenge: setSelectedId,
  };
}
