import { Link, useLocation } from 'react-router-dom';
import { APP_NAME } from '@/config/app';
import { cx } from '@/theme';

/**
 * Shared top navigation (replaces the per-screen TopBars). Responsive: on >=sm the links
 * sit inline; on mobile they collapse into a tap-to-open disclosure menu (native
 * <details>, no JS, no dialog) so the header never overflows a phone width. The current
 * destination is derived from the route, so screens render <AppNav /> with no props.
 */
const LINKS = [
  { to: '/', label: 'Today' },
  { to: '/library', label: 'Challenges' },
  { to: '/vices', label: 'Vices' },
  { to: '/goals', label: 'Goals' },
  { to: '/stats', label: 'Stats' },
  { to: '/settings', label: 'Settings' },
] as const;

function isCurrent(pathname: string, to: string): boolean {
  if (to === '/') return pathname === '/';
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AppNav({ maxWidth = 'max-w-3xl' }: { maxWidth?: string }) {
  const { pathname } = useLocation();

  return (
    <header className="border-b border-ink/10">
      <div className={cx('mx-auto flex w-full items-center justify-between gap-3 px-6 py-4 sm:px-8', maxWidth)}>
        <Link
          to="/"
          className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-pompeian-red"
        >
          {APP_NAME}
        </Link>

        {/* Desktop / tablet: inline links */}
        <nav className="hidden items-center gap-5 font-sans text-xs uppercase tracking-[0.16em] text-ink/60 sm:flex">
          {LINKS.map((l) => {
            const active = isCurrent(pathname, l.to);
            return active ? (
              <span key={l.to} aria-current="page" className="text-ink">
                {l.label}
              </span>
            ) : (
              <Link key={l.to} to={l.to} className="transition-colors hover:text-ink">
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile: disclosure menu */}
        <details className="relative sm:hidden [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 font-sans text-xs uppercase tracking-[0.16em] text-ink/70">
            Menu
            <span aria-hidden className="text-ochre">+</span>
          </summary>
          <nav className="absolute right-0 z-30 mt-3 flex w-44 flex-col overflow-hidden rounded-plaque border border-ink/15 bg-plaster shadow-xl">
            {LINKS.map((l) => {
              const active = isCurrent(pathname, l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cx(
                    'px-4 py-2.5 font-sans text-xs uppercase tracking-[0.16em] transition-colors',
                    active ? 'bg-ink/5 text-ink' : 'text-ink/70 hover:bg-ink/5',
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </details>
      </div>
    </header>
  );
}
