import { useMemo } from 'react';

/**
 * Chart palette for the metric chart, read by NAME from the CSS custom properties that
 * mirror the Tailwind token file (PRD section 8 is law: no raw hex literal in a
 * component). Recharts needs concrete color strings for SVG stroke/fill, so we resolve
 * the palette through its CSS-variable names at runtime. Mirrors the stats module's
 * reader so the goals module stays self-contained.
 */
const VAR_NAMES = {
  red: '--pompeian-red',
  ochre: '--ochre',
  egyptian: '--egyptian-blue',
  verdigris: '--verdigris',
  ink: '--fresco-ink',
  plaster: '--plaster',
  plasterDeep: '--plaster-deep',
} as const;

export type ChartTone = keyof typeof VAR_NAMES;
export type ChartPalette = Record<ChartTone, string>;

/** Resolve each token to its computed value; fall back to the `var(--name)` reference. */
export function readChartPalette(): ChartPalette {
  const out = {} as ChartPalette;
  const cs =
    typeof document !== 'undefined' ? getComputedStyle(document.documentElement) : null;
  (Object.keys(VAR_NAMES) as ChartTone[]).forEach((tone) => {
    const name = VAR_NAMES[tone];
    const resolved = cs?.getPropertyValue(name).trim();
    out[tone] = resolved || `var(${name})`;
  });
  return out;
}

/** Memoized palette for a component's lifetime (tokens are static at runtime). */
export function useChartPalette(): ChartPalette {
  return useMemo(() => readChartPalette(), []);
}
