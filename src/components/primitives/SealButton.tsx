import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cx } from '@/theme';

/**
 * SealButton — the app's primary action control, styled like a pressed wax seal
 * (PRD 4.1 #4, section 8). On press it plays a restrained "stamp" (a quick settle,
 * never bouncy). Variants map to tokens; there is no inline hex. It is a real
 * <button>, so it is keyboard and screen-reader accessible by default.
 */
type Variant = 'seal' | 'ochre' | 'egyptian' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const variantStyles: Record<Variant, string> = {
  seal: 'bg-pompeian-red text-plaster shadow-sm shadow-ink/25 hover:bg-pompeian-red/90',
  ochre: 'bg-ochre text-ink shadow-sm shadow-ink/20 hover:bg-ochre/90',
  egyptian: 'bg-egyptian text-plaster shadow-sm shadow-ink/25 hover:bg-egyptian/90',
  ghost: 'bg-transparent text-ink border border-ink/25 hover:bg-ink/5',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
};

export interface SealButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onAnimationStart' | 'onAnimationEnd' | 'onDrag' | 'onDragStart' | 'onDragEnd'
  > {
  variant?: Variant;
  size?: Size;
  /** Show a spinner-free "working" state and block interaction. */
  loading?: boolean;
  leading?: ReactNode;
  fullWidth?: boolean;
}

export const SealButton = forwardRef<HTMLButtonElement, SealButtonProps>(function SealButton(
  { variant = 'seal', size = 'md', loading = false, leading, fullWidth, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  const reduce = useReducedMotion();
  const isDisabled = disabled || loading;

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-plaque font-sans font-medium uppercase tracking-[0.12em]',
        'transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egyptian',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className,
      )}
      // Wax-seal press: a firm settle, not a spring bounce.
      whileTap={reduce || isDisabled ? undefined : { scale: 0.96 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      {...rest}
    >
      {leading ? <span aria-hidden className="inline-flex">{leading}</span> : null}
      <span>{loading ? 'Working' : children}</span>
    </motion.button>
  );
});
