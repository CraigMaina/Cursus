import { useState } from 'react';
import type { WorkoutSession } from '@/lib/domain/schemas';
import { formatLongDate } from '../today/dates';
import { useWorkoutSets } from './useRoutine';
import { groupSetsByExercise, formatValue } from './goalModel';
import { ConfirmInline } from './parts';

/**
 * Logged-session history for a routine goal (D16). Each session is a row that expands to
 * its recorded sets, grouped by exercise. Set detail is fetched LAZILY (only when a row
 * is opened) via `useWorkoutSets`, so the list stays cheap. A session can be removed.
 * Reads/writes ONLY through the DAL (hooks -> `useData`).
 */
export function SessionHistory({
  sessions,
  deleting,
  onDelete,
}: {
  sessions: WorkoutSession[];
  deleting: boolean;
  onDelete: (sessionId: string) => void;
}) {
  if (sessions.length === 0) {
    return (
      <p className="font-serif text-ink/60">
        No sessions logged yet. Log one to build your history.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-ink/10 rounded-plaque border border-ink/15 bg-plaster-deep/50">
      {sessions.map((s) => (
        <SessionRow key={s.id} session={s} deleting={deleting} onDelete={onDelete} />
      ))}
    </ul>
  );
}

function SessionRow({
  session,
  deleting,
  onDelete,
}: {
  session: WorkoutSession;
  deleting: boolean;
  onDelete: (sessionId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const setsQuery = useWorkoutSets(session.id, open);
  const groups = groupSetsByExercise(setsQuery.data ?? []);

  return (
    <li className="px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="min-w-0 text-left"
        >
          <p className="font-display text-lg text-ink">{formatLongDate(session.sessionDate)}</p>
          {session.note ? (
            <p className="font-serif text-sm text-ink/60">{session.note}</p>
          ) : null}
          <span className="font-sans text-xs uppercase tracking-[0.14em] text-ochre">
            {open ? 'Hide sets' : 'Show sets'}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="shrink-0 font-sans text-xs uppercase tracking-[0.14em] text-ink/45 underline-offset-4 hover:text-pompeian-red hover:underline"
        >
          Remove
        </button>
      </div>

      {open ? (
        <div className="mt-3">
          {setsQuery.isLoading ? (
            <p className="font-serif text-sm text-ink/50">Reading the sets.</p>
          ) : groups.length === 0 ? (
            <p className="font-serif text-sm text-ink/50">No sets recorded for this session.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {groups.map((g) => (
                <div key={g.name}>
                  <p className="font-sans text-xs uppercase tracking-[0.16em] text-ink/55">
                    {g.name}
                  </p>
                  <ul className="mt-1 flex flex-wrap gap-2">
                    {g.sets.map((set) => (
                      <li
                        key={set.id}
                        className="rounded-tessera border border-ink/15 bg-plaster px-2.5 py-1 font-serif text-sm text-ink"
                      >
                        {set.reps ?? '-'}
                        <span aria-hidden="true" className="text-ink/40"> x </span>
                        {set.weight != null ? `${formatValue(set.weight)}` : '-'}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {confirm ? (
        <ConfirmInline
          label="Confirm remove session"
          message={`Remove the session from ${formatLongDate(session.sessionDate)}?`}
          confirmText="Remove it"
          pending={deleting}
          onConfirm={() => {
            onDelete(session.id);
            setConfirm(false);
          }}
          onCancel={() => setConfirm(false)}
        />
      ) : null}
    </li>
  );
}
