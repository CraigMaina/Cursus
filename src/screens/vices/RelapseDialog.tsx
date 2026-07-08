import { useEffect, useId, useRef, useState } from 'react';
import { MeanderDivider, SealButton } from '@/components/primitives';
import { cx } from '@/theme';
import type { NewRelapseInput } from '@/lib/domain/schemas';
import { controlClass } from './fields';
import { todayIso } from '../today/dates';

/**
 * RelapseDialog — records a relapse for a vice (PRD 4.1 #6). Logging resets the
 * days-clean count (the counter re-anchors on this date) but KEEPS the history: every
 * relapse stays on the timeline. Built on the native <dialog> for accessible focus and
 * Escape handling. The copy is plain and non-punitive; falling is part of the course.
 */
export function RelapseDialog({
  open,
  viceId,
  viceName,
  pending,
  error,
  onSubmit,
  onClose,
}: {
  open: boolean;
  viceId: string;
  viceName: string;
  pending: boolean;
  error: unknown;
  onSubmit: (input: NewRelapseInput) => Promise<unknown>;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const dateId = useId();
  const noteId = useId();
  const [relapseDate, setRelapseDate] = useState(todayIso());
  const [note, setNote] = useState('');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      setRelapseDate(todayIso());
      setNote('');
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      viceId,
      relapseDate,
      note: note.trim().length > 0 ? note.trim() : null,
    });
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      className={cx(
        'w-[min(30rem,94vw)] rounded-plaque bg-plaster-deep p-0 text-ink',
        'shadow-xl shadow-ink/30',
        'backdrop:bg-ink/50',
      )}
    >
      <form noValidate className="p-6 sm:p-8" onSubmit={submit}>
        <p className="font-sans text-xs uppercase tracking-[0.22em] text-pompeian-red">
          Record a relapse
        </p>
        <h2 id={titleId} className="mt-2 font-display text-2xl text-ink">
          {viceName}
        </h2>
        <MeanderDivider tone="text-pompeian-red/50" height={12} className="my-5 max-w-[8rem]" />

        <p className="mb-5 font-serif text-sm text-ink/65">
          The count returns to zero from this date. Every clean day you logged before it
          stays on the record. This is a setback, not a verdict.
        </p>

        <label htmlFor={dateId} className="font-sans text-xs font-medium uppercase tracking-[0.16em] text-ink/70">
          Date
        </label>
        <input
          id={dateId}
          type="date"
          value={relapseDate}
          max={todayIso()}
          onChange={(e) => setRelapseDate(e.target.value)}
          className={cx(controlClass(), 'mt-1.5')}
        />

        <label
          htmlFor={noteId}
          className="mt-5 block font-sans text-xs font-medium uppercase tracking-[0.16em] text-ink/70"
        >
          Note
        </label>
        <textarea
          id={noteId}
          rows={3}
          value={note}
          placeholder="Optional. What happened, and what you will do differently."
          onChange={(e) => setNote(e.target.value)}
          className={cx(controlClass(), 'mt-1.5 resize-y')}
        />

        {error ? (
          <p role="alert" className="mt-4 font-sans text-sm text-pompeian-red">
            {error instanceof Error ? error.message : 'Could not record the relapse.'}
          </p>
        ) : null}

        <div className="mt-7 flex justify-end gap-3">
          <SealButton type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </SealButton>
          <SealButton type="submit" loading={pending}>
            Record relapse
          </SealButton>
        </div>
      </form>
    </dialog>
  );
}
