import { MedallionBadge, QuoteCard } from '@/components/primitives';
import type { Quote } from '@/lib/domain/schemas';

/**
 * MilestoneReward — surfaced when days-clean hits a milestone (PRD 4.1 #8, 4.2). A
 * Roman medallion carrying the milestone numeral (the highest threshold reached), with
 * a milestone-category inscription beneath it. The quote arrives from the DAL via
 * `getRewardQuote('milestone', ...)`; until it loads, the medallion still marks the
 * moment.
 */
export function MilestoneReward({
  milestone,
  quote,
}: {
  milestone: number;
  quote: Quote | null;
}) {
  return (
    <section
      aria-label={`Milestone reached: ${milestone} days clean`}
      className="flex flex-col items-center gap-8 rounded-plaque border border-ochre/40 bg-ochre/5 px-6 py-10"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <MedallionBadge
          value={milestone}
          label={`${milestone} days clean`}
          size="lg"
          tone="text-ochre"
          animateIn
        />
        <p className="font-sans text-xs uppercase tracking-[0.24em] text-ochre">
          {milestone} days clean
        </p>
      </div>

      {quote ? (
        <QuoteCard
          quote={quote.text}
          author={quote.author}
          source={quote.source}
          variant="milestone"
          className="w-full"
        />
      ) : null}
    </section>
  );
}
