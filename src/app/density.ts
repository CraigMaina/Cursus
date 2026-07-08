/**
 * UI density (PRD 4 settings). A lightweight, app-wide control: because the design is
 * rem-based (Tailwind spacing + type), scaling the root font size subtly tightens or
 * relaxes the whole interface. Persisted in localStorage and applied before first paint
 * (see main.tsx) so there is no flash.
 */
export type Density = 'comfortable' | 'compact';

const KEY = 'cursus-density';
const ROOT_PX: Record<Density, string> = { comfortable: '16px', compact: '15px' };

export function getDensity(): Density {
  const v = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
  return v === 'compact' ? 'compact' : 'comfortable';
}

export function applyDensity(d: Density): void {
  if (typeof document !== 'undefined') document.documentElement.style.fontSize = ROOT_PX[d];
  if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, d);
}

export function initDensity(): void {
  applyDensity(getDensity());
}
