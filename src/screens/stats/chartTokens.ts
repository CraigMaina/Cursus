import { useMemo } from 'react';

/**
 * Chart palette, read by NAME from the CSS custom properties that mirror the Tailwind
 * token file (src/index.css / tailwind.config.js). Recharts needs concrete color
 * strings for SVG stroke/fill, but the aesthetic is law (PRD section 8): no raw hex
 * literal may live in a component. So we reference the palette through its CSS-variable
 * NAMES and resolve them at runtime via getComputedStyle. The map below contains only
 * variable names, never hex.
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
    typeof document !== 'undefined'
      ? getComputedStyle(document.documentElement)
      : null;
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
