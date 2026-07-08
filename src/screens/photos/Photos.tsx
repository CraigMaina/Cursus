import { Link, useParams } from 'react-router-dom';
import { APP_NAME } from '@/config/app';
import { MeanderDivider, MedallionBadge, Plaque } from '@/components/primitives';
import { usePhotos } from './usePhotos';
import { PhotoTile } from './PhotoTile';

/**
 * Progress-photo timeline screen (PRD 4.1 #7, section 8). For a challenge's
 * `type:'photo'` rule, a warm editorial grid of days — newest first — each carrying
 * that day's compressed thumbnail or an empty framed tile, with add/replace inline.
 * Reads and writes exclusively through the DAL (`usePhotos` -> `useData`). No Supabase
 * import; signed URLs are fetched lazily per tile and never logged.
 */
export function Photos() {
  const { challengeId } = useParams();
  const p = usePhotos(challengeId);

  return (
    <div className="min-h-full">
      <TopBar />

      <main className="mx-auto w-full max-w-4xl px-6 pb-24 pt-8 sm:px-8">
        {p.loading ? (
          <p className="font-serif text-lg text-ink/50">Uncovering the record.</p>
        ) : p.error ? (
          <p role="alert" className="font-serif text-lg text-pompeian-red">
            {p.error instanceof Error ? p.error.message : 'Something went wrong.'}
          </p>
        ) : !p.authed ? (
          <p className="font-serif text-lg text-ink/70">
            <Link
              to="/auth/sign-in"
              className="text-pompeian-red underline-offset-4 hover:underline"
            >
              Sign in
            </Link>{' '}
            to see your progress photos.
          </p>
        ) : !p.challenge ? (
          <p className="font-serif text-lg text-ink/70">
            No such challenge.{' '}
            <Link
              to="/library"
              className="text-pompeian-red underline-offset-4 hover:underline"
            >
              Browse the library
            </Link>
            .
          </p>
        ) : !p.photoRule ? (
          <NoPhotoRule name={p.challenge.name} />
        ) : (
          <>
            <header className="flex flex-wrap items-end justify-between gap-6">
              <div className="min-w-0">
                <p className="font-sans text-xs uppercase tracking-[0.28em] text-ochre">
                  The record
                </p>
                <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
                  {p.challenge.name}
                </h1>
                <p className="mt-2 font-sans text-sm uppercase tracking-[0.18em] text-ink/60">
                  Progress photos
                  <span className="mx-2 text-ink/30">/</span>
                  {p.filledCount} of {p.rows.length} days set
                </p>
              </div>
              <MedallionBadge
                value={p.filledCount}
                label={`${p.filledCount} progress photos recorded`}
                size="lg"
                tone="text-ochre"
              />
            </header>

            <MeanderDivider tone="text-ochre/60" height={14} className="my-8" />

            {p.uploadError ? (
              <p role="alert" className="mb-6 font-serif text-base text-pompeian-red">
                {p.uploadError instanceof Error
                  ? p.uploadError.message
                  : 'That photo could not be saved. Try again.'}
              </p>
            ) : null}

            {p.rows.length === 0 ? (
              <p className="font-serif text-lg text-ink/70">
                This challenge has not started yet. The timeline opens on day one.
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
                {p.rows.map((row) => (
                  <li key={row.date}>
                    <PhotoTile
                      row={row}
                      uploading={p.uploadingDate === row.date}
                      onPick={p.uploadPhoto}
                      getSignedUrl={p.getSignedUrl}
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function NoPhotoRule({ name }: { name: string }) {
  return (
    <Plaque meanderTop className="max-w-xl">
      <p className="font-sans text-xs uppercase tracking-[0.24em] text-ochre">The record</p>
      <h1 className="mt-2 font-display text-3xl text-ink">{name}</h1>
      <p className="mt-4 font-serif text-lg leading-relaxed text-ink/75">
        This challenge has no progress-photo rule, so there is no timeline to keep. Add a
        photo rule in the builder to start recording a daily portrait of the work.
      </p>
      <p className="mt-6">
        <Link
          to="/library"
          className="font-sans text-xs uppercase tracking-[0.16em] text-pompeian-red underline-offset-4 hover:underline"
        >
          Back to challenges
        </Link>
      </p>
    </Plaque>
  );
}

function TopBar() {
  return (
    <div className="border-b border-ink/10">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-4 sm:px-8">
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
            Photos
          </span>
        </nav>
      </div>
    </div>
  );
}
