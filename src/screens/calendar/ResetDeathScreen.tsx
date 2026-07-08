import { useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { QuoteCard, MeanderDivider } from '@/components/primitives';
import type { Quote } from '@/lib/domain/schemas';
import { cx } from '@/theme';
import { formatLongDate } from '../today/dates';

/**
 * The Strict-reset "death screen" (PRD 4.1 #8, section 7). When the server records a
 * reset, this reveals a `reset`-category reward quote (the stoic falling-and-rising
 * line) over the reset date. Self-contained: it owns its quote query and a session
 * exclude list so the same inscription does not repeat, and it is dismissible. Reads a
 * quote ONLY through the passed `fetchQuote` (which the screen wires to the DAL).
 */
export function ResetDeathScreen({
  enabled,
  resetDate,
  fetchQuote,
  onDismiss,
  queryScope,
}: {
  enabled: boolean;
  resetDate: string | null;
  fetchQuote: (excludeIds: string[]) => Promise<Quote>;
  onDismiss?: () => void;
  /** Distinguishes this instance's quote cache (e.g. challenge id). */
  queryScope: string;
}) {
  const reduce = useReducedMotion();
  const shown = useRef<string[]>([]);

  const quoteQuery = useQuery({
    queryKey: ['reset-quote', queryScope, resetDate],
    queryFn: async () => {
      const q = await fetchQuote(shown.current);
      if (!shown.current.includes(q.id)) shown.current.push(q.id);
      return q;
    },
    enabled: enabled && Boolean(resetDate),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  if (!enabled || !resetDate) return null;
  const quote = quoteQuery.data;

  return (
    <motion.section
      role="alertdialog"
      aria-label="Challenge reset"
      aria-live="assertive"
      className="relative"
      initial={reduce ? false : { opacity: 0 }}
      animate={reduce ? undefined : { opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-4 text-center">
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-pompeian-red">
          The run broke
        </p>
        <p className="mt-2 font-serif text-lg text-ink/70">
          A required rule went unmet on {formatLongDate(resetDate)}. The count returns to
          day one. What you already built stays on the wall, marked with a scar.
        </p>
      </div>

      {quote ? (
        <QuoteCard
          quote={quote.text}
          author={quote.author}
          source={quote.source}
          variant="reset"
        />
      ) : (
        <p className="text-center font-serif text-ink/50">
          {quoteQuery.isLoading ? 'Drawing the inscription.' : 'Fall down seven times, rise eight.'}
        </p>
      )}

      {onDismiss ? (
        <div className="mt-6 flex flex-col items-center">
          <MeanderDivider tone="text-pompeian-red/50" height={12} className="mb-4 max-w-xs" />
          <button
            type="button"
            onClick={onDismiss}
            className={cx(
              'rounded-plaque border border-ink/25 px-5 py-2 font-sans text-xs font-medium uppercase tracking-[0.16em] text-ink/80',
              'transition-colors hover:bg-ink/5',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egyptian',
            )}
          >
            Begin again
          </button>
        </div>
      ) : null}
    </motion.section>
  );
}
