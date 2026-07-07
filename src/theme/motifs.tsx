import { useId } from 'react';
import { cx } from './cx';

/**
 * Classical motif SVGs (PRD section 8 — used sparingly, never decoratively
 * everywhere). Every stroke/fill is `currentColor`, so a motif inherits whatever
 * token color the parent sets via a `text-*` utility (text-ink, text-ochre,
 * text-pompeian-red, ...). No inline hex lives here.
 */

/**
 * Greek meander (key) border. Renders as a horizontal band that tiles to any width
 * via an SVG pattern, so it works as a section divider or a card-top rule.
 */
export function Meander({
  className,
  height = 16,
  strokeWidth = 2,
  title,
}: {
  className?: string;
  height?: number;
  strokeWidth?: number;
  title?: string;
}) {
  const id = useId();
  const patternId = `meander-${id}`;
  return (
    <svg
      className={cx('text-ink', className)}
      width="100%"
      height={height}
      viewBox={`0 0 24 24`}
      preserveAspectRatio="none"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <pattern
          id={patternId}
          x="0"
          y="0"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          {/* Continuous Greek key unit; the bottom rail links neighbouring tiles. */}
          <path
            d="M0 22 H24 M4 22 V4 H20 V16 H10 V10 H14"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="square"
            vectorEffect="non-scaling-stroke"
          />
        </pattern>
      </defs>
      <rect x="0" y="0" width="24" height="24" fill={`url(#${patternId})`} />
    </svg>
  );
}

/**
 * Laurel wreath, open at the top, for framing milestone badges and quote cards.
 * Two symmetric branches computed along an arc; leaves fill `currentColor`.
 * Pass `children`-free — it is a frame; place content over it with positioning.
 */
export function Laurel({
  className,
  size = 120,
  title,
}: {
  className?: string;
  size?: number;
  title?: string;
}) {
  const cx0 = 60;
  const cy0 = 62;
  const radius = 44;
  const leafCount = 9;
  // Left branch sweeps from lower-left up toward the top opening.
  const startAngle = 205; // degrees
  const endAngle = 100;
  const leaves = Array.from({ length: leafCount }, (_, i) => {
    const t = i / (leafCount - 1);
    const angle = (startAngle + (endAngle - startAngle) * t) * (Math.PI / 180);
    const x = cx0 + radius * Math.cos(angle);
    const y = cy0 - radius * Math.sin(angle);
    // Leaf points outward and slightly along the branch direction.
    const rot = -angle * (180 / Math.PI) + 90;
    return { x, y, rot, scale: 0.85 + 0.35 * (1 - Math.abs(0.5 - t) * 2) };
  });

  const branch = (mirror: boolean) => (
    <g transform={mirror ? `translate(${cx0 * 2} 0) scale(-1 1)` : undefined}>
      {/* Stem: an arc following the leaf path. */}
      <path
        d={`M ${cx0 + radius * Math.cos((startAngle * Math.PI) / 180)} ${
          cy0 - radius * Math.sin((startAngle * Math.PI) / 180)
        } A ${radius} ${radius} 0 0 1 ${
          cx0 + radius * Math.cos((endAngle * Math.PI) / 180)
        } ${cy0 - radius * Math.sin((endAngle * Math.PI) / 180)}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {leaves.map((leaf, i) => (
        <ellipse
          key={i}
          cx={leaf.x}
          cy={leaf.y}
          rx={3.2 * leaf.scale}
          ry={7 * leaf.scale}
          transform={`rotate(${leaf.rot} ${leaf.x} ${leaf.y})`}
          fill="currentColor"
        />
      ))}
    </g>
  );

  return (
    <svg
      className={cx('text-ochre', className)}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      {branch(false)}
      {branch(true)}
    </svg>
  );
}
