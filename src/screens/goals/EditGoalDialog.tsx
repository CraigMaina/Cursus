import { useEffect, useId, useRef } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MeanderDivider, SealButton } from '@/components/primitives';
import { cx } from '@/theme';
import type { Goal, NewGoalInput } from '@/lib/domain/schemas';
import { Field, controlClass } from './fields';
import {
  goalFormSchema,
  goalToFormValues,
  toGoalDomain,
  type GoalFormValues,
} from './goalForms';

/**
 * Edit a goal's editable fields in a native <dialog>. The kind is fixed once created, so
 * only that kind's fields plus the name are shown. Maps back through `newGoalInput` for a
 * validated patch. Reused by all three kinds; the metric block carries target/unit/
 * direction, reading carries the target count, routine carries only the name.
 */
export function EditGoalDialog({
  open,
  goal,
  pending,
  error,
  onSubmit,
  onClose,
}: {
  open: boolean;
  goal: Goal;
  pending: boolean;
  error: unknown;
  onSubmit: (patch: Partial<NewGoalInput>) => Promise<unknown>;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema) as unknown as Resolver<GoalFormValues>,
    defaultValues: goalToFormValues(goal),
    mode: 'onBlur',
  });
  const errors = form.formState.errors;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      form.reset(goalToFormValues(goal));
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
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
        'w-[min(40rem,94vw)] rounded-plaque bg-plaster-deep p-0 text-ink',
        'shadow-xl shadow-ink/30 backdrop:bg-ink/50',
      )}
    >
      <form
        noValidate
        className="max-h-[86vh] overflow-y-auto p-6 sm:p-8"
        onSubmit={form.handleSubmit(submit)}
      >
        <p className="font-sans text-xs uppercase tracking-[0.22em] text-ochre">
          Revise this goal
        </p>
        <h2 id={titleId} className="mt-2 font-display text-2xl text-ink sm:text-3xl">
          Edit goal
        </h2>
        <MeanderDivider tone="text-ochre/60" height={12} className="my-5 max-w-[10rem]" />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
          <Field
            label="Name"
            htmlFor="edit-goal-name"
            error={errors.name?.message}
            className="sm:col-span-6"
          >
            <input
              id="edit-goal-name"
              type="text"
              className={controlClass(Boolean(errors.name))}
              aria-invalid={errors.name ? true : undefined}
              {...form.register('name')}
            />
          </Field>

          {goal.kind === 'metric' ? (
            <>
              <Field label="Direction" htmlFor="edit-goal-direction" className="sm:col-span-2">
                <select
                  id="edit-goal-direction"
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
                htmlFor="edit-goal-unit"
                error={errors.unit?.message}
                className="sm:col-span-2"
              >
                <input
                  id="edit-goal-unit"
                  type="text"
                  className={controlClass(Boolean(errors.unit))}
                  {...form.register('unit')}
                />
              </Field>
              <Field
                label="Start value"
                htmlFor="edit-goal-start"
                error={errors.startValue?.message}
                className="sm:col-span-3"
              >
                <input
                  id="edit-goal-start"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  className={controlClass(Boolean(errors.startValue))}
                  {...form.register('startValue', { valueAsNumber: true })}
                />
              </Field>
              <Field
                label="Target value"
                htmlFor="edit-goal-target"
                error={errors.targetValue?.message}
                className="sm:col-span-3"
              >
                <input
                  id="edit-goal-target"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  className={controlClass(Boolean(errors.targetValue))}
                  {...form.register('targetValue', { valueAsNumber: true })}
                />
              </Field>
            </>
          ) : null}

          {goal.kind === 'reading' ? (
            <Field
              label="Target number of books"
              htmlFor="edit-goal-count"
              error={errors.targetCount?.message}
              className="sm:col-span-3"
            >
              <input
                id="edit-goal-count"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                className={controlClass(Boolean(errors.targetCount))}
                {...form.register('targetCount', { valueAsNumber: true })}
              />
            </Field>
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
            Save changes
          </SealButton>
        </div>
      </form>
    </dialog>
  );
}
