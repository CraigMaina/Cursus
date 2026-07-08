import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useData } from '@/app/data-context';
import type { Entry, Rule } from '@/lib/domain/schemas';
import { todayIso } from '../today/dates';
import { buildPhotoDays, compressImage, type PhotoDay } from './photoModel';

/**
 * Data layer for the progress-photo timeline of one challenge. Reads and writes ONLY
 * through the DAL (`useData()`), every Supabase touch behind TanStack Query. It loads
 * the challenge + rules, finds the `type:'photo'` rule, lists the logged entries over
 * the challenge window, and pairs each day with its photo entry. Uploading a day's
 * photo compresses it in the browser, ensures the day's entry exists via `upsertEntry`,
 * then stores the blob via `uploadProgressPhoto`, and refreshes the thumbnails.
 *
 * Signed URLs are fetched per-tile (see PhotoTile), lazily and never logged.
 */
function entriesKey(challengeId: string) {
  return ['photo-entries', challengeId] as const;
}

export interface PhotoRow extends PhotoDay {
  /** The photo entry for this day, if one has been logged. */
  entry: Entry | undefined;
  /** Convenience: the storage path when a photo has been uploaded. */
  photoPath: string | null;
}

export function usePhotos(challengeId: string | undefined) {
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
  const rules: Rule[] = useMemo(() => detailQuery.data?.rules ?? [], [detailQuery.data]);

  // The challenge's progress-photo rule (PRD 3 rule type 'photo'). A challenge may
  // define at most one; we take the first if several ever exist.
  const photoRule = useMemo(() => rules.find((r) => r.type === 'photo') ?? null, [rules]);

  const entriesQuery = useQuery({
    queryKey: entriesKey(challengeId ?? 'none'),
    queryFn: () => data.listEntries(challengeId!, { from: challenge!.startDate, to: today }),
    enabled: authed && Boolean(challengeId) && Boolean(challenge),
  });

  // Photo entries indexed by day, so each timeline row can find its own entry.
  const entryByDate = useMemo(() => {
    const map = new Map<string, Entry>();
    if (!photoRule) return map;
    for (const e of entriesQuery.data ?? []) {
      if (e.ruleId === photoRule.id) map.set(e.entryDate, e);
    }
    return map;
  }, [entriesQuery.data, photoRule]);

  const rows: PhotoRow[] = useMemo(() => {
    if (!challenge) return [];
    return buildPhotoDays(challenge.startDate, challenge.durationDays, today).map((d) => {
      const entry = entryByDate.get(d.date);
      return { ...d, entry, photoPath: entry?.photoPath ?? null };
    });
  }, [challenge, today, entryByDate]);

  const filledCount = useMemo(() => rows.filter((r) => r.photoPath).length, [rows]);

  // --- Upload / replace a day's photo --------------------------------------
  // Compress in the browser, ensure the day's entry exists (preserving any current
  // photoPath so a failed upload never wipes an existing photo), then store the blob.
  const upload = useMutation({
    mutationFn: async (vars: { date: string; file: File }) => {
      if (!photoRule) throw new Error('This challenge has no progress-photo rule.');
      const blob = await compressImage(vars.file);
      const existing = entryByDate.get(vars.date);
      const entry = await data.upsertEntry({
        ruleId: photoRule.id,
        entryDate: vars.date,
        completed: true,
        value: existing?.value ?? null,
        note: existing?.note ?? null,
        photoPath: existing?.photoPath ?? null,
      });
      await data.uploadProgressPhoto(entry.id, blob);
    },
    onSettled: () => {
      if (!challengeId) return;
      void queryClient.invalidateQueries({ queryKey: entriesKey(challengeId) });
    },
  });

  return {
    authed,
    loading:
      sessionQuery.isLoading ||
      (authed &&
        Boolean(challengeId) &&
        (detailQuery.isLoading || entriesQuery.isLoading)),
    error: sessionQuery.error ?? detailQuery.error ?? entriesQuery.error ?? null,
    challenge,
    photoRule,
    rows,
    filledCount,
    // Which day is currently uploading, for a per-tile working state.
    uploadingDate: upload.isPending ? (upload.variables?.date ?? null) : null,
    uploadError: upload.error,
    uploadPhoto: (date: string, file: File) => upload.mutate({ date, file }),
    getSignedUrl: (path: string) => data.getSignedPhotoUrl(path),
  };
}
