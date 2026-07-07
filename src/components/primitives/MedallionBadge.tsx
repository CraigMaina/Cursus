import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cx, Laurel } from '@/theme';
import { Icon } from './Icon';
import type { IconSlot } from '@/lib/domain/schemas';

/**
 * MedallionBadge — a Roman coin/medallion (PRD 4.1 #8, 4.2 badges). A double-ring
 * struck-coin frame with an optional laurel wreath, carrying either a big carved
 * numeral (milestone day / streak) or a slot icon. Numerals use font-display
 * (Cinzel) for the carved-in-stone feel.
 */
const sizeMap = {
  sm: { box: 'h-16 w-16', num: 'text-xl', laurel: 74 },
  md: { box: 'h-24 w-24', num: 'text-3xl', laurel: 112 },
  lg: { box: 'h-36 w-36', num: 'text-5xl', laurel: 168 },
} as const;

export function MedallionBadge({
  value,
  slot,
  label,
  size = 'md',
  tone = 'text-ochre',
  laurel = true,
  earned = true,
  className,
  animateIn = false,
}: {
  /** Big carved numeral (milestone day / streak). Mutually exclusive with slot. */
  value?: ReactNode;
  /** Icon slot, when the medallion carries a symbol instead of a number. */
  slot?: IconSlot;
  /** Accessible label describing what the medallion represents. */
  label: string;
  size?: keyof typeof sizeMap;
  /** Token text color for the ring + laurel (e.g. text-ochre, text-verdigris). */
  tone?: string;
  laurel?: boolean;
  /** Unearned badges render dimmed, still legible on the warm ground. */
  earned?: boolean;
  className?: string;
  animateIn?: boolean;
}) {
  const s = sizeMap[size];
  const reduce = useReducedMotion();

  const coin = (
    <span
      className={cx(
        'relative flex items-center justify-center rounded-full bg-plaster-deep',
        'ring-2 ring-current ring-offset-2 ring-offset-plaster',
        'before:absolute before:inset-[6px] before:rounded-full before:border before:border-current before:opacity-60',
        s.box,
        tone,
        !earned && 'opacity-40 saturate-50',
      )}
    >
      {slot ? (
        <Icon slot={slot} size={size === 'lg' ? 'xl' : 'lg'} decorative className="text-ink" />
      ) : (
        <span className={cx('font-display font-semibold leading-none text-ink', s.num)}>{value}</span>
      )}
    </span>
  );

  return (
    <motion.figure
      className={cx('relative inline-flex items-center justify-center', className)}
      initial={animateIn && !reduce ? { scale: 0.6, opacity: 0, rotate: -8 } : false}
      animate={animateIn && !reduce ? { scale: 1, opacity: 1, rotate: 0 } : undefined}
      transition={{ type: 'spring', stiffness: 180, damping: 18 }}
      aria-label={label}
      role="img"
    >
      {laurel ? (
        <Laurel
          className={cx('absolute -z-0', tone, !earned && 'opacity-40')}
          size={s.laurel}
        />
      ) : null}
      <span className="relative z-10">{coin}</span>
    </motion.figure>
  );
}
