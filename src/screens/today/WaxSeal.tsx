import { motion, useReducedMotion } from 'framer-motion';
import { cx } from '@/theme';

/**
 * WaxSeal — the stamped-seal mark shown when a rule is completed (PRD 4.1 #4,
 * section 8: "a wax-seal stamp when a day/rule completes"). A pressed pompeian-red
 * disc with a struck double ring and a chiselled check. On completion it stamps down
 * once (a firm settle, never a bounce) and holds. Purely decorative, so aria-hidden;
 * the adjacent control carries the accessible state. Reduced motion shows it at rest.
 */
export function WaxSeal({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md';
  className?: string;
}) {
  const reduce = useReducedMotion();
  const box = size === 'sm' ? 'h-9 w-9' : 'h-12 w-12';

  return (
    <motion.span
      aria-hidden
      className={cx(
        'relative inline-flex items-center justify-center rounded-full bg-pompeian-red text-plaster',
        'shadow-sm shadow-ink/30',
        'before:absolute before:inset-[3px] before:rounded-full before:border before:border-plaster/50',
        box,
        className,
      )}
      initial={reduce ? false : { scale: 1.5, opacity: 0, rotate: -12 }}
      animate={reduce ? undefined : { scale: 1, opacity: 1, rotate: 0 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="relative h-1/2 w-1/2"
      >
        <path d="M5 12.5l4.5 4.5L19 7" />
      </svg>
    </motion.span>
  );
}
