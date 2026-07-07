import { cx, Meander } from '@/theme';

/**
 * MeanderDivider — a Greek-key section rule (PRD section 8). Use to separate
 * editorial sections or cap a card. Tints via a `text-*` token class; defaults to a
 * muted ochre so it reads as an accent, not a hard line.
 */
export function MeanderDivider({
  className,
  tone = 'text-ochre/70',
  height = 16,
  label,
}: {
  className?: string;
  tone?: string;
  height?: number;
  /** Optional accessible label; omit for a purely decorative rule. */
  label?: string;
}) {
  return (
    <div className={cx('w-full', className)} role={label ? 'separator' : undefined} aria-label={label}>
      <Meander className={tone} height={height} title={label} />
    </div>
  );
}
