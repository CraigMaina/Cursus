import { cx } from './cx';

/**
 * Aged / softened card-edge helpers (PRD section 8). Uses the token radii
 * (`rounded-plaque`, `rounded-tessera`) and token colors via opacity utilities on
 * `ink` / `plaster` — no inline hex. The asymmetric `rounded-plaque` radius plus a
 * hairline warm border is what reads as "chipped fresco plate" rather than a crisp
 * material card.
 */
export type EdgeVariant = 'plaque' | 'tessera' | 'inset';

export function agedCard(variant: EdgeVariant = 'plaque', ...extra: (string | false | null | undefined)[]): string {
  const base = 'border border-ink/15 shadow-sm shadow-ink/10';
  switch (variant) {
    case 'tessera':
      return cx('rounded-tessera', base, ...extra);
    case 'inset':
      // A recessed, carved-in look: inner shadow instead of a lift.
      return cx('rounded-plaque border border-ink/15 shadow-[inset_0_1px_3px] shadow-ink/15', ...extra);
    case 'plaque':
    default:
      return cx('rounded-plaque', base, ...extra);
  }
}
