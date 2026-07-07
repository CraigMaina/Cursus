import { motion, useReducedMotion } from 'framer-motion';
import { cx } from '@/theme';

/**
 * MosaicTile — a single calendar tessera (PRD 4.1 #5, section 8). The progress
 * calendar is a grid of these. Color encodes day state via tokens; a `reset` day
 * carries a break line (Strict-mode reset in the mosaic). Rendered as a button when
 * interactive so it is keyboard reachable; otherwise a labelled cell.
 */
export type MosaicState = 'complete' | 'partial' | 'missed' | 'future' | 'rest' | 'reset';

const stateStyles: Record<MosaicState, string> = {
  complete: 'bg-pompeian-red text-plaster',
  partial: 'bg-ochre/80 text-ink',
  missed: 'bg-ink/15 text-ink/50',
  future: 'bg-plaster-deep text-ink/30',
  rest: 'bg-verdigris/45 text-ink/70',
  reset: 'bg-ink/15 text-ink/60',
};

const stateLabel: Record<MosaicState, string> = {
  complete: 'complete',
  partial: 'partial',
  missed: 'missed',
  future: 'upcoming',
  rest: 'rest day',
  reset: 'reset',
};

export function MosaicTile({
  state,
  dayLabel,
  onSelect,
  className,
  size = 'md',
}: {
  state: MosaicState;
  /** e.g. the day-of-month number or full date for the accessible name. */
  dayLabel: string | number;
  onSelect?: () => void;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const reduce = useReducedMotion();
  const dims = size === 'sm' ? 'h-6 w-6 text-[0.6rem]' : 'h-9 w-9 text-xs';
  const interactive = Boolean(onSelect);

  const content = (
    <>
      <span className="font-sans tabular-nums">{dayLabel}</span>
      {state === 'reset' ? (
        // Break line across the tessera marks a Strict-mode reset.
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <span className="h-full w-[2px] rotate-45 bg-pompeian-red/80" />
        </span>
      ) : null}
    </>
  );

  const classes = cx(
    'relative inline-flex items-center justify-center rounded-tessera',
    'shadow-[inset_0_0_0_1px] shadow-ink/10 select-none',
    dims,
    stateStyles[state],
    interactive &&
      'transition-transform hover:-translate-y-[1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egyptian',
    className,
  );

  const a11yName = `${dayLabel}, ${stateLabel[state]}`;

  if (interactive) {
    return (
      <motion.button
        type="button"
        onClick={onSelect}
        className={classes}
        aria-label={a11yName}
        whileTap={reduce ? undefined : { scale: 0.92 }}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <span className={classes} role="img" aria-label={a11yName}>
      {content}
    </span>
  );
}
