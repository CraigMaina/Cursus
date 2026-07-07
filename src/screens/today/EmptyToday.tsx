import { Link } from 'react-router-dom';
import { Plaque, MeanderDivider, SealButton } from '@/components/primitives';

/**
 * Empty state for the Today view when the user has no active challenge (PRD 4.1 #4).
 * Points them at the library rather than showing a blank screen. Editorial, warm,
 * not a centered spinner.
 */
export function EmptyToday({ authed }: { authed: boolean }) {
  if (!authed) {
    return (
      <Plaque meanderTop className="max-w-xl">
        <h2 className="font-display text-2xl text-ink">Sign in to begin the course</h2>
        <p className="mt-3 font-serif text-lg text-ink/70">
          Your challenges and streaks live behind your account.
        </p>
        <div className="mt-6">
          <Link to="/auth/sign-in">
            <SealButton size="lg">Go to sign in</SealButton>
          </Link>
        </div>
      </Plaque>
    );
  }

  return (
    <Plaque meanderTop className="max-w-xl">
      <h2 className="font-display text-2xl text-ink">No challenge under way</h2>
      <MeanderDivider tone="text-ochre/60" height={12} className="my-5 max-w-[10rem]" />
      <p className="font-serif text-lg text-ink/70">
        Pick a protocol from the library, set your start date, and day one begins. The
        original 75 Hard is there, alongside gentler formats.
      </p>
      <div className="mt-6">
        <Link to="/library">
          <SealButton size="lg">Browse the challenge library</SealButton>
        </Link>
      </div>
    </Plaque>
  );
}
