import { forwardRef, type InputHTMLAttributes } from 'react';
import { cx } from '@/theme';

/**
 * Accessible labelled text field for the auth forms. Token-styled (plaster ground,
 * ink text, egyptian focus ring). Wires label/input/error together with ids and
 * aria-describedby / aria-invalid so screen readers announce validation state.
 */
export interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
}

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { id, label, error, className, ...rest },
  ref,
) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-sans text-xs font-medium uppercase tracking-[0.16em] text-ink/70">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        className={cx(
          'w-full rounded-tessera border bg-plaster px-3.5 py-2.5 font-serif text-base text-ink',
          'placeholder:text-ink/35',
          'focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-egyptian',
          error ? 'border-pompeian-red' : 'border-ink/25',
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      />
      {error ? (
        <p id={errorId} role="alert" className="font-sans text-xs text-pompeian-red">
          {error}
        </p>
      ) : null}
    </div>
  );
});
