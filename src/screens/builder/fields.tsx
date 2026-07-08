import { type ReactNode } from 'react';
import { cx } from '@/theme';

/**
 * Small token-styled form building blocks, local to the builder screens. They mirror
 * the auth `AuthField` treatment (plaster ground, ink text, egyptian focus ring, no
 * inline hex) but are shaped for a dense multi-field editor: a shared label/error
 * shell plus an accessible switch. Screens spread react-hook-form's `register` onto
 * the native controls, so keyboard and screen-reader behaviour is native.
 */

/** Class for text/number/date inputs and selects. `invalid` swaps the border token. */
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

/** Accessible on/off switch (used for "required"). A real button with aria-pressed. */
export function Toggle({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  id: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-plaque border transition-colors',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egyptian',
          checked ? 'border-pompeian-red bg-pompeian-red' : 'border-ink/30 bg-plaster',
        )}
      >
        <span
          aria-hidden
          className={cx(
            'inline-block h-4 w-4 rounded-tessera bg-plaster shadow-sm transition-transform',
            checked ? 'translate-x-6 bg-plaster' : 'translate-x-1 bg-ink/50',
          )}
        />
      </button>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
    </div>
  );
}
