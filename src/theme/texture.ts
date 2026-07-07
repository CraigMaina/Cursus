import { cx } from './cx';

/**
 * Plaster grain texture helper (PRD section 8 — "the single detail that kills the
 * flat AI look"). Reads the `plaster-grain` background image and palette from the
 * token file (tailwind.config.js) — no inline hex here.
 *
 * Use `plasterGrainClass()` to lay the grain onto any ground or card. It is a
 * low-opacity multiply overlay, so it darkens the underlying warm cast slightly
 * rather than sitting on top as a flat layer.
 */
export function plasterGrainClass(...extra: (string | false | null | undefined)[]): string {
  return cx('bg-plaster-grain bg-repeat [background-blend-mode:multiply]', ...extra);
}

/**
 * Opacity presets for the grain overlay, so callers stay consistent instead of
 * hand-tuning per surface. Grounds carry a touch more grain than cards.
 */
export const grainOpacity = {
  ground: 'opacity-[0.5]',
  card: 'opacity-[0.35]',
  faint: 'opacity-[0.2]',
} as const;
