import { type ReactNode } from 'react';
import { cx } from '@/theme';

/**
 * Token-styled form building blocks, local to the vices screens. They mirror the
 * builder/auth field treatment (plaster ground, ink text, egyptian focus ring, no
 * inline hex) but are kept local so the vices module stays self-contained. Screens
 * spread react-hook-form's `register` onto native controls, so keyboard and
 * screen-reader behaviour is native.
 */

/** Class for text/number/date inputs and textareas. `invalid` swaps the border token. */
export function controlClass(invalid?: boolean): string {
  return cx(
    'w-full rounded-tessera border bg-plaster px-3.5 py-2.5 font-serif text-base text-ink',
    'placeholder:text-ink/35',
    'focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-egyptian',
    'disabled:cursor-not-allowed disabled:opacity-60',
    invalid ? 'border-pompeian-red' : 'border-ink/25',
  );
}

export const labelClass =
  'font-sans text-xs font-medium uppercase tracking-[0.16em] text-ink/70';

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  const errorId = `${htmlFor}-error`;
  const hintId = `${htmlFor}-hint`;
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p id={hintId} className="font-serif text-sm text-ink/55">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="font-sans text-xs text-pompeian-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}
