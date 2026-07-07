import type { ReactNode } from 'react';
import { agedCard, cx, Meander, PlasterTexture } from '@/theme';

/**
 * Plaque — the base fresco card (PRD 4.1 #2, section 8). A plaster-deep ground with
 * grain, aged asymmetric edges, and an optional Greek-key top rule. This is the
 * surface template cards, panels, and forms sit on. Editorial by default (left
 * aligned, generous padding), never a centered material card.
 */
export function Plaque({
  children,
  className,
  meanderTop = false,
  as: Tag = 'section',
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  /** Draw a Greek meander rule across the top edge. */
  meanderTop?: boolean;
  as?: 'section' | 'article' | 'div';
  padded?: boolean;
}) {
  return (
    <Tag className={cx('relative overflow-hidden bg-plaster-deep text-ink', agedCard('plaque'), className)}>
      <PlasterTexture variant="card" />
      {meanderTop ? (
        <div className="relative">
          <Meander className="text-ochre/70" height={14} />
        </div>
      ) : null}
      <div className={cx('relative', padded && 'p-6 sm:p-8')}>{children}</div>
    </Tag>
  );
}
