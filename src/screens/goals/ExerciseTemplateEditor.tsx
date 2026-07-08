import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { SealButton, Icon } from '@/components/primitives';
import type { RoutineExercise } from '@/lib/domain/schemas';
import { controlClass, labelClass } from './fields';
import {
  emptyExerciseRow,
  exerciseToRow,
  toExerciseTemplate,
  type ExerciseRowValues,
} from './goalForms';

/**
 * Editable exercises template for a routine goal (D16). A field array of rows (name +
 * target sets/reps/weight/unit); saving replaces the whole template via the DAL. Rows
 * with a blank name are dropped on save. Reads/writes ONLY through the passed callback,
 * which goes through `useData()`.
 */
interface TemplateForm {
  rows: ExerciseRowValues[];
}

export function ExerciseTemplateEditor({
  exercises,
  saving,
  error,
  onSave,
}: {
  exercises: RoutineExercise[];
  saving: boolean;
  error: unknown;
  onSave: (rows: Omit<RoutineExercise, 'id' | 'goalId'>[]) => Promise<unknown>;
}) {
  const form = useForm<TemplateForm>({
    defaultValues: {
      rows: exercises.length ? exercises.map(exerciseToRow) : [emptyExerciseRow()],
    },
  });
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'rows',
  });

  // Reseed when the saved template changes (after a successful save or first load).
  useEffect(() => {
    replace(exercises.length ? exercises.map(exerciseToRow) : [emptyExerciseRow()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises]);

  async function submit(values: TemplateForm) {
    await onSave(toExerciseTemplate(values.rows));
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(submit)}>
      <div className="flex flex-col gap-4">
        {fields.map((field, i) => (
          <div
            key={field.id}
            className="grid grid-cols-1 gap-3 rounded-plaque border border-ink/15 bg-plaster p-4 sm:grid-cols-12"
          >
            <div className="sm:col-span-4">
              <label htmlFor={`ex-name-${i}`} className={labelClass}>
                Exercise
              </label>
              <input
                id={`ex-name-${i}`}
                type="text"
                placeholder="Back squat"
                className={`mt-1.5 ${controlClass()}`}
                {...form.register(`rows.${i}.name`)}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor={`ex-sets-${i}`} className={labelClass}>
                Sets
              </label>
              <input
                id={`ex-sets-${i}`}
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                className={`mt-1.5 ${controlClass()}`}
                {...form.register(`rows.${i}.targetSets`, { valueAsNumber: true })}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor={`ex-reps-${i}`} className={labelClass}>
                Reps
              </label>
              <input
                id={`ex-reps-${i}`}
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                className={`mt-1.5 ${controlClass()}`}
                {...form.register(`rows.${i}.targetReps`, { valueAsNumber: true })}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor={`ex-weight-${i}`} className={labelClass}>
                Weight
              </label>
              <input
                id={`ex-weight-${i}`}
                type="number"
                inputMode="decimal"
                step="any"
                className={`mt-1.5 ${controlClass()}`}
                {...form.register(`rows.${i}.targetWeight`, { valueAsNumber: true })}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor={`ex-unit-${i}`} className={labelClass}>
                Unit
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <select
                  id={`ex-unit-${i}`}
                  className={controlClass()}
                  {...form.register(`rows.${i}.unit`)}
                >
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                </select>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`Remove exercise ${i + 1}`}
                  className="shrink-0 rounded-tessera border border-ink/20 px-2 py-2 font-sans text-xs uppercase tracking-[0.12em] text-ink/50 hover:border-pompeian-red hover:text-pompeian-red"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SealButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => append(emptyExerciseRow())}
          leading={<Icon slot="add" size="sm" decorative />}
        >
          Add exercise
        </SealButton>
        <SealButton type="submit" size="sm" loading={saving}>
          Save routine
        </SealButton>
      </div>

      {error ? (
        <p role="alert" className="mt-3 font-sans text-sm text-pompeian-red">
          {error instanceof Error ? error.message : 'Could not save the routine.'}
        </p>
      ) : null}
    </form>
  );
}
