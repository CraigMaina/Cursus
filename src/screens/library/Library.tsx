import { useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME } from '@/config/app';
import { MeanderDivider, SealButton } from '@/components/primitives';
import type { Template } from '@/lib/domain/schemas';
import { useLibrary } from './useLibrary';
import { TemplatePlaque } from './TemplatePlaque';
import { StartChallengeDialog } from './StartChallengeDialog';

/**
 * Challenge library (PRD 4.1 #2) — browse the built-in system templates (and any the
 * user saved) as fresco plaques, then start one from a chosen date. Reads and writes
 * exclusively through the DAL (`useLibrary` -> `useData`). Editorial asymmetric grid,
 * warm plaster ground, no centered card soup.
 */
export function Library() {
  const { templatesQuery, startMutation } = useLibrary();
  const [pending, setPending] = useState<Template | null>(null);

  return (
    <div className="min-h-full">
      <TopBar />

      <main className="mx-auto w-full max-w-5xl px-6 pb-24 pt-8 sm:px-8">
        <header className="max-w-2xl">
          <p className="font-sans text-xs uppercase tracking-[0.28em] text-ochre">
            The library
          </p>
          <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
            Choose your course
          </h1>
          <p className="mt-3 font-serif text-lg text-ink/70">
            Each plaque is a protocol you can commit to. Start one and day one begins on
            the date you set. The original 75 Hard is faithful to the letter; the softer
            formats trade severity for staying power. Or write your own from scratch.
          </p>
          <div className="mt-5">
            <Link to="/builder">
              <SealButton variant="ochre">Build your own challenge</SealButton>
            </Link>
          </div>
        </header>

        <MeanderDivider tone="text-ochre/60" height={14} className="my-8" />

        {templatesQuery.isLoading ? (
          <p className="font-serif text-lg text-ink/50">Loading the library.</p>
        ) : templatesQuery.error ? (
          <p role="alert" className="font-serif text-lg text-pompeian-red">
            {templatesQuery.error instanceof Error
              ? templatesQuery.error.message
              : 'Could not load templates.'}
          </p>
        ) : (templatesQuery.data?.length ?? 0) === 0 ? (
          <p className="font-serif text-lg text-ink/60">No templates found.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templatesQuery.data!.map((template) => (
              <li key={template.id} className="h-full">
                <TemplatePlaque template={template} onBegin={setPending} />
              </li>
            ))}
          </ul>
        )}
      </main>

      <StartChallengeDialog
        template={pending}
        pending={startMutation.isPending}
        error={startMutation.error}
        onClose={() => {
          if (!startMutation.isPending) {
            setPending(null);
            startMutation.reset();
          }
        }}
        onConfirm={(startDate) => {
          if (pending) startMutation.mutate({ template: pending, startDate });
        }}
      />
    </div>
  );
}

function TopBar() {
  return (
    <div className="border-b border-ink/10">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4 sm:px-8">
        <span className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-pompeian-red">
          {APP_NAME}
        </span>
        <nav className="flex items-center gap-5 font-sans text-xs uppercase tracking-[0.16em] text-ink/60">
          <Link to="/" className="transition-colors hover:text-ink">
            Today
          </Link>
          <span aria-current="page" className="text-ink">
            Challenges
          </span>
        </nav>
      </div>
    </div>
  );
}
