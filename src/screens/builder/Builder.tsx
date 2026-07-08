import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppNav } from '@/app/AppNav';
import { MeanderDivider, Plaque, SealButton } from '@/components/primitives';
import { cx } from '@/theme';
import { builderSchema, type BuilderFormValues } from './builderForms';
import { ChallengeFields } from './ChallengeFields';
import { RulesEditor } from './RulesEditor';
import { useBuilder } from './useBuilder';

/**
 * Challenge builder (PRD 4.1 #3). Create a challenge from scratch or edit an existing
 * one (`/builder/:challengeId`), define its rules, and save. Persists ONLY through the
 * DAL (`useBuilder` -> `useData`); it never computes resets or touches Supabase. On
 * save it routes to Today. Editorial asymmetric layout on a fresco Plaque, warm cast.
 */
export function Builder() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const b = useBuilder(challengeId);

  const form = useForm<BuilderFormValues>({
    resolver: zodResolver(builderSchema) as unknown as Resolver<BuilderFormValues>,
    defaultValues: b.initialValues,
    mode: 'onBlur',
  });

  // Edit mode: seed the form once the challenge + rules load.
  useEffect(() => {
    if (b.isEdit && !b.loading) {
      form.reset(b.initialValues);
    }
    // Reset only when the loaded record changes, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b.isEdit, b.loading, challengeId]);

  const strictness = form.watch('strictness');
  const showStrictWarning = b.isEdit && strictness === 'strict';

  return (
    <div className="min-h-full">
      <AppNav maxWidth="max-w-4xl" />

      <main className="mx-auto w-full max-w-4xl px-6 pb-28 pt-8 sm:px-8">
        <header className="max-w-2xl">
          <p className="font-sans text-xs uppercase tracking-[0.28em] text-ochre">
            {b.isEdit ? 'Revise a protocol' : 'Compose a protocol'}
          </p>
          <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
            {b.isEdit ? 'Edit challenge' : 'Build a challenge'}
          </h1>
          <p className="mt-3 font-serif text-lg text-ink/70">
            Set the terms, then lay out the rules you will seal each day. You can save
            this shape as a personal template to reuse later.
          </p>
        </header>

        <MeanderDivider tone="text-ochre/60" height={14} className="my-8" />

        {b.isEdit && b.loading ? (
          <p className="font-serif text-lg text-ink/50">Loading the challenge.</p>
        ) : b.loadError ? (
          <p role="alert" className="font-serif text-lg text-pompeian-red">
            {b.loadError instanceof Error ? b.loadError.message : 'Could not load the challenge.'}
          </p>
        ) : (
          <form noValidate onSubmit={form.handleSubmit((values) => b.save(values))}>
            <Plaque className="mb-8">
              <ChallengeFields form={form} />
            </Plaque>

            {showStrictWarning ? (
              <div
                role="status"
                className={cx(
                  'mb-8 rounded-plaque border border-ochre/50 bg-ochre/10 px-4 py-3',
                  'font-serif text-sm text-ink/80',
                )}
              >
                This is a Strict challenge in progress. Changing its rules now affects an
                active run, and may trigger a reset when the server re-evaluates.
              </div>
            ) : null}

            <Plaque className="mb-8">
              <RulesEditor form={form} />
            </Plaque>

            {b.saveError ? (
              <p role="alert" className="mb-4 font-sans text-sm text-pompeian-red">
                {b.saveError instanceof Error ? b.saveError.message : 'Could not save the challenge.'}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <SealButton type="submit" size="lg" loading={b.saving}>
                  {b.isEdit ? 'Save changes' : 'Create challenge'}
                </SealButton>
                <Link
                  to="/"
                  className="font-sans text-xs uppercase tracking-[0.16em] text-ink/60 underline underline-offset-4 hover:text-ink"
                >
                  Cancel
                </Link>
              </div>

              {b.isEdit ? (
                <div className="flex items-center gap-3">
                  {b.templateSaved ? (
                    <span role="status" className="font-serif text-sm text-verdigris">
                      Saved to your templates.
                    </span>
                  ) : b.templateError ? (
                    <span role="alert" className="font-sans text-xs text-pompeian-red">
                      {b.templateError instanceof Error
                        ? b.templateError.message
                        : 'Could not save the template.'}
                    </span>
                  ) : null}
                  <SealButton
                    type="button"
                    variant="ghost"
                    onClick={b.saveAsTemplate}
                    loading={b.savingTemplate}
                  >
                    Save as template
                  </SealButton>
                </div>
              ) : null}
            </div>

            {!b.isEdit ? (
              <p className="mt-4 font-serif text-sm text-ink/55">
                Save the challenge first. You can then save it as a personal template
                from its edit screen.
              </p>
            ) : null}
          </form>
        )}
      </main>
    </div>
  );
}

