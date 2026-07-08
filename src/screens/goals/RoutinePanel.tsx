import { useState } from 'react';
import { Plaque, SealButton, Icon } from '@/components/primitives';
import type { Goal } from '@/lib/domain/schemas';
import { todayIso } from '../today/dates';
import { useRoutine } from './useRoutine';
import { ExerciseTemplateEditor } from './ExerciseTemplateEditor';
import { LogSessionDialog } from './LogSessionDialog';
import { SessionHistory } from './SessionHistory';
import { exerciseTargetLine } from './goalModel';

/**
 * Routine goal detail (D16). An editable exercises template, a "log a session" flow that
 * records the actual sets performed, and the session history (each expandable to its
 * sets). Reads and writes ONLY through the DAL (`useRoutine` -> `useData`).
 */
export function RoutinePanel({ goal, authed }: { goal: Goal; authed: boolean }) {
  const r = useRoutine(goal.id, authed);
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [logging, setLogging] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Plaque>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-xl text-ink">Sessions</h2>
            <SealButton
              onClick={() => setLogging(true)}
              disabled={r.exercises.length === 0}
              leading={<Icon slot="add" size="sm" decorative className="text-plaster" />}
            >
              Log a session
            </SealButton>
          </div>
          {r.exercises.length === 0 ? (
            <p className="mt-3 font-serif text-sm text-ink/60">
              Build the routine's exercises first, then log sessions against them.
            </p>
          ) : null}
          <div className="mt-6">
            {r.loading ? (
              <p className="font-serif text-ink/50">Reading your sessions.</p>
            ) : r.error ? (
              <p role="alert" className="font-serif text-pompeian-red">
                {r.error instanceof Error ? r.error.message : 'Could not load sessions.'}
              </p>
            ) : (
              <SessionHistory
                sessions={r.sessions}
                deleting={r.deletingSession}
                onDelete={r.deleteSession}
              />
            )}
          </div>
        </Plaque>
      </div>

      <aside className="lg:col-span-1">
        <Plaque>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl text-ink">The routine</h2>
            {!editingTemplate ? (
              <button
                type="button"
                onClick={() => setEditingTemplate(true)}
                className="font-sans text-xs uppercase tracking-[0.14em] text-pompeian-red underline-offset-4 hover:underline"
              >
                Edit
              </button>
            ) : null}
          </div>

          {editingTemplate ? (
            <div className="mt-4">
              <ExerciseTemplateEditor
                exercises={r.exercises}
                saving={r.replacing}
                error={r.replaceError}
                onSave={async (rows) => {
                  await r.replaceExercises(rows);
                  setEditingTemplate(false);
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setEditingTemplate(false);
                  r.resetReplace();
                }}
                disabled={r.replacing}
                className="mt-3 font-sans text-xs uppercase tracking-[0.14em] text-ink/50 underline-offset-4 hover:text-ink hover:underline disabled:opacity-50"
              >
                Done editing
              </button>
            </div>
          ) : r.exercises.length === 0 ? (
            <div className="mt-4">
              <p className="font-serif text-ink/65">
                No exercises yet. Add the movements this routine is built from.
              </p>
              <div className="mt-4">
                <SealButton size="sm" onClick={() => setEditingTemplate(true)}>
                  Build the routine
                </SealButton>
              </div>
            </div>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {r.exercises.map((ex) => {
                const target = exerciseTargetLine(ex);
                return (
                  <li key={ex.id} className="border-l-2 border-verdigris/50 pl-3">
                    <p className="font-display text-lg text-ink">{ex.name}</p>
                    {target ? (
                      <p className="font-sans text-xs uppercase tracking-[0.14em] text-ink/50">
                        {target}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Plaque>
      </aside>

      <LogSessionDialog
        open={logging}
        goalId={goal.id}
        exercises={r.exercises}
        sessionDate={todayIso()}
        pending={r.logging}
        error={r.logError}
        onSubmit={async (input) => {
          await r.logSession(input);
          setLogging(false);
        }}
        onClose={() => {
          if (!r.logging) {
            setLogging(false);
            r.resetLog();
          }
        }}
      />
    </div>
  );
}
