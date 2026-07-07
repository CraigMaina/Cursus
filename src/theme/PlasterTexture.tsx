import { cx } from './cx';
import { grainOpacity, plasterGrainClass } from './texture';

/**
 * Absolutely-positioned plaster grain overlay. Drop inside any `relative` container
 * to lay grain over its ground. Purely decorative, so it is aria-hidden and never
 * intercepts pointer events. Colors/texture come from tokens (see texture.ts).
 */
export function PlasterTexture({
  variant = 'card',
  className,
}: {
  variant?: keyof typeof grainOpacity;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cx(
        'pointer-events-none absolute inset-0',
        plasterGrainClass(),
        grainOpacity[variant],
        className,
      )}
    />
  );
}
