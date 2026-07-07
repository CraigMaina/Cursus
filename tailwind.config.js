/**
 * Cursus design tokens (PRD section 8 — Pompeii visual system).
 * This file is the single source of truth for palette, type, radius, and texture.
 * Hex values are permitted HERE ONLY. No inline hex anywhere else in the codebase.
 * Colors are exposed both as Tailwind utilities and (in src/index.css) as CSS custom
 * properties, so non-Tailwind contexts (canvas export, SVG) can read the same tokens.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Pompeii palette. Never pure black or pure white — every surface a warm cast.
        pompeian: {
          red: '#9E3B2E', // primary, deep brick vermillion
        },
        ochre: '#C08A3E', // accent gold
        egyptian: '#2A4B7C', // secondary accent (Egyptian blue)
        verdigris: '#6B7B5A', // tertiary muted green
        ink: '#211A15', // warm near-black, text and grounds
        plaster: {
          DEFAULT: '#EFE4CE', // warm cream background
          deep: '#E6D8BC', // darker cream for cards
        },
      },
      fontFamily: {
        // Display / headings / big numerals — inscriptional Roman capitals.
        display: ['Cinzel', 'Georgia', 'serif'],
        // Reading / body / notes — humanist serif.
        serif: ['"EB Garamond"', 'Georgia', 'serif'],
        // UI / labels / controls — warm humanist sans (never Inter).
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        // Aged, softened edges rather than crisp rounded rectangles.
        plaque: '3px 10px 4px 8px',
        tessera: '2px',
      },
      backgroundImage: {
        // Plaster/paper grain overlay, applied at low opacity on grounds and cards.
        'plaster-grain':
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
