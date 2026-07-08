import { useEffect, useId, useRef } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Icon, MeanderDivider, SealButton } from '@/components/primitives';
import { cx } from '@/theme';
import type { GoalKind, NewGoalInput } from '@/lib/domain/schemas';
import { Field, controlClass } from './fields';
import { KIND_META } from './parts';
import {
  emptyGoal,
  goalFormSchema,
  toGoalDomain,
  type GoalFormValues,
} from './goalForms';

/**
 * Add a goal in a native <dialog> (accessible focus trapping and Escape-to-close come
 * free). Step one picks the kind; the form then shows only that kind's fields. Owns the
 * react-hook-form instance; on submit it maps + revalidates to `newGoalInput`.
 */
const KINDS: GoalKind[] = ['metric', 'reading', 'routine'];

export function GoalDialog({
  open,
  pending,
  error,
  onSubmit,
  onClose,
}: {
  open: boolean;
  pending: boolean;
  error: unknown;
  onSubmit: (input: NewGoalInput) => Promise<unknown>;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema) as unknown as Resolver<GoalFormValues>,
    defaultValues: emptyGoal('metric'),
    mode: 'onBlur',
  });
  const kind = form.watch('kind');
  const errors = form.formState.errors;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      form.reset(emptyGoal('metric'));
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
    // Reseed only on an open transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function submit(values: GoalFormValues) {
    await onSubmit(toGoalDomain(values));
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      className={cx(
        'w-[min(42rem,94vw)] rounded-plaque bg-plaster-deep p-0 text-ink',
        'shadow-xl shadow-ink/30 backdrop:bg-ink/50',
      )}
    >
      <form
        noValidate
        className="max-h-[86vh] overflow-y-auto p-6 sm:p-8"
        onSubmit={form.handleSubmit(submit)}
      >
        <p className="font-sans text-xs uppercase tracking-[0.22em] text-ochre">
          Set a goal to work toward
        </p>
        <h2 id={titleId} className="mt-2 font-display text-2xl text-ink sm:text-3xl">
          New goal
        </h2>
        <MeanderDivider tone="text-ochre/60" height={12} className="my-5 max-w-[10rem]" />

        <fieldset>
          <legend className="mb-2 font-sans text-xs font-medium uppercase tracking-[0.16em] text-ink/70">
            What kind of goal
          </legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {KINDS.map((k) => {
              const meta = KIND_META[k];
              const selected = kind === k;
              return (
                <label
                  key={k}
                  className={cx(
                    'cursor-pointer rounded-plaque border p-4 transition-colors',
                    'focus-within:outline focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-egyptian',
                    selected
                      ? 'border-ochre bg-plaster'
                      : 'border-ink/20 hover:border-ink/40',
                  )}
                >
                  <input
                    type="radio"
                    value={k}
                    className="sr-only"
                    {...form.register('kind')}
                  />
                  <span className={cx('inline-flex', meta.tone)}>
                    <Icon slot={meta.iconSlot} size="md" decorative />
                  </span>
                  <span className="mt-2 block font-display text-lg text-ink">{meta.label}</span>
                  <span className="mt-1 block font-serif text-sm text-ink/60">{meta.blurb}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <MeanderDivider tone="text-ink/15" height={10} className="my-6" />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
          <Field
            label="Name"
            htmlFor="goal-name"
            error={errors.name?.message}
            className="sm:col-span-6"
          >
            <input
              id="goal-name"
              type="text"
              placeholder={
                kind === 'reading'
                  ? 'Read more this year'
                  : kind === 'routine'
                    ? 'Strength routine'
                    : 'Reach my target weight'
              }
              className={controlClass(Boolean(errors.name))}
              aria-invalid={errors.name ? true : undefined}
              {...form.register('name')}
            />
          </Field>

          {kind === 'metric' ? (
            <>
              <Field
                label="Direction"
                htmlFor="goal-direction"
                hint="Whether the number should fall, rise, or hold near the target."
                className="sm:col-span-2"
              >
                <select
                  id="goal-direction"
                  className={controlClass()}
                  {...form.register('direction')}
                >
                  <option value="down">Lower is better</option>
                  <option value="up">Higher is better</option>
                  <option value="maintain">Hold steady</option>
                </select>
              </Field>
              <Field
                label="Unit"
                htmlFor="goal-unit"
                hint="e.g. kg, cm, percent"
                error={errors.unit?.message}
                className="sm:col-span-2"
              >
                <input
                  id="goal-unit"
                  type="text"
                  placeholder="kg"
                  className={controlClass(Boolean(errors.unit))}
                  {...form.register('unit')}
                />
              </Field>
              <div className="hidden sm:col-span-2 sm:block" aria-hidden="true" />
              <Field
                label="Start value"
                htmlFor="goal-start"
                hint="Optional. Where you are beginning."
                error={errors.startValue?.message}
                className="sm:col-span-3"
              >
                <input
                  id="goal-start"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  placeholder="90"
                  className={controlClass(Boolean(errors.startValue))}
                  {...form.register('startValue', { valueAsNumber: true })}
                />
              </Field>
              <Field
                label="Target value"
                htmlFor="goal-target"
                hint="Optional. What you are aiming for."
                error={errors.targetValue?.message}
                className="sm:col-span-3"
              >
                <input
                  id="goal-target"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  placeholder="80"
                  className={controlClass(Boolean(errors.targetValue))}
                  {...form.register('targetValue', { valueAsNumber: true })}
                />
              </Field>
            </>
          ) : null}

          {kind === 'reading' ? (
            <Field
              label="Target number of books"
              htmlFor="goal-count"
              hint="Optional. How many you want to finish."
              error={errors.targetCount?.message}
              className="sm:col-span-3"
            >
              <input
                id="goal-count"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                placeholder="12"
                className={controlClass(Boolean(errors.targetCount))}
                {...form.register('targetCount', { valueAsNumber: true })}
              />
            </Field>
          ) : null}

          {kind === 'routine' ? (
            <p className="sm:col-span-6 font-serif text-sm text-ink/60">
              Name the routine now. You will build its exercises and log sessions on the
              goal's own page.
            </p>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="mt-4 font-sans text-sm text-pompeian-red">
            {error instanceof Error ? error.message : 'Could not save the goal.'}
          </p>
        ) : null}

        <div className="mt-7 flex justify-end gap-3">
          <SealButton type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </SealButton>
          <SealButton type="submit" loading={pending}>
            Create goal
          </SealButton>
        </div>
      </form>
    </dialog>
  );
}
