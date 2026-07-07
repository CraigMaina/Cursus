import { cx } from '@/theme';
import type { Strictness } from '@/lib/domain/schemas';

/**
 * StrictnessTag — a small token pill naming a challenge's strictness mode (PRD 3).
 * Strict reads in brick red (the reset-on-miss mode), Standard in Egyptian blue.
 */
const styles: Record<Strictness, { label: string; className: string }> = {
  strict: {
    label: 'Strict',
    className: 'border-pompeian-red/40 bg-pompeian-red/10 text-pompeian-red',
  },
  standard: {
    label: 'Standard',
    className: 'border-egyptian/40 bg-egyptian/10 text-egyptian',
  },
  freeze: {
    label: 'Freeze',
    className: 'border-verdigris/40 bg-verdigris/10 text-verdigris',
  },
};

export function StrictnessTag({ strictness }: { strictness: Strictness }) {
  const s = styles[strictness];
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-tessera border px-2 py-0.5 font-sans text-[0.65rem] font-medium uppercase tracking-[0.14em]',
        s.className,
      )}
    >
      {s.label}
    </span>
  );
}
