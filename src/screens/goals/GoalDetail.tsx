import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon, MeanderDivider, SealButton } from '@/components/primitives';
import { useGoal } from './useGoal';
import { EditGoalDialog } from './EditGoalDialog';
import { MetricPanel } from './MetricPanel';
import { ReadingPanel } from './ReadingPanel';
import { RoutinePanel } from './RoutinePanel';
import { GoalsTopBar, KIND_META, ConfirmInline } from './parts';

/**
 * Single-goal detail (D16). A shared shell (kind label, name, edit + archive) over a
 * per-kind panel: metric (progress + chart + measurements), reading (books + count), or
 * routine (template + logged sessions). Reads and writes ONLY through the DAL
 * (`useGoal` + the panel hooks -> `useData`).
 */
export function GoalDetail() {
  const { goalId } = useParams<{ goalId: string }>();
  const g = useGoal(goalId);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  return (
    <div className="min-h-full">
      <GoalsTopBar />

      <main className="mx-auto w-full max-w-5xl px-6 pb-24 pt-8 sm:px-8">
        {g.loading ? (
          <p className="font-serif text-lg text-ink/50">Reading the record.</p>
        ) : g.error ? (
          <p role="alert" className="font-serif text-lg text-pompeian-red">
            {g.error instanceof Error ? g.error.message : 'Something went wrong.'}
          </p>
        ) : !g.authed ? (
          <p className="font-serif text-lg text-ink/70">
            <Link
              to="/auth/sign-in"
              className="text-pompeian-red underline-offset-4 hover:underline"
            >
              Sign in
            </Link>{' '}
            to see this goal.
          </p>
        ) : !g.goal ? (
          <p className="font-serif text-lg text-ink/70">
            No such goal.{' '}
            <Link to="/goals" className="text-pompeian-red underline-offset-4 hover:underline">
              Back to the list
            </Link>
            .
          </p>
        ) : (
          <>
            <Link
              to="/goals"
              className="font-sans text-xs uppercase tracking-[0.16em] text-ink/55 underline-offset-4 hover:text-ink hover:underline"
            >
              Back to goals
            </Link>

            <header className="mt-4 flex flex-wrap items-end justify-between gap-6">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.28em] text-ochre">
                  <span className={KIND_META[g.goal.kind].tone}>
                    <Icon slot={KIND_META[g.goal.kind].iconSlot} size="sm" decorative />
                  </span>
                  {KIND_META[g.goal.kind].label}
                  {g.goal.isArchived ? <span className="ml-2 text-ink/40">Archived</span> : null}
                </span>
                <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">{g.goal.name}</h1>
              </div>
              <div className="flex flex-wrap gap-3">
                <SealButton variant="ghost" onClick={() => setEditOpen(true)}>
                  Edit
                </SealButton>
                {!g.goal.isArchived ? (
                  <SealButton
                    variant="ghost"
                    onClick={() => setConfirmArchive(true)}
                    loading={g.archivingGoal}
                  >
                    Archive
                  </SealButton>
                ) : null}
              </div>
            </header>

            {confirmArchive ? (
              <ConfirmInline
                label="Confirm archive"
                message="Archive this goal? It leaves your active list but the record and its history are kept."
                confirmText="Archive it"
                error={g.archiveGoalError}
                pending={g.archivingGoal}
                onConfirm={() => g.archiveGoal()}
                onCancel={() => setConfirmArchive(false)}
              />
            ) : null}

            <MeanderDivider tone="text-ochre/60" height={14} className="my-10" />

            {g.goal.kind === 'metric' ? (
              <MetricPanel goal={g.goal} authed={g.authed} />
            ) : g.goal.kind === 'reading' ? (
              <ReadingPanel goal={g.goal} authed={g.authed} />
            ) : (
              <RoutinePanel goal={g.goal} authed={g.authed} />
            )}

            <EditGoalDialog
              open={editOpen}
              goal={g.goal}
              pending={g.updatingGoal}
              error={g.updateGoalError}
              onSubmit={async (patch) => {
                await g.updateGoal(patch);
                setEditOpen(false);
              }}
              onClose={() => {
                if (!g.updatingGoal) {
                  setEditOpen(false);
                  g.resetUpdateGoal();
                }
              }}
            />
          </>
        )}
      </main>
    </div>
  );
}
