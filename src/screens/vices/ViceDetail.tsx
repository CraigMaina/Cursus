import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { APP_NAME } from '@/config/app';
import {
  Icon,
  MeanderDivider,
  MedallionBadge,
  SealButton,
} from '@/components/primitives';
import { cx } from '@/theme';
import { useVice } from './useVice';
import { SavingsPanel } from './SavingsPanel';
import { RelapseTimeline } from './RelapseTimeline';
import { RelapseDialog } from './RelapseDialog';
import { MilestoneReward } from './MilestoneReward';
import { ViceDialog } from './ViceDialog';
import { toFormValues } from './viceForms';

/**
 * Single-vice detail (PRD 4.1 #6). A large carved days-clean counter, the savings you
 * have reclaimed, the milestone inscription when today's count is a threshold, and the
 * kept relapse history. Log a relapse (resets the counter, keeps the record), edit, or
 * archive the vice. Reads and writes ONLY through the DAL (`useVice` -> `useData`).
 */
export function ViceDetail() {
  const { viceId } = useParams<{ viceId: string }>();
  const v = useVice(viceId);
  const [loggingOpen, setLoggingOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  return (
    <div className="min-h-full">
      <TopBar />

      <main className="mx-auto w-full max-w-3xl px-6 pb-24 pt-8 sm:px-8">
        {v.loading ? (
          <p className="font-serif text-lg text-ink/50">Reading the record.</p>
        ) : v.error ? (
          <p role="alert" className="font-serif text-lg text-pompeian-red">
            {v.error instanceof Error ? v.error.message : 'Something went wrong.'}
          </p>
        ) : !v.authed ? (
          <p className="font-serif text-lg text-ink/70">
            <Link
              to="/auth/sign-in"
              className="text-pompeian-red underline-offset-4 hover:underline"
            >
              Sign in
            </Link>{' '}
            to see this vice.
          </p>
        ) : !v.vice ? (
          <p className="font-serif text-lg text-ink/70">
            No such vice.{' '}
            <Link to="/vices" className="text-pompeian-red underline-offset-4 hover:underline">
              Back to the list
            </Link>
            .
          </p>
        ) : (
          <>
            <Link
              to="/vices"
              className="font-sans text-xs uppercase tracking-[0.16em] text-ink/55 underline-offset-4 hover:text-ink hover:underline"
            >
              Back to vices
            </Link>

            <header className="mt-4 flex flex-wrap items-center justify-between gap-8">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.28em] text-ochre">
                  <Icon slot="vice" size="sm" decorative />
                  Quit {v.vice.quitDate}
                  {v.vice.isArchived ? (
                    <span className="ml-2 text-ink/40">Archived</span>
                  ) : null}
                </span>
                <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
                  {v.vice.name}
                </h1>
                <p className="mt-3 font-sans text-sm uppercase tracking-[0.18em] text-ink/60">
                  {v.days} {v.days === 1 ? 'day clean' : 'days clean'}
                </p>
              </div>
              <MedallionBadge
                value={v.days}
                label={`${v.days} days clean`}
                size="lg"
                tone="text-verdigris"
              />
            </header>

            {v.vice.reason ? (
              <p className="mt-6 max-w-2xl border-l-2 border-ochre/50 pl-4 font-serif text-lg text-ink/75">
                {v.vice.reason}
              </p>
            ) : null}
            {v.vice.triggers ? (
              <p className="mt-4 max-w-2xl font-serif text-sm text-ink/60">
                <span className="font-sans text-xs uppercase tracking-[0.16em] text-ink/45">
                  Triggers:{' '}
                </span>
                {v.vice.triggers}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <SealButton
                variant="seal"
                onClick={() => setLoggingOpen(true)}
                leading={<Icon slot="relapse" size="sm" decorative className="text-plaster" />}
              >
                Log a relapse
              </SealButton>
              <SealButton variant="ghost" onClick={() => setEditOpen(true)}>
                Edit
              </SealButton>
              {!v.vice.isArchived ? (
                <SealButton
                  variant="ghost"
                  onClick={() => setConfirmArchive(true)}
                  loading={v.archivingVice}
                >
                  Archive
                </SealButton>
              ) : null}
            </div>

            {confirmArchive ? (
              <div
                role="alertdialog"
                aria-label="Confirm archive"
                className="mt-4 max-w-xl rounded-plaque border border-ink/20 bg-plaster-deep/70 p-4"
              >
                <p className="font-serif text-ink/80">
                  Archive this vice? It leaves your active list but the record and its
                  history are kept.
                </p>
                {v.archiveViceError ? (
                  <p role="alert" className="mt-2 font-sans text-sm text-pompeian-red">
                    {v.archiveViceError instanceof Error
                      ? v.archiveViceError.message
                      : 'Could not archive the vice.'}
                  </p>
                ) : null}
                <div className="mt-3 flex gap-3">
                  <SealButton size="sm" onClick={() => v.archiveVice()} loading={v.archivingVice}>
                    Archive it
                  </SealButton>
                  <SealButton
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmArchive(false)}
                    disabled={v.archivingVice}
                  >
                    Keep it
                  </SealButton>
                </div>
              </div>
            ) : null}

            <MeanderDivider tone="text-ochre/60" height={14} className="my-10" />

            {v.atMilestone && v.milestone != null ? (
              <div className="mb-10">
                <MilestoneReward milestone={v.milestone} quote={v.milestoneQuote} />
              </div>
            ) : null}

            <div className="mb-10">
              <SavingsPanel vice={v.vice} savings={v.savings} days={v.days} />
            </div>

            <RelapseTimeline relapses={v.relapses} />
          </>
        )}
      </main>

      {v.vice ? (
        <>
          <RelapseDialog
            open={loggingOpen}
            viceId={v.vice.id}
            viceName={v.vice.name}
            pending={v.loggingRelapse}
            error={v.logRelapseError}
            onSubmit={async (input) => {
              await v.logRelapse(input);
              setLoggingOpen(false);
            }}
            onClose={() => {
              if (!v.loggingRelapse) {
                setLoggingOpen(false);
                v.resetLogRelapse();
              }
            }}
          />
          <ViceDialog
            open={editOpen}
            mode="edit"
            initialValues={toFormValues(v.vice)}
            pending={v.updatingVice}
            error={v.updateViceError}
            onSubmit={async (input) => {
              await v.updateVice(input);
              setEditOpen(false);
            }}
            onClose={() => {
              if (!v.updatingVice) {
                setEditOpen(false);
                v.resetUpdateVice();
              }
            }}
          />
        </>
      ) : null}
    </div>
  );
}

function TopBar() {
  return (
    <div className="border-b border-ink/10">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4 sm:px-8">
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
          <Link to="/vices" className={cx('transition-colors hover:text-ink')}>
            Vices
          </Link>
        </nav>
      </div>
    </div>
  );
}
