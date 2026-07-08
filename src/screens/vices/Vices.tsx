import { useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME } from '@/config/app';
import { MeanderDivider, SealButton, Icon } from '@/components/primitives';
import { todayIso } from '../today/dates';
import { useVices } from './useVices';
import { VicePlaque } from './VicePlaque';
import { ViceDialog } from './ViceDialog';
import { emptyVice } from './viceForms';

/**
 * Vice tracker list (PRD 4.1 #6). Each vice is a fresco plaque with its days-clean
 * count and the broken-chain motif; a dialog records a new one. Reads and writes ONLY
 * through the DAL (`useVices` -> `useData`). Editorial asymmetric layout, warm plaster
 * ground, no centered card soup.
 */
export function Vices() {
  const v = useVices();
  const [adding, setAdding] = useState(false);

  function closeAdd() {
    if (!v.creating) {
      setAdding(false);
      v.resetCreate();
    }
  }

  return (
    <div className="min-h-full">
      <TopBar />

      <main className="mx-auto w-full max-w-5xl px-6 pb-24 pt-8 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="font-sans text-xs uppercase tracking-[0.28em] text-ochre">
              The reckoning
            </p>
            <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
              Vices you are leaving
            </h1>
            <p className="mt-3 font-serif text-lg text-ink/70">
              Each plaque holds a habit you are quitting and the days you have held the
              line. Break the chain once and the count resets, but the record of every
              day you kept stays carved.
            </p>
          </div>
          <SealButton
            onClick={() => setAdding(true)}
            leading={<Icon slot="add" size="sm" decorative className="text-plaster" />}
          >
            Record a vice
          </SealButton>
        </header>

        <MeanderDivider tone="text-ochre/60" height={14} className="my-8" />

        {v.loading ? (
          <p className="font-serif text-lg text-ink/50">Reading the record.</p>
        ) : v.error ? (
          <p role="alert" className="font-serif text-lg text-pompeian-red">
            {v.error instanceof Error ? v.error.message : 'Could not load your vices.'}
          </p>
        ) : !v.authed ? (
          <p className="font-serif text-lg text-ink/70">
            <Link
              to="/auth/sign-in"
              className="text-pompeian-red underline-offset-4 hover:underline"
            >
              Sign in
            </Link>{' '}
            to track the habits you are quitting.
          </p>
        ) : v.vices.length === 0 ? (
          <EmptyVices onAdd={() => setAdding(true)} />
        ) : (
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {v.vices.map((vice) => (
              <li key={vice.id} className="h-full">
                <VicePlaque vice={vice} />
              </li>
            ))}
          </ul>
        )}
      </main>

      <ViceDialog
        open={adding}
        mode="add"
        initialValues={emptyVice(todayIso())}
        pending={v.creating}
        error={v.createError}
        onSubmit={async (input) => {
          await v.create(input);
          setAdding(false);
        }}
        onClose={closeAdd}
      />
    </div>
  );
}

function EmptyVices({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="max-w-xl rounded-plaque border border-ink/15 bg-plaster-deep/60 p-8">
      <span className="inline-flex text-verdigris">
        <Icon slot="vice" size="lg" decorative />
      </span>
      <h2 className="mt-4 font-display text-2xl text-ink">Nothing on the wall yet</h2>
      <p className="mt-2 font-serif text-ink/65">
        When you decide to quit something, record it here with the date you stopped. The
        count begins that day, and grows for as long as you hold.
      </p>
      <div className="mt-6">
        <SealButton onClick={onAdd}>Record your first vice</SealButton>
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <div className="border-b border-ink/10">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4 sm:px-8">
        <Link
          to="/"
          className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-pompeian-red"
        >
          {APP_NAME}
        </Link>
        <nav className="flex items-center gap-5 font-sans text-xs uppercase tracking-[0.16em] text-ink/60">
          <Link to="/" className="transition-colors hover:text-ink">
            Today
          </Link>
          <Link to="/library" className="transition-colors hover:text-ink">
            Challenges
          </Link>
          <span aria-current="page" className="text-ink">
            Vices
          </span>
        </nav>
      </div>
    </div>
  );
}
