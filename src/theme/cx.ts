/**
 * Tiny class-name combiner (no external dep). Filters falsy values and joins.
 * Kept local to the theme layer so primitives compose token classes cleanly
 * without pulling in clsx/tailwind-merge.
 */
export type ClassValue = string | number | false | null | undefined;

export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
