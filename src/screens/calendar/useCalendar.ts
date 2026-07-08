import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useData } from '@/app/data-context';
import type { Entry } from '@/lib/domain/schemas';
import { todayIso } from '../today/dates';
import {
  buildDayCells,
  buildMonthView,
  challengeWindow,
  computeStats,
  monthKey,
  monthsInWindow,
  type DayCell,
} from './calendarModel';

/**
 * Calendar-view data layer for one challenge. Reads and writes ONLY through the DAL
 * (`useData()`); every Supabase touch is behind TanStack Query. It loads the challenge
 * and its rules, asks the SERVER to (re)evaluate Strict resets (authoritative — the
 * client never computes them), loads the logged entries, and derives the mosaic day
 * cells + streak/completion stats via the pure `calendarModel`. Tapping a day backfills
 * its entries through `upsertEntry`, then re-evaluates resets in case the edit changed
 * the run.
 */
function entriesKey(challengeId: string) {
  return ['calendar-entries', challengeId] as const;
}
function resetsKey(challengeId: string) {
  return ['calendar-resets', challengeId] as const;
}

export function useCalendar(challengeId: string | undefined) {
  const data = useData();
  const queryClient = useQueryClient();
  const today = todayIso();

  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: () => data.getSession(),
    staleTime: 60_000,
  });
  const authed = Boolean(sessionQuery.data);

  const detailQuery = useQuery({
    queryKey: ['challenge-detail', challengeId],
    queryFn: () => data.getChallenge(challengeId!),
    enabled: authed && Boolean(challengeId),
  });
  const challenge = detailQuery.data?.challenge ?? null;
  const rules = useMemo(
    () => [...(detailQuery.data?.rules ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [detailQuery.data],
  );

  // Server-authoritative reset evaluation. This triggers the DB function and returns
  // the reset rows; the client never fabricates a reset. Idempotent, so it is safe to
  // run on mount and after a backfill.
  const resetsQuery = useQuery({
    queryKey: resetsKey(challengeId ?? 'none'),
    queryFn: () => data.evaluateResets(challengeId!, today),
    enabled: authed && Boolean(challengeId),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const resetDates = useMemo(
    () => (resetsQuery.data ?? []).map((r) => r.resetDate).sort(),
    [resetsQuery.data],
  );

  const entriesQuery = useQuery({
    queryKey: entriesKey(challengeId ?? 'none'),
    queryFn: () => data.listEntries(challengeId!, { from: challenge!.startDate, to: today }),
    enabled: authed && Boolean(challengeId) && Boolean(challenge),
  });

  const win = useMemo(
    () =>
      challenge
        ? challengeWindow(challenge.startDate, challenge.durationDays, resetDates)
        : null,
    [challenge, resetDates],
  );

  const cells = useMemo(
    () =>
      win && challenge
        ? buildDayCells(win, today, rules, entriesQuery.data ?? [], resetDates)
        : ([] as DayCell[]),
    [win, challenge, rules, entriesQuery.data, resetDates, today],
  );

  const cellsByDate = useMemo(() => {
    const map = new Map<string, DayCell>();
    for (const c of cells) map.set(c.date, c);
    return map;
  }, [cells]);

  const stats = useMemo(
    () => (win ? computeStats(cells, win, today) : null),
    [cells, win, today],
  );

  // Month navigation, defaulting to the month the user is living in (clamped to span).
  const months = useMemo(() => (win ? monthsInWindow(win) : []), [win]);
  const [monthOverride, setMonthOverride] = useState<string | null>(null);
  const defaultMonth = useMemo(() => {
    if (months.length === 0) return null;
    const wanted = monthKey(today > (win?.spanEnd ?? today) ? win!.spanEnd : today);
    if (months.includes(wanted)) return wanted;
    return today < months[0] ? months[0] : months[months.length - 1];
  }, [months, today, win]);
  const activeMonth = monthOverride && months.includes(monthOverride) ? monthOverride : defaultMonth;

  const monthView = useMemo(
    () => (activeMonth ? buildMonthView(activeMonth, cellsByDate) : null),
    [activeMonth, cellsByDate],
  );
  const monthIndex = activeMonth ? months.indexOf(activeMonth) : -1;
  const canPrev = monthIndex > 0;
  const canNext = monthIndex >= 0 && monthIndex < months.length - 1;
  const goPrev = () => canPrev && setMonthOverride(months[monthIndex - 1]);
  const goNext = () => canNext && setMonthOverride(months[monthIndex + 1]);

  // The most recent reset drives the death-screen quote card.
  const latestReset = resetDates.length > 0 ? resetDates[resetDates.length - 1] : null;

  // --- Backfill a single day's entries -------------------------------------
  const backfill = useMutation({
    mutationFn: (vars: {
      ruleId: string;
      entryDate: string;
      completed: boolean;
      value?: number | null;
      note?: string | null;
    }) =>
      data.upsertEntry({
        ruleId: vars.ruleId,
        entryDate: vars.entryDate,
        completed: vars.completed,
        value: vars.value ?? null,
        note: vars.note ?? null,
        photoPath: null,
      }),
    onSettled: () => {
      if (!challengeId) return;
      void queryClient.invalidateQueries({ queryKey: entriesKey(challengeId) });
      // A backfill can add or remove a miss, so re-ask the server for resets.
      void queryClient.invalidateQueries({ queryKey: resetsKey(challengeId) });
    },
  });

  // Entries indexed for the day-detail dialog.
  const entriesByRuleDate = useMemo(() => {
    const map = new Map<string, Entry>();
    for (const e of entriesQuery.data ?? []) map.set(`${e.ruleId}|${e.entryDate}`, e);
    return map;
  }, [entriesQuery.data]);

  function entriesForDate(date: string) {
    return rules.map((rule) => ({
      rule,
      entry: entriesByRuleDate.get(`${rule.id}|${date}`),
    }));
  }

  return {
    authed,
    loading:
      sessionQuery.isLoading ||
      (authed && Boolean(challengeId) && (detailQuery.isLoading || resetsQuery.isLoading || entriesQuery.isLoading)),
    error:
      sessionQuery.error ??
      detailQuery.error ??
      resetsQuery.error ??
      entriesQuery.error ??
      null,
    challenge,
    rules,
    win,
    stats,
    cells,
    monthView,
    canPrev,
    canNext,
    goPrev,
    goNext,
    resetDates,
    latestReset,
    entriesForDate,
    backfill: (vars: {
      ruleId: string;
      entryDate: string;
      completed: boolean;
      value?: number | null;
      note?: string | null;
    }) => backfill.mutate(vars),
    backfilling: backfill.isPending,
    // Reset reward quote (death screen), fetched lazily by the screen.
    getResetQuote: (excludeIds: string[]) => data.getRewardQuote('reset', excludeIds),
  };
}

/** Session-stable exclude list for reset quotes, so the death screen does not repeat. */
export function useShownResetQuotes() {
  return useRef<string[]>([]);
}
