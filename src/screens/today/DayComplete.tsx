import { motion, useReducedMotion } from 'framer-motion';
import { QuoteCard, MeanderDivider, MedallionBadge } from '@/components/primitives';
import type { Quote } from '@/lib/domain/schemas';

/**
 * DayComplete — the reward moment when every required rule for the day is sealed
 * (PRD 4.1 #4, #8). A quiet inscription: a "day complete" line over a slow-revealed
 * QuoteCard. On a milestone day it is elevated: a carved laurel medallion and a
 * grand `milestone` quote. Restrained, in the Call-of-Duty-death-screen spirit but
 * stoic, not celebratory. The quote is chosen server-side via `getRewardQuote`.
 */
export function DayComplete({
  quote,
  loading,
  milestone,
}: {
  quote: Quote | null;
  loading: boolean;
  /** The day number when today is a milestone (7, 21, 30, ...), else null. */
  milestone: number | null;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.section
      aria-live="polite"
      className="mt-2"
      initial={reduce ? false : { opacity: 0 }}
      animate={reduce ? undefined : { opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {milestone ? (
        <div className="mb-5 flex flex-col items-center">
          <MedallionBadge value={milestone} label={`Day ${milestone} milestone`} size="lg" tone="text-ochre" />
          <p className="mt-3 text-center font-sans text-xs uppercase tracking-[0.28em] text-ochre">
            Day {milestone} reached
          </p>
        </div>
      ) : (
        <p className="text-center font-sans text-xs uppercase tracking-[0.28em] text-pompeian-red">
          The day is complete
        </p>
      )}
      <MeanderDivider tone="text-ochre/70" height={14} className="mx-auto mb-6 mt-3 max-w-xs" />

      {quote ? (
        <QuoteCard
          quote={quote.text}
          author={quote.author}
          source={quote.source}
          variant={milestone ? 'milestone' : 'daily'}
        />
      ) : (
        <p className="text-center font-serif text-ink/50">
          {loading ? 'Drawing your inscription.' : 'Well held. Return tomorrow.'}
        </p>
      )}
    </motion.section>
  );
}
