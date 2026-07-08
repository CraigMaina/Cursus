import { type UseFormReturn } from 'react-hook-form';
import { cx } from '@/theme';
import { Field, controlClass } from './fields';
import { type ViceFormValues } from './viceForms';

/**
 * Vice fields (PRD 4.1 #6): name and quit date, the optional reason and triggers, and
 * the savings rate figures (unit label, cost per unit, time per unit, units per day).
 * The rate figures are optional; a savings dimension only appears on the detail screen
 * once its inputs are present. Parent owns the react-hook-form instance and submit.
 */
export function ViceForm({ form }: { form: UseFormReturn<ViceFormValues> }) {
  const { register, formState } = form;
  const errors = formState.errors;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
      <Field
        label="Vice"
        htmlFor="vice-name"
        error={errors.name?.message}
        className="sm:col-span-4"
      >
        <input
          id="vice-name"
          type="text"
          placeholder="Cigarettes"
          className={controlClass(Boolean(errors.name))}
          aria-invalid={errors.name ? true : undefined}
          {...register('name')}
        />
      </Field>

      <Field
        label="Quit date"
        htmlFor="vice-quit-date"
        error={errors.quitDate?.message}
        className="sm:col-span-2"
      >
        <input
          id="vice-quit-date"
          type="date"
          className={controlClass(Boolean(errors.quitDate))}
          aria-invalid={errors.quitDate ? true : undefined}
          {...register('quitDate')}
        />
      </Field>

      <Field
        label="Reason"
        htmlFor="vice-reason"
        hint="Optional. Why you are leaving it behind. Worth reading on a hard day."
        error={errors.reason?.message}
        className="sm:col-span-6"
      >
        <textarea
          id="vice-reason"
          rows={2}
          placeholder="To breathe easier and stop paying for it."
          className={cx(controlClass(Boolean(errors.reason)), 'resize-y')}
          aria-invalid={errors.reason ? true : undefined}
          {...register('reason')}
        />
      </Field>

      <Field
        label="Triggers"
        htmlFor="vice-triggers"
        hint="Optional. The situations that tempt you, so you can plan around them."
        error={errors.triggers?.message}
        className="sm:col-span-6"
      >
        <textarea
          id="vice-triggers"
          rows={2}
          placeholder="Stress, late nights, the first coffee."
          className={cx(controlClass(Boolean(errors.triggers)), 'resize-y')}
          aria-invalid={errors.triggers ? true : undefined}
          {...register('triggers')}
        />
      </Field>

      <fieldset className="sm:col-span-6">
        <legend className="mb-1 font-sans text-xs font-medium uppercase tracking-[0.16em] text-ink/70">
          What you reclaim
        </legend>
        <p className="mb-4 font-serif text-sm text-ink/55">
          Optional. Fill these in to see the money and time you save as the days add up.
          Reclaimed money needs a unit cost and a daily amount; reclaimed time needs a
          unit time and a daily amount.
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
          <Field
            label="Unit"
            htmlFor="vice-unit-label"
            hint="e.g. cigarette, drink, hour"
            error={errors.unitLabel?.message}
            className="sm:col-span-3"
          >
            <input
              id="vice-unit-label"
              type="text"
              placeholder="cigarette"
              className={controlClass(Boolean(errors.unitLabel))}
              aria-invalid={errors.unitLabel ? true : undefined}
              {...register('unitLabel')}
            />
          </Field>

          <Field
            label="Units per day avoided"
            htmlFor="vice-daily-units"
            error={errors.dailyUnits?.message}
            className="sm:col-span-3"
          >
            <input
              id="vice-daily-units"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              placeholder="10"
              className={controlClass(Boolean(errors.dailyUnits))}
              aria-invalid={errors.dailyUnits ? true : undefined}
              {...register('dailyUnits', { valueAsNumber: true })}
            />
          </Field>

          <Field
            label="Cost per unit"
            htmlFor="vice-cost-per-unit"
            hint="In your own currency."
            error={errors.costPerUnit?.message}
            className="sm:col-span-3"
          >
            <input
              id="vice-cost-per-unit"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              placeholder="0.50"
              className={controlClass(Boolean(errors.costPerUnit))}
              aria-invalid={errors.costPerUnit ? true : undefined}
              {...register('costPerUnit', { valueAsNumber: true })}
            />
          </Field>

          <Field
            label="Minutes per unit"
            htmlFor="vice-time-per-unit"
            error={errors.timePerUnitMinutes?.message}
            className="sm:col-span-3"
          >
            <input
              id="vice-time-per-unit"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              placeholder="6"
              className={controlClass(Boolean(errors.timePerUnitMinutes))}
              aria-invalid={errors.timePerUnitMinutes ? true : undefined}
              {...register('timePerUnitMinutes', { valueAsNumber: true })}
            />
          </Field>
        </div>
      </fieldset>
    </div>
  );
}
