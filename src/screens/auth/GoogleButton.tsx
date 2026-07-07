import { cx } from '@/theme';

/**
 * "Continue with Google" button. A neutral, token-styled control (no multicolor
 * trademark logo, no emoji) so it sits inside the Pompeii palette. The mark is a
 * simple line glyph in currentColor. Calls back to the DAL-wired handler; it never
 * touches Supabase directly.
 */
export function GoogleButton({
  onClick,
  loading = false,
  disabled = false,
  className,
}: {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex w-full items-center justify-center gap-2.5 rounded-plaque border border-ink/25 bg-plaster px-5 py-2.5',
        'font-sans text-sm font-medium tracking-wide text-ink transition-colors hover:bg-ink/5',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egyptian',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 12h6a6 6 0 1 1-1.8-4.3" strokeLinecap="round" />
      </svg>
      <span>{loading ? 'Redirecting' : 'Continue with Google'}</span>
    </button>
  );
}
