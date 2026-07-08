import { useEffect, useId, useRef, useState } from 'react';
import { MeanderDivider, SealButton, Icon } from '@/components/primitives';
import { cx } from '@/theme';
import type { LogWorkoutInput, RoutineExercise } from '@/lib/domain/schemas';
import { controlClass, labelClass } from './fields';
import { exerciseTargetLine } from './goalModel';
import {
  emptySet,
  sessionFromTemplate,
  toLogWorkout,
  type SessionFormValues,
} from './goalForms';

/**
 * Log a workout session (D16) in a native <dialog>. Seeded from the routine's template
 * so the user fills in what they actually did: per exercise, a set of reps/weight rows
 * they can add to or trim. A set with neither a rep count nor a weight is dropped on
 * save. Nested set state is held locally (dynamic 2-level array); mapping + validation
 * go through `toLogWorkout` -> `logWorkoutInput`. Writes ONLY through the passed
 * callback (which goes through `useData()`).
 */
export function LogSessionDialog({
  open,
  goalId,
  exercises,
  sessionDate,
  pending,
  error,
  onSubmit,
  onClose,
}: {
  open: boolean;
  goalId: string;
  exercises: RoutineExercise[];
  sessionDate: string;
  pending: boolean;
  error: unknown;
  onSubmit: (input: LogWorkoutInput) => Promise<unknown>;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [values, setValues] = useState<SessionFormValues>(() =>
    sessionFromTemplate(sessionDate, exercises),
  );
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      setValues(sessionFromTemplate(sessionDate, exercises));
      setLocalError(null);
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
    // Reseed only on an open transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function updateSet(exIdx: number, setIdx: number, field: 'reps' | 'weight', raw: string) {
    const num = raw === '' ? null : Number(raw);
    setValues((v) => {
      const exercises = v.exercises.map((ex, i) => {
        if (i !== exIdx) return ex;
        const sets = ex.sets.map((s, j) =>
          j === setIdx ? { ...s, [field]: Number.isNaN(num as number) ? null : num } : s,
        );
        return { ...ex, sets };
      });
      return { ...v, exercises };
    });
  }

  function addSet(exIdx: number) {
    setValues((v) => ({
      ...v,
      exercises: v.exercises.map((ex, i) =>
        i === exIdx ? { ...ex, sets: [...ex.sets, emptySet()] } : ex,
      ),
    }));
  }

  function removeSet(exIdx: number, setIdx: number) {
    setValues((v) => ({
      ...v,
      exercises: v.exercises.map((ex, i) =>
        i === exIdx ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) } : ex,
      ),
    }));
  }

  async function submit() {
    setLocalError(null);
    try {
      const input = toLogWorkout(goalId, values);
      if (input.sets.length === 0) {
        setLocalError('Record at least one set (a rep count or a weight).');
        return;
      }
      await onSubmit(input);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Could not log the session.');
    }
  }

  const templateById = new Map(exercises.map((ex) => [ex.id, ex]));

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      className={cx(
        'w-[min(44rem,94vw)] rounded-plaque bg-plaster-deep p-0 text-ink',
        'shadow-xl shadow-ink/30 backdrop:bg-ink/50',
      )}
    >
      <div className="max-h-[86vh] overflow-y-auto p-6 sm:p-8">
        <p className="font-sans text-xs uppercase tracking-[0.22em] text-ochre">
          Record what you did
        </p>
        <h2 id={titleId} className="mt-2 font-display text-2xl text-ink sm:text-3xl">
          Log a session
        </h2>
        <MeanderDivider tone="text-ochre/60" height={12} className="my-5 max-w-[10rem]" />

        <div className="max-w-xs">
          <label htmlFor="session-date" className={labelClass}>
            Date
          </label>
          <input
            id="session-date"
            type="date"
            value={values.sessionDate}
            onChange={(e) => setValues((v) => ({ ...v, sessionDate: e.target.value }))}
            className={`mt-1.5 ${controlClass()}`}
          />
        </div>

        <div className="mt-6 flex flex-col gap-6">
          {values.exercises.map((ex, exIdx) => {
            const tmpl = ex.exerciseId ? templateById.get(ex.exerciseId) : undefined;
            const targetLine = tmpl ? exerciseTargetLine(tmpl) : '';
            return (
              <fieldset key={ex.exerciseId ?? ex.name} className="rounded-plaque border border-ink/15 bg-plaster p-4">
                <legend className="px-1 font-display text-lg text-ink">{ex.name}</legend>
                {targetLine ? (
                  <p className="mb-3 font-sans text-xs uppercase tracking-[0.14em] text-ink/50">
                    Target {targetLine}
                  </p>
                ) : null}
                <div className="flex flex-col gap-2">
                  {ex.sets.map((s, setIdx) => (
                    <div key={setIdx} className="flex items-center gap-3">
                      <span className="w-14 shrink-0 font-sans text-xs uppercase tracking-[0.14em] text-ink/45">
                        Set {setIdx + 1}
                      </span>
                      <label className="sr-only" htmlFor={`reps-${exIdx}-${setIdx}`}>
                        Reps for {ex.name} set {setIdx + 1}
                      </label>
                      <input
                        id={`reps-${exIdx}-${setIdx}`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={1}
                        placeholder="reps"
                        value={s.reps ?? ''}
                        onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                        className={controlClass()}
                      />
                      <span aria-hidden="true" className="font-serif text-ink/40">
                        x
                      </span>
                      <label className="sr-only" htmlFor={`weight-${exIdx}-${setIdx}`}>
                        Weight for {ex.name} set {setIdx + 1}
                      </label>
                      <input
                        id={`weight-${exIdx}-${setIdx}`}
                        type="number"
                        inputMode="decimal"
                        step="any"
                        placeholder={tmpl?.unit ? `weight (${tmpl.unit})` : 'weight'}
                        value={s.weight ?? ''}
                        onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                        className={controlClass()}
                      />
                      <button
                        type="button"
                        onClick={() => removeSet(exIdx, setIdx)}
                        aria-label={`Remove set ${setIdx + 1} of ${ex.name}`}
                        className="shrink-0 rounded-tessera border border-ink/20 px-2 py-1.5 font-sans text-xs uppercase tracking-[0.12em] text-ink/45 hover:border-pompeian-red hover:text-pompeian-red"
                      >
                        Drop
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addSet(exIdx)}
                  className="mt-3 inline-flex items-center gap-1.5 font-sans text-xs uppercase tracking-[0.14em] text-egyptian underline-offset-4 hover:underline"
                >
                  <Icon slot="add" size="sm" decorative />
                  Add a set
                </button>
              </fieldset>
            );
          })}

          {values.exercises.length === 0 ? (
            <p className="font-serif text-ink/60">
              Build the routine's exercises first, then log a session against them.
            </p>
          ) : null}
        </div>

        <div className="mt-6">
          <label htmlFor="session-note" className={labelClass}>
            Note
          </label>
          <textarea
            id="session-note"
            rows={2}
            placeholder="Optional"
            value={values.note}
            onChange={(e) => setValues((v) => ({ ...v, note: e.target.value }))}
            className={`mt-1.5 ${controlClass()}`}
          />
        </div>

        {localError || error ? (
          <p role="alert" className="mt-4 font-sans text-sm text-pompeian-red">
            {localError ??
              (error instanceof Error ? error.message : 'Could not log the session.')}
          </p>
        ) : null}

        <div className="mt-7 flex justify-end gap-3">
          <SealButton type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </SealButton>
          <SealButton
            type="button"
            onClick={submit}
            loading={pending}
            disabled={values.exercises.length === 0}
          >
            Save session
          </SealButton>
        </div>
      </div>
    </dialog>
  );
}
