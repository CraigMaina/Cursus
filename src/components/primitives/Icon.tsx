import type { IconSlot } from '@/lib/domain/schemas';
import { cx } from '@/theme';

/**
 * Icon primitive (PRD section 8 — "no emoji anywhere"). Every icon in the app is
 * keyed by an `iconSlot` from the shared schema. Until the Student Pack line-icon
 * assets are dropped in, each slot renders ONE placeholder line-glyph carrying the
 * correct human-readable slot name as its accessible label. Swapping in real assets
 * later is a one-file change: replace `PlaceholderGlyph` (or branch per slot inside
 * it) with the sourced SVG; every call site stays identical.
 */

/** Human-readable label + the motif to source per slot (PRD 8 icon table). */
export const ICON_REGISTRY: Record<IconSlot, { label: string; motif: string }> = {
  water: { label: 'Water intake', motif: 'Amphora / water jug' },
  indoor_workout: { label: 'Indoor workout', motif: 'Dumbbell' },
  outdoor_workout: { label: 'Outdoor workout', motif: 'Sun over hill / runner' },
  reading: { label: 'Reading', motif: 'Open book or scroll' },
  diet: { label: 'Diet', motif: 'Olive branch or bowl' },
  photo: { label: 'Progress photo', motif: 'Framed portrait or camera' },
  streak: { label: 'Current streak', motif: 'Torch or flame' },
  milestone: { label: 'Milestone reached', motif: 'Laurel wreath or medallion' },
  vice: { label: 'Vice', motif: 'Broken chain' },
  days_clean: { label: 'Days clean', motif: 'Shield or laurel' },
  relapse: { label: 'Relapse', motif: 'Cracked tablet' },
  reminder: { label: 'Reminder', motif: 'Oil lamp or bell' },
  calendar: { label: 'Calendar', motif: 'Grid tablet' },
  settings: { label: 'Settings', motif: 'Key or gear' },
  savings: { label: 'Savings reclaimed', motif: 'Coin stack' },
  add: { label: 'Add', motif: 'Plus / chisel mark' },
};

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-9 w-9',
  xl: 'h-14 w-14',
} as const;

/**
 * The single placeholder line-glyph, drawn in `currentColor` so it inherits the
 * parent token color. An etched tablet outline with a chisel notch — deliberately
 * generic and identical across slots until real assets land, per the ticket.
 */
function PlaceholderGlyph({ strokeWidth = 1.5 }: { strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
    >
      <rect x="4" y="3.5" width="16" height="17" rx="1.5" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

export function Icon({
  slot,
  size = 'md',
  className,
  decorative = false,
  strokeWidth,
}: {
  slot: IconSlot;
  size?: keyof typeof sizeMap;
  className?: string;
  /** When the adjacent text already names the thing, hide the icon from a11y. */
  decorative?: boolean;
  strokeWidth?: number;
}) {
  const meta = ICON_REGISTRY[slot];
  return (
    <span
      className={cx('inline-flex text-ink', sizeMap[size], className)}
      data-icon-slot={slot}
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : meta.label}
      title={meta.label}
    >
      <PlaceholderGlyph strokeWidth={strokeWidth} />
    </span>
  );
}
