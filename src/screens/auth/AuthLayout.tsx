import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { APP_NAME, APP_TAGLINE } from '@/config/app';
import { cx, Meander, PlasterTexture } from '@/theme';

/**
 * Shared auth chrome. Editorial asymmetric two-panel layout (PRD section 8: no
 * centered card soup). On large screens a fixed brand column on the left carries the
 * app name, tagline, meander, and a carved stoic line; the form sits in an offset
 * column on the right. On small screens the brand collapses to a compact header and
 * the form takes the width. Warm plaster grounds throughout, never pure white.
 */
export function AuthLayout({
  heading,
  intro,
  children,
  footer,
}: {
  heading: string;
  intro: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="grid min-h-full grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-ink text-plaster lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <PlasterTexture variant="faint" className="mix-blend-soft-light opacity-25" />
        <div className="relative">
          <p className="font-display text-2xl font-semibold uppercase tracking-[0.3em] text-plaster">
            {APP_NAME}
          </p>
          <Meander className="mt-4 max-w-[220px] text-ochre/70" height={14} />
        </div>
        <blockquote className="relative max-w-sm">
          <p className="font-display text-2xl leading-snug text-plaster/95">
            You have power over your mind, not outside events. Realize this, and you will find strength.
          </p>
          <footer className="mt-4 font-sans text-xs uppercase tracking-[0.22em] text-ochre/80">
            Marcus Aurelius
          </footer>
        </blockquote>
        <p className="relative font-serif text-sm text-plaster/60">{APP_TAGLINE}</p>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-col justify-center px-6 py-14 sm:px-10 lg:px-14 xl:px-20">
        <div className="w-full max-w-md">
          {/* Compact brand header for small screens only. */}
          <p className="mb-8 font-display text-lg font-semibold uppercase tracking-[0.28em] text-pompeian-red lg:hidden">
            {APP_NAME}
          </p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-display text-4xl text-ink sm:text-5xl">{heading}</h1>
            <p className="mt-3 max-w-sm font-serif text-lg text-ink/70">{intro}</p>
            <div className={cx('my-7 h-px w-24 bg-ochre/60')} aria-hidden />
            {children}
            <div className="mt-8 font-sans text-sm text-ink/70">{footer}</div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
