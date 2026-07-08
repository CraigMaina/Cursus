import { useId } from 'react';
import { AppNav } from '@/app/AppNav';
import { cx } from '@/theme';
import type { GoalKind, IconSlot } from '@/lib/domain/schemas';

/**
 * Shared, token-styled pieces for the goals screens: per-kind metadata, a progress
 * meter, an accessible star rating, and the screen top bar. Kept local so the goals
 * module stays self-contained; no inline hex, palette by name only.
 */

export const KIND_META: Record<
  GoalKind,
  { label: string; iconSlot: IconSlot; tone: string; blurb: string }
> = {
  // NOTE (handoff): there is no dedicated "measurement" icon slot yet; metric reuses the
  // milestone motif (laurel / medallion, reaching a target). Request a 'measurement' slot.
  metric: {
    label: 'Measurement',
    iconSlot: 'milestone',
    tone: 'text-egyptian',
    blurb: 'A number moving toward a target, measured over time.',
  },
  reading: {
    label: 'Reading',
    iconSlot: 'reading',
    tone: 'text-ochre',
    blurb: 'Books read, counted toward a goal for the year.',
  },
  routine: {
    label: 'Routine',
    iconSlot: 'indoor_workout',
    tone: 'text-verdigris',
    blurb: 'A workout template and the sessions you log against it.',
  },
};

/** A thin plaster-set progress meter. Announced to assistive tech via role=progressbar. */
export function ProgressBar({
  pct,
  tone = 'bg-verdigris',
  label,
}: {
  pct: number;
  tone?: string;
  label: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-2.5 w-full overflow-hidden rounded-tessera bg-ink/10"
    >
      <div
        className={cx('h-full rounded-tessera transition-[width] duration-500', tone)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/** Read-only star rating for display in lists. */
export function StarDisplay({ rating }: { rating: number | null }) {
  if (rating == null) {
    return <span className="font-serif text-sm italic text-ink/40">Not rated</span>;
  }
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={`Rated ${rating} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} filled={n <= rating} />
      ))}
    </span>
  );
}

/** Accessible star input: a radiogroup of five buttons, keyboard reachable, clearable. */
export function StarRatingInput({
  value,
  onChange,
  labelId,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  labelId: string;
}) {
  const groupId = useId();
  return (
    <div role="radiogroup" aria-labelledby={labelId} className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const selected = value === n;
        return (
          <button
            key={n}
            id={`${groupId}-${n}`}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
            onClick={() => onChange(selected ? null : n)}
            className={cx(
              'rounded-tessera p-1 transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-egyptian',
              value != null && n <= value ? 'text-ochre' : 'text-ink/30 hover:text-ochre/70',
            )}
          >
            <Star filled={value != null && n <= value} size={20} />
          </button>
        );
      })}
      {value != null ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-1 font-sans text-xs uppercase tracking-[0.14em] text-ink/45 underline-offset-4 hover:text-ink hover:underline"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}

function Star({ filled, size = 16 }: { filled: boolean; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinejoin="round"
    >
      <path d="M12 3.2l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.5l6.1-.7z" />
    </svg>
  );
}

/** Inline confirm panel reused by archive/remove actions across the goals screens. */
export function ConfirmInline({
  label,
  message,
  confirmText,
  error,
  pending,
  onConfirm,
  onCancel,
}: {
  label: string;
  message: string;
  confirmText: string;
  error?: unknown;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      role="alertdialog"
      aria-label={label}
      className="mt-4 max-w-xl rounded-plaque border border-ink/20 bg-plaster-deep/70 p-4"
    >
      <p className="font-serif text-ink/80">{message}</p>
      {error ? (
        <p role="alert" className="mt-2 font-sans text-sm text-pompeian-red">
          {error instanceof Error ? error.message : 'Something went wrong.'}
        </p>
      ) : null}
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className="rounded-plaque bg-pompeian-red px-3 py-1.5 font-sans text-xs font-medium uppercase tracking-[0.12em] text-plaster disabled:opacity-60"
        >
          {pending ? 'Working' : confirmText}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-plaque border border-ink/25 px-3 py-1.5 font-sans text-xs font-medium uppercase tracking-[0.12em] text-ink disabled:opacity-60"
        >
          Keep it
        </button>
      </div>
    </div>
  );
}

export function GoalsTopBar() {
  return <AppNav maxWidth="max-w-5xl" />;
}
