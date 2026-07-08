import { useEffect, useState } from 'react';
import { MeanderDivider, Icon } from '@/components/primitives';
import { cx } from '@/theme';
import type { Entry, Rule } from '@/lib/domain/schemas';
import { formatLongDate } from '../today/dates';

/**
 * Tap-to-backfill dialog for one calendar day (PRD 4.1 #5). Shows every rule with its
 * recorded state for the chosen date and lets the user set or clear it. Writes go
 * through the parent's `onBackfill` (the DAL `upsertEntry`); this component never
 * touches Supabase. A plain overlay (not a native <dialog>) so it stays predictable.
 */
export function DayDetail({
  date,
  rows,
  busy,
  onBackfill,
  onClose,
}: {
  date: string;
  rows: { rule: Rule; entry: Entry | undefined }[];
  busy: boolean;
  onBackfill: (vars: {
    ruleId: string;
    entryDate: string;
    completed: boolean;
    value?: number | null;
    note?: string | null;
  }) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${formatLongDate(date)}`}
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-plaque border border-ink/15 bg-plaster p-6 shadow-lg shadow-ink/20 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-sans text-xs uppercase tracking-[0.28em] text-ochre">Backfill</p>
        <h2 className="mt-1 font-display text-2xl text-ink">{formatLongDate(date)}</h2>
        <MeanderDivider tone="text-ochre/60" height={12} className="my-5 max-w-[10rem]" />

        <ul className="flex flex-col gap-3">
          {rows.map(({ rule, entry }) => (
            <li key={rule.id}>
              <BackfillRow
                rule={rule}
                entry={entry}
                busy={busy}
                onSet={(completed, value) =>
                  onBackfill({ ruleId: rule.id, entryDate: date, completed, value })
                }
              />
            </li>
          ))}
        </ul>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={cx(
              'rounded-plaque border border-ink/25 px-5 py-2 font-sans text-xs font-medium uppercase tracking-[0.16em] text-ink/80',
              'transition-colors hover:bg-ink/5',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egyptian',
            )}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function BackfillRow({
  rule,
  entry,
  busy,
  onSet,
}: {
  rule: Rule;
  entry: Entry | undefined;
  busy: boolean;
  onSet: (completed: boolean, value: number | null) => void;
}) {
  const completed = entry?.completed ?? false;
  const hasValue = rule.type === 'quantity' || rule.type === 'duration';
  const [value, setValue] = useState<string>(
    entry?.value != null ? String(entry.value) : '',
  );

  return (
    <div className="flex items-center gap-3 rounded-plaque border border-ink/12 bg-plaster-deep/50 px-3 py-3">
      <Icon slot={rule.iconSlot} className="h-5 w-5 shrink-0 text-ink/70" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-ink">
          {rule.name}
          {rule.isRequired ? null : (
            <span className="ml-2 font-sans text-[0.6rem] uppercase tracking-[0.12em] text-ink/40">
              optional
            </span>
          )}
        </p>
        {hasValue ? (
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-label={`${rule.name} value`}
              className="w-24 rounded-tessera border border-ink/20 bg-plaster px-2 py-1 font-sans text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-egyptian"
            />
            {rule.unit ? (
              <span className="font-sans text-xs text-ink/50">{rule.unit}</span>
            ) : null}
            {rule.targetValue != null ? (
              <span className="font-sans text-[0.65rem] text-ink/40">
                goal {rule.targetValue}
                {rule.unit ? ` ${rule.unit}` : ''}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      {completed ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => onSet(false, null)}
          className="rounded-plaque border border-ink/25 px-3 py-1.5 font-sans text-[0.65rem] font-medium uppercase tracking-[0.14em] text-ink/70 transition-colors hover:bg-ink/5 disabled:opacity-50"
        >
          Clear
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => onSet(true, hasValue && value !== '' ? Number(value) : null)}
          className="rounded-plaque bg-pompeian-red px-3 py-1.5 font-sans text-[0.65rem] font-medium uppercase tracking-[0.14em] text-plaster transition-colors hover:bg-pompeian-red/90 disabled:opacity-50"
        >
          Mark done
        </button>
      )}
    </div>
  );
}
