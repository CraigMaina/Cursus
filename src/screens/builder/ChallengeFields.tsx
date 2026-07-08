import { type UseFormReturn } from 'react-hook-form';
import { cx } from '@/theme';
import {
  DURATION_PRESETS,
  builderStrictnessEnum,
  type BuilderFormValues,
  type BuilderStrictness,
} from './builderForms';
import { Field, controlClass, labelClass } from './fields';

/**
 * Challenge-level fields (PRD 4.1 #3): name, description, duration (free integer plus
 * preset chips), strictness, and start date. Duration and strictness use accessible
 * controls (a number input paired with quick-pick chips; a labelled radio group) so
 * keyboard and screen-reader users get the same shortcuts as pointer users.
 */

const STRICTNESS_COPY: Record<BuilderStrictness, { title: string; blurb: string }> = {
  standard: {
    title: 'Standard',
    blurb: 'A missed required rule is recorded, but your run continues.',
  },
  strict: {
    title: 'Strict',
    blurb: 'Miss any required rule and the challenge resets to day one.',
  },
};

export function ChallengeFields({ form }: { form: UseFormReturn<BuilderFormValues> }) {
  const { register, watch, setValue, formState } = form;
  const errors = formState.errors;
  const duration = watch('durationDays');
  const strictness = watch('strictness');

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
      <Field
        label="Challenge name"
        htmlFor="challenge-name"
        error={errors.name?.message}
        className="sm:col-span-6"
      >
        <input
          id="challenge-name"
          type="text"
          placeholder="My 75 days"
          className={controlClass(Boolean(errors.name))}
          aria-invalid={errors.name ? true : undefined}
          {...register('name')}
        />
      </Field>

      <Field
        label="Description"
        htmlFor="challenge-description"
        hint="Optional. What is this challenge for, and why does it matter to you?"
        error={errors.description?.message}
        className="sm:col-span-6"
      >
        <textarea
          id="challenge-description"
          rows={3}
          placeholder="A reset for the summer. No excuses."
          className={cx(controlClass(Boolean(errors.description)), 'resize-y')}
          aria-invalid={errors.description ? true : undefined}
          {...register('description')}
        />
      </Field>

      <div className="sm:col-span-3">
        <Field label="Duration (days)" htmlFor="challenge-duration" error={errors.durationDays?.message}>
          <input
            id="challenge-duration"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            className={controlClass(Boolean(errors.durationDays))}
            aria-invalid={errors.durationDays ? true : undefined}
            {...register('durationDays', { valueAsNumber: true })}
          />
        </Field>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Duration presets">
          {DURATION_PRESETS.map((preset) => {
            const active = duration === preset;
            return (
              <button
                key={preset}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setValue('durationDays', preset, { shouldValidate: true, shouldDirty: true })
                }
                className={cx(
                  'rounded-plaque px-3 py-1.5 font-sans text-xs font-medium uppercase tracking-[0.12em]',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egyptian',
                  active ? 'bg-ink text-plaster' : 'border border-ink/25 text-ink/70 hover:bg-ink/5',
                )}
              >
                {preset}
              </button>
            );
          })}
        </div>
      </div>

      <Field
        label="Start date (day one)"
        htmlFor="challenge-start"
        error={errors.startDate?.message}
        className="sm:col-span-3"
      >
        <input
          id="challenge-start"
          type="date"
          className={controlClass(Boolean(errors.startDate))}
          aria-invalid={errors.startDate ? true : undefined}
          {...register('startDate')}
        />
      </Field>

      <fieldset className="sm:col-span-6">
        <legend className={cx(labelClass, 'mb-2')}>Strictness</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {builderStrictnessEnum.options.map((value) => {
            const active = strictness === value;
            const copy = STRICTNESS_COPY[value];
            return (
              <label
                key={value}
                className={cx(
                  'flex cursor-pointer flex-col gap-1 rounded-plaque border p-4 transition-colors',
                  'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-egyptian',
                  active ? 'border-pompeian-red bg-pompeian-red/5' : 'border-ink/20 hover:bg-ink/5',
                )}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    value={value}
                    className="sr-only"
                    {...register('strictness')}
                  />
                  <span
                    aria-hidden
                    className={cx(
                      'inline-block h-3.5 w-3.5 rounded-full border',
                      active ? 'border-pompeian-red bg-pompeian-red' : 'border-ink/40',
                    )}
                  />
                  <span className="font-display text-base uppercase tracking-[0.1em] text-ink">
                    {copy.title}
                  </span>
                </span>
                <span className="pl-5 font-serif text-sm text-ink/65">{copy.blurb}</span>
              </label>
            );
          })}
        </div>
        {errors.strictness ? (
          <p role="alert" className="mt-2 font-sans text-xs text-pompeian-red">
            {errors.strictness.message}
          </p>
        ) : null}
      </fieldset>
    </div>
  );
}
