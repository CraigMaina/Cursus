import { motion, useReducedMotion } from 'framer-motion';
import { QuoteCard, MeanderDivider } from '@/components/primitives';
import type { Quote } from '@/lib/domain/schemas';

/**
 * DayComplete — the reward moment when every required rule for the day is sealed
 * (PRD 4.1 #4, #8). A quiet inscription: a "day complete" line over a slow-revealed
 * daily QuoteCard. Restrained, in the Call-of-Duty-death-screen spirit but stoic, not
 * celebratory. The quote is chosen server-side via `getRewardQuote('daily', ...)`.
 */
export function DayComplete({
  quote,
  loading,
}: {
  quote: Quote | null;
  loading: boolean;
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
      <p className="text-center font-sans text-xs uppercase tracking-[0.28em] text-pompeian-red">
        The day is complete
      </p>
      <MeanderDivider tone="text-ochre/70" height={14} className="mx-auto mb-6 mt-3 max-w-xs" />

      {quote ? (
        <QuoteCard quote={quote.text} author={quote.author} source={quote.source} variant="daily" />
      ) : (
        <p className="text-center font-serif text-ink/50">
          {loading ? 'Drawing your inscription.' : 'Well held. Return tomorrow.'}
        </p>
      )}
    </motion.section>
  );
}
