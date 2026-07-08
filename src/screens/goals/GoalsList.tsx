import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MeanderDivider, SealButton, Icon } from '@/components/primitives';
import { useGoals } from './useGoals';
import { GoalPlaque } from './GoalPlaque';
import { GoalDialog } from './GoalDialog';
import { GoalsTopBar } from './parts';

/**
 * Goals list (D16). Every active goal is a fresco plaque with a kind-appropriate status;
 * a dialog picks the kind, then that kind's fields, to add one. Reads and writes ONLY
 * through the DAL (`useGoals` -> `useData`). Editorial, asymmetric, matching the vices
 * list it sits beside in the nav.
 */
export function GoalsList() {
  const g = useGoals();
  const [adding, setAdding] = useState(false);

  function closeAdd() {
    if (!g.creating) {
      setAdding(false);
      g.resetCreate();
    }
  }

  return (
    <div className="min-h-full">
      <GoalsTopBar />

      <main className="mx-auto w-full max-w-5xl px-6 pb-24 pt-8 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="font-sans text-xs uppercase tracking-[0.28em] text-ochre">
              What you are working toward
            </p>
            <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">Goals</h1>
            <p className="mt-3 font-serif text-lg text-ink/70">
              A number moving toward a target, the books you mean to finish, or a routine
              and the sessions you log against it. Set one and watch it advance.
            </p>
          </div>
          <SealButton
            onClick={() => setAdding(true)}
            leading={<Icon slot="add" size="sm" decorative className="text-plaster" />}
          >
            Set a goal
          </SealButton>
        </header>

        <MeanderDivider tone="text-ochre/60" height={14} className="my-8" />

        {g.loading ? (
          <p className="font-serif text-lg text-ink/50">Reading the record.</p>
        ) : g.error ? (
          <p role="alert" className="font-serif text-lg text-pompeian-red">
            {g.error instanceof Error ? g.error.message : 'Could not load your goals.'}
          </p>
        ) : !g.authed ? (
          <p className="font-serif text-lg text-ink/70">
            <Link
              to="/auth/sign-in"
              className="text-pompeian-red underline-offset-4 hover:underline"
            >
              Sign in
            </Link>{' '}
            to set goals and track them over time.
          </p>
        ) : g.goals.length === 0 ? (
          <EmptyGoals onAdd={() => setAdding(true)} />
        ) : (
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {g.goals.map((goal) => (
              <li key={goal.id} className="h-full">
                <GoalPlaque goal={goal} />
              </li>
            ))}
          </ul>
        )}
      </main>

      <GoalDialog
        open={adding}
        pending={g.creating}
        error={g.createError}
        onSubmit={async (input) => {
          await g.create(input);
          setAdding(false);
        }}
        onClose={closeAdd}
      />
    </div>
  );
}

function EmptyGoals({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="max-w-xl rounded-plaque border border-ink/15 bg-plaster-deep/60 p-8">
      <span className="inline-flex text-egyptian">
        <Icon slot="milestone" size="lg" decorative />
      </span>
      <h2 className="mt-4 font-display text-2xl text-ink">No goals set yet</h2>
      <p className="mt-2 font-serif text-ink/65">
        Choose a measurement to move toward a target, a reading count for the year, or a
        workout routine to log against. Your progress is charted as you go.
      </p>
      <div className="mt-6">
        <SealButton onClick={onAdd}>Set your first goal</SealButton>
      </div>
    </div>
  );
}
