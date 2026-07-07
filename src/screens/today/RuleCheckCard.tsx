import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plaque, Icon } from '@/components/primitives';
import { cx } from '@/theme';
import type { RuleView, CommitPatch } from './useToday';
import { WaxSeal } from './WaxSeal';

/**
 * RuleCheckCard — one Rule as a fresco check card (PRD 4.1 #4). Renders the rule's
 * icon slot, its name, and the correct input for its type (tap for boolean, a
 * stepper + field for quantity, a minutes field for duration, an upload placeholder
 * for photo). Completion is a wax-seal stamp. Every write goes up through `onCommit`,
 * which the parent persists via the DAL.
 */
export function RuleCheckCard({
  view,
  onCommit,
  disabled = false,
}: {
  view: RuleView;
  onCommit: (patch: CommitPatch) => void;
  disabled?: boolean;
}) {
  const { rule, completed, value } = view;
  const numericStep =
    rule.type === 'duration' ? 5 : rule.unit && /l/i.test(rule.unit) ? 0.5 : 1;

  // Local draft of the logged value; the parent (query cache) is the source of truth.
  const [draft, setDraft] = useState<string>(value != null ? String(value) : '');
  useEffect(() => {
    setDraft(value != null ? String(value) : '');
  }, [value]);

  const round = (n: number) => Math.round(n * 10) / 10;
  const currentNum = draft === '' ? 0 : Number(draft) || 0;
  const goalMet =
    rule.targetValue != null && currentNum >= rule.targetValue && rule.targetValue > 0;

  function persistValue(next: number) {
    const clamped = Math.max(0, round(next));
    setDraft(String(clamped));
    onCommit({ value: clamped });
  }

  function toggleComplete(nextValue?: number | null) {
    onCommit({
      completed: !completed,
      ...(nextValue !== undefined ? { value: nextValue } : {}),
    });
  }

  return (
    <Plaque
      as="article"
      className={cx('transition-opacity', completed && 'ring-1 ring-pompeian-red/30')}
    >
      <div className="flex items-start gap-4 sm:gap-5">
        <span
          className={cx(
            'mt-0.5 shrink-0 rounded-tessera bg-plaster/70 p-2',
            completed ? 'text-pompeian-red' : 'text-ink/70',
          )}
        >
          <Icon slot={rule.iconSlot} size="lg" decorative />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="font-serif text-lg leading-tight text-ink">{rule.name}</h3>
            {!rule.isRequired ? (
              <span className="font-sans text-[0.65rem] uppercase tracking-[0.16em] text-verdigris">
                Optional
              </span>
            ) : null}
          </div>

          <RuleInput
            view={view}
            draft={draft}
            setDraft={setDraft}
            persistValue={persistValue}
            step={numericStep}
            disabled={disabled || completed}
            goalMet={goalMet}
            onPhotoChosen={(name) =>
              onCommit({ completed: true, note: `Photo: ${name}` })
            }
          />
        </div>

        <div className="flex shrink-0 flex-col items-center gap-2">
          <AnimatePresence initial={false}>
            {completed ? <WaxSeal key="seal" /> : null}
          </AnimatePresence>
          {rule.type === 'photo' && !completed ? null : (
            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                toggleComplete(
                  rule.type === 'quantity' || rule.type === 'duration'
                    ? currentNum
                    : undefined,
                )
              }
              aria-pressed={completed}
              className={cx(
                'rounded-plaque px-3 py-1.5 font-sans text-xs font-medium uppercase tracking-[0.12em]',
                'transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egyptian',
                'disabled:cursor-not-allowed disabled:opacity-60',
                completed
                  ? 'border border-ink/25 bg-transparent text-ink hover:bg-ink/5'
                  : goalMet
                    ? 'bg-pompeian-red text-plaster shadow-sm shadow-ink/25'
                    : 'bg-ochre text-ink shadow-sm shadow-ink/20 hover:bg-ochre/90',
              )}
            >
              {completed ? 'Undo' : 'Mark done'}
            </button>
          )}
        </div>
      </div>
    </Plaque>
  );
}

/** The type-specific control that sits under the rule name. */
function RuleInput({
  view,
  draft,
  setDraft,
  persistValue,
  step,
  disabled,
  goalMet,
  onPhotoChosen,
}: {
  view: RuleView;
  draft: string;
  setDraft: (v: string) => void;
  persistValue: (n: number) => void;
  step: number;
  disabled: boolean;
  goalMet: boolean;
  onPhotoChosen: (fileName: string) => void;
}) {
  const { rule, completed } = view;
  const fieldId = useId();
  const fileRef = useRef<HTMLInputElement>(null);

  if (rule.type === 'boolean') {
    return (
      <p className="mt-1 font-sans text-sm text-ink/55">
        {completed ? 'Marked done for today.' : 'A daily yes or no. Tap Mark done when it is true.'}
      </p>
    );
  }

  if (rule.type === 'photo') {
    return (
      <div className="mt-2">
        <input
          ref={fileRef}
          id={fieldId}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={disabled}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) onPhotoChosen(file.name);
          }}
        />
        <label
          htmlFor={fieldId}
          className={cx(
            'inline-flex cursor-pointer items-center gap-2 rounded-plaque border border-dashed border-ink/30 px-4 py-2',
            'font-sans text-xs font-medium uppercase tracking-[0.12em] text-ink/70',
            'hover:bg-ink/5 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-egyptian',
            disabled && 'pointer-events-none opacity-60',
          )}
        >
          <Icon slot="photo" size="sm" decorative />
          {completed ? 'Photo added' : 'Add progress photo'}
        </label>
        <p className="mt-1 font-sans text-[0.7rem] text-ink/45">
          Upload placeholder. Storage upload arrives with the photo timeline.
        </p>
      </div>
    );
  }

  // quantity | duration — stepper + numeric field.
  const unitLabel = rule.type === 'duration' ? (rule.unit ?? 'min') : rule.unit ?? '';
  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${rule.name}`}
          disabled={disabled}
          onClick={() => persistValue((Number(draft) || 0) - step)}
          className="h-9 w-9 rounded-tessera border border-ink/25 font-sans text-lg leading-none text-ink hover:bg-ink/5 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-egyptian"
        >
          &minus;
        </button>
        <div className="flex items-baseline gap-1.5">
          <input
            id={fieldId}
            type="number"
            inputMode="decimal"
            min={0}
            step={step}
            value={draft}
            disabled={disabled}
            aria-label={`${rule.name}${unitLabel ? ` in ${unitLabel}` : ''}`}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => persistValue(Number(e.target.value) || 0)}
            className="w-20 rounded-tessera border border-ink/25 bg-plaster px-2.5 py-1.5 text-center font-display text-lg tabular-nums text-ink focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-egyptian disabled:opacity-70"
          />
          {unitLabel ? (
            <span className="font-sans text-sm text-ink/60">{unitLabel}</span>
          ) : null}
        </div>
        <button
          type="button"
          aria-label={`Increase ${rule.name}`}
          disabled={disabled}
          onClick={() => persistValue((Number(draft) || 0) + step)}
          className="h-9 w-9 rounded-tessera border border-ink/25 font-sans text-lg leading-none text-ink hover:bg-ink/5 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-egyptian"
        >
          +
        </button>
      </div>
      {rule.targetValue != null ? (
        <p
          className={cx(
            'mt-1.5 font-sans text-xs',
            goalMet ? 'text-pompeian-red' : 'text-ink/55',
          )}
        >
          {goalMet
            ? 'Goal met. Seal it with Mark done.'
            : `Goal: ${rule.targetValue}${unitLabel ? ` ${unitLabel}` : ''}`}
        </p>
      ) : null}
    </div>
  );
}
