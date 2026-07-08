import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plaque, SealButton } from '@/components/primitives';
import type { Goal } from '@/lib/domain/schemas';
import { todayIso } from '../today/dates';
import { formatLongDate } from '../today/dates';
import { useMetric } from './useMetric';
import { MetricChart } from './MetricChart';
import { Field, controlClass } from './fields';
import { ProgressBar } from './parts';
import {
  currentMetricValue,
  formatValue,
  latestMetricEntry,
  metricProgressPct,
  metricSeries,
} from './goalModel';
import {
  emptyMeasurement,
  measurementFormSchema,
  toMetricEntryDomain,
  type MeasurementFormValues,
} from './goalForms';

/**
 * Metric goal detail (D16). The current value and its progress toward the target, a
 * chart of every measurement over time, an inline form to add a measurement (upserting
 * the day), and the measurement history with a per-row delete. Reads/writes ONLY through
 * the DAL (`useMetric` -> `useData`).
 */
export function MetricPanel({ goal, authed }: { goal: Goal; authed: boolean }) {
  const m = useMetric(goal.id, authed);
  const current = currentMetricValue(m.entries, goal.startValue);
  const pct = metricProgressPct(goal.startValue, goal.targetValue, current, goal.direction);
  const series = metricSeries(m.entries);
  const latest = latestMetricEntry(m.entries);
  const unit = goal.unit ? ` ${goal.unit}` : '';

  const form = useForm<MeasurementFormValues>({
    resolver: zodResolver(measurementFormSchema) as unknown as Resolver<MeasurementFormValues>,
    defaultValues: emptyMeasurement(todayIso()),
    mode: 'onBlur',
  });
  const errors = form.formState.errors;

  async function submit(values: MeasurementFormValues) {
    await m.addEntry(toMetricEntryDomain(goal.id, values));
    form.reset(emptyMeasurement(todayIso()));
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Plaque>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-sans text-xs uppercase tracking-[0.16em] text-ink/55">
                Current
              </p>
              <p className="mt-1 font-display text-4xl text-ink">
                {current != null ? (
                  <>
                    {formatValue(current)}
                    <span className="text-2xl text-ink/60">{unit}</span>
                  </>
                ) : (
                  <span className="text-2xl text-ink/45">Not yet measured</span>
                )}
              </p>
              {latest ? (
                <p className="mt-1 font-serif text-sm text-ink/55">
                  as of {formatLongDate(latest.entryDate)}
                </p>
              ) : null}
            </div>
            {goal.targetValue != null ? (
              <div className="text-right">
                <p className="font-sans text-xs uppercase tracking-[0.16em] text-ink/55">
                  Target
                </p>
                <p className="mt-1 font-display text-2xl text-ink">
                  {formatValue(goal.targetValue)}
                  <span className="text-lg text-ink/60">{unit}</span>
                </p>
              </div>
            ) : null}
          </div>

          {pct != null ? (
            <div className="mt-5">
              <ProgressBar pct={pct} tone="bg-egyptian" label={`Progress toward target: ${pct} percent`} />
              <p className="mt-1.5 font-sans text-xs uppercase tracking-[0.16em] text-ink/50">
                {pct}% of the way from {goal.startValue != null ? formatValue(goal.startValue) : 'start'} to{' '}
                {formatValue(goal.targetValue!)}
                {unit}
              </p>
            </div>
          ) : null}

          <div className="mt-8">
            {m.loading ? (
              <p className="font-serif text-ink/50">Reading measurements.</p>
            ) : m.error ? (
              <p role="alert" className="font-serif text-pompeian-red">
                {m.error instanceof Error ? m.error.message : 'Could not load measurements.'}
              </p>
            ) : (
              <MetricChart points={series} target={goal.targetValue} unit={goal.unit} />
            )}
          </div>
        </Plaque>

        {m.entries.length > 0 ? (
          <section className="mt-8">
            <h2 className="font-display text-xl text-ink">Every measurement</h2>
            <ul className="mt-4 divide-y divide-ink/10 rounded-plaque border border-ink/15 bg-plaster-deep/50">
              {[...m.entries]
                .sort((a, b) => b.entryDate.localeCompare(a.entryDate))
                .map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-serif text-ink">
                        <span className="font-display text-lg">{formatValue(e.value)}</span>
                        {unit}
                      </p>
                      <p className="font-sans text-xs uppercase tracking-[0.14em] text-ink/50">
                        {formatLongDate(e.entryDate)}
                      </p>
                      {e.note ? (
                        <p className="mt-1 font-serif text-sm text-ink/60">{e.note}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => m.deleteEntry(e.id)}
                      disabled={m.deletingEntry}
                      className="font-sans text-xs uppercase tracking-[0.14em] text-ink/45 underline-offset-4 hover:text-pompeian-red hover:underline disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        ) : null}
      </div>

      <aside className="lg:col-span-1">
        <Plaque>
          <h2 className="font-display text-xl text-ink">Add a measurement</h2>
          <p className="mt-1 font-serif text-sm text-ink/60">
            Logging a date you already recorded overwrites it.
          </p>
          <form noValidate className="mt-5 flex flex-col gap-4" onSubmit={form.handleSubmit(submit)}>
            <Field label="Date" htmlFor="metric-date" error={errors.entryDate?.message}>
              <input
                id="metric-date"
                type="date"
                className={controlClass(Boolean(errors.entryDate))}
                {...form.register('entryDate')}
              />
            </Field>
            <Field
              label={`Value${goal.unit ? ` (${goal.unit})` : ''}`}
              htmlFor="metric-value"
              error={errors.value?.message}
            >
              <input
                id="metric-value"
                type="number"
                inputMode="decimal"
                step="any"
                className={controlClass(Boolean(errors.value))}
                {...form.register('value', { valueAsNumber: true })}
              />
            </Field>
            <Field label="Note" htmlFor="metric-note" error={errors.note?.message}>
              <input
                id="metric-note"
                type="text"
                placeholder="Optional"
                className={controlClass(Boolean(errors.note))}
                {...form.register('note')}
              />
            </Field>
            {m.addEntryError ? (
              <p role="alert" className="font-sans text-sm text-pompeian-red">
                {m.addEntryError instanceof Error ? m.addEntryError.message : 'Could not save.'}
              </p>
            ) : null}
            <div>
              <SealButton type="submit" loading={m.addingEntry}>
                Record it
              </SealButton>
            </div>
          </form>
        </Plaque>
      </aside>
    </div>
  );
}
