import { useEffect, useId, useRef, useState } from 'react';
import { SealButton, MeanderDivider } from '@/components/primitives';
import { cx } from '@/theme';
import type { Template } from '@/lib/domain/schemas';
import { todayIso } from './useLibrary';

/**
 * StartChallengeDialog — collects a start date, then starts the challenge. Built on
 * the native <dialog> element so focus handling and Escape-to-close come for free and
 * accessibly. Token-styled (no inline hex); the backdrop uses the `backdrop:` variant.
 */
export function StartChallengeDialog({
  template,
  onConfirm,
  onClose,
  pending,
  error,
}: {
  template: Template | null;
  onConfirm: (startDate: string) => void;
  onClose: () => void;
  pending: boolean;
  error: unknown;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const dateId = useId();
  const [startDate, setStartDate] = useState<string>(todayIso());

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (template && !el.open) {
      setStartDate(todayIso());
      el.showModal();
    } else if (!template && el.open) {
      el.close();
    }
  }, [template]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={`${dateId}-title`}
      className={cx(
        'w-[min(28rem,92vw)] rounded-plaque bg-plaster-deep p-0 text-ink',
        'shadow-xl shadow-ink/30',
        'backdrop:bg-ink/50',
      )}
    >
      {template ? (
        <form
          method="dialog"
          className="p-6 sm:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm(startDate);
          }}
        >
          <p className="font-sans text-xs uppercase tracking-[0.22em] text-ochre">
            Begin a challenge
          </p>
          <h2 id={`${dateId}-title`} className="mt-2 font-display text-2xl text-ink">
            {template.name}
          </h2>
          <MeanderDivider tone="text-ochre/60" height={12} className="my-5 max-w-[8rem]" />

          <label
            htmlFor={dateId}
            className="font-sans text-xs font-medium uppercase tracking-[0.16em] text-ink/70"
          >
            Start date (day one)
          </label>
          <input
            id={dateId}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1.5 w-full rounded-tessera border border-ink/25 bg-plaster px-3.5 py-2.5 font-serif text-base text-ink focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-egyptian"
          />
          <p className="mt-2 font-serif text-sm text-ink/60">
            A personal copy of this protocol is created. You can edit its rules later.
          </p>

          {error ? (
            <p role="alert" className="mt-4 font-sans text-sm text-pompeian-red">
              {error instanceof Error ? error.message : 'Could not start the challenge.'}
            </p>
          ) : null}

          <div className="mt-7 flex justify-end gap-3">
            <SealButton
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={pending}
            >
              Cancel
            </SealButton>
            <SealButton type="submit" loading={pending}>
              Start challenge
            </SealButton>
          </div>
        </form>
      ) : null}
    </dialog>
  );
}
