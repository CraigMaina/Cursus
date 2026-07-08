import { useId } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatLongDate } from '../today/dates';
import { useChartPalette } from './chartTokens';
import { formatValue, type MetricPoint } from './goalModel';

/**
 * Metric line/area chart (D16). Plots measurements over time on a plaster ground with a
 * dashed target reference line. Colors come from the token CSS variables by name (no hex
 * in JSX). Accessible: an aria summary plus a keyboard-reachable data table fallback in a
 * <details>, so the series is never vision- or color-only.
 */
export function MetricChart({
  points,
  target,
  unit,
}: {
  points: MetricPoint[];
  target: number | null;
  unit: string | null;
}) {
  const palette = useChartPalette();
  const gradientId = useId().replace(/[:]/g, '');
  const suffix = unit ? ` ${unit}` : '';
  const latest = points.length ? points[points.length - 1] : null;

  const summary =
    latest != null
      ? `Most recent measurement ${formatValue(latest.value)}${suffix} on ${formatLongDate(latest.date)}.` +
        (target != null ? ` Target ${formatValue(target)}${suffix}.` : '')
      : 'No measurements recorded yet.';

  if (points.length === 0) {
    return (
      <p className="font-serif text-ink/60">
        No measurements yet. Add one to start the chart.
      </p>
    );
  }

  return (
    <figure role="group" aria-label="Measurements over time chart">
      <p className="sr-only">{summary}</p>
      <div className="h-64 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette.egyptian} stopOpacity={0.4} />
                <stop offset="100%" stopColor={palette.egyptian} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={palette.ink} strokeOpacity={0.08} vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(v: string) => v.slice(5)}
              tick={{ fill: palette.ink, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: palette.ink, strokeOpacity: 0.2 }}
              stroke={palette.ink}
              minTickGap={24}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fill: palette.ink, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip
              cursor={{ stroke: palette.ink, strokeOpacity: 0.25 }}
              content={<MetricTooltip suffix={suffix} />}
            />
            {target != null ? (
              <ReferenceLine
                y={target}
                stroke={palette.red}
                strokeWidth={2}
                strokeDasharray="4 3"
              />
            ) : null}
            <Area
              type="monotone"
              dataKey="value"
              stroke={palette.egyptian}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={{ r: 2.5, fill: palette.egyptian, stroke: palette.plaster, strokeWidth: 1 }}
              activeDot={{ r: 4, fill: palette.egyptian, stroke: palette.plaster, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {target != null ? (
        <p className="mt-3 flex items-center gap-2 font-sans text-xs uppercase tracking-[0.14em] text-ink/55">
          <span
            aria-hidden="true"
            className="inline-block h-0 w-6 border-t-2 border-dashed border-pompeian-red"
          />
          Target {formatValue(target)}
          {suffix}
        </p>
      ) : null}

      <details className="mt-4">
        <summary className="cursor-pointer font-sans text-xs uppercase tracking-[0.16em] text-pompeian-red underline-offset-4 hover:underline">
          View as table
        </summary>
        <div className="mt-3 max-h-64 overflow-auto rounded-plaque border border-ink/15">
          <table className="w-full border-collapse text-left font-sans text-sm">
            <caption className="sr-only">Each measurement by date.</caption>
            <thead>
              <tr className="bg-plaster-deep/70 text-ink/70">
                <th scope="col" className="px-3 py-2 font-medium">Date</th>
                <th scope="col" className="px-3 py-2 font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((p) => (
                <tr key={p.date} className="border-t border-ink/10 text-ink/80">
                  <td className="px-3 py-1.5">{formatLongDate(p.date)}</td>
                  <td className="px-3 py-1.5">
                    {formatValue(p.value)}
                    {suffix}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

function MetricTooltip({
  active,
  payload,
  suffix,
}: {
  active?: boolean;
  payload?: { payload: MetricPoint }[];
  suffix: string;
}) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-plaque border border-ink/20 bg-plaster-deep px-3 py-2 shadow-sm shadow-ink/20">
      <p className="font-sans text-xs uppercase tracking-[0.16em] text-ink/60">
        {formatLongDate(p.date)}
      </p>
      <p className="mt-0.5 font-display text-lg text-ink">
        {formatValue(p.value)}
        {suffix}
      </p>
    </div>
  );
}
