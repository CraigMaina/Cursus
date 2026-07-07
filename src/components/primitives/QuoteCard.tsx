import { motion, useReducedMotion } from 'framer-motion';
import { agedCard, cx, Laurel, PlasterTexture } from '@/theme';
import { MeanderDivider } from './MeanderDivider';

/**
 * QuoteCard — the reward "death-screen" inscription plate (PRD 4.1 #8, section 7).
 * An inscription-plate composition: quote in an inscriptional face over a plaster
 * ground, author beneath, laurel/meander framing. Reveals slowly (fresco fade), not
 * a snap. `variant` tints the frame per moment: daily, milestone (grand, laurel),
 * reset (the stoic falling-and-rising line).
 */
type QuoteVariant = 'daily' | 'milestone' | 'reset';

const variantTone: Record<QuoteVariant, string> = {
  daily: 'text-ochre',
  milestone: 'text-ochre',
  reset: 'text-pompeian-red',
};

export function QuoteCard({
  quote,
  author,
  source,
  variant = 'daily',
  className,
  reveal = true,
}: {
  quote: string;
  author: string;
  source?: string | null;
  variant?: QuoteVariant;
  className?: string;
  reveal?: boolean;
}) {
  const reduce = useReducedMotion();
  const tone = variantTone[variant];
  const showLaurel = variant === 'milestone' || variant === 'reset';

  return (
    <motion.figure
      className={cx(
        'relative isolate mx-auto max-w-xl overflow-hidden bg-plaster-deep px-8 py-10 text-center',
        agedCard('plaque'),
        className,
      )}
      initial={reveal && !reduce ? { opacity: 0, y: 12 } : false}
      animate={reveal && !reduce ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <PlasterTexture variant="card" />

      <div className="relative">
        <MeanderDivider tone={cx(tone, 'opacity-70')} height={14} className="mb-6" />

        {showLaurel ? (
          <Laurel className={cx('mx-auto mb-4 block', tone)} size={variant === 'reset' ? 96 : 84} />
        ) : null}

        <blockquote className="font-display text-xl font-medium leading-snug text-ink sm:text-2xl">
          {quote}
        </blockquote>

        <figcaption className="mt-5 font-sans text-xs uppercase tracking-[0.22em] text-ink/70">
          {author}
          {source ? <span className="mt-1 block normal-case tracking-normal text-ink/50">{source}</span> : null}
        </figcaption>

        <MeanderDivider tone={cx(tone, 'opacity-70')} height={14} className="mt-6" />
      </div>
    </motion.figure>
  );
}
