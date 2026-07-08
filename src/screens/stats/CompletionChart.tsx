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
import { Plaque } from '@/components/primitives';
import { useChartPalette } from './chartTokens';
import { formatLongDate } from '../today/dates';
import type { CompletionPoint } from './statsModel';

/**
 * Completion-over-time chart (PRD 4.1 #9). A cumulative required-rule completion line on
 * a plaster ground, with Strict-reset days marked as brick scars (matching the
 * calendar's reset semantics). Colors come from the token CSS variables by name (no
 * hex in JSX). Fully accessible: an aria summary, and a keyboard-reachable data table
 * fallback in a <details> so the series is never color- or vision-only.
 */
export function CompletionChart({
  points,
  resets,
}: {
  points: CompletionPoint[];
  resets: { day: number; date: string }[];
}) {
  const palette = useChartPalette();
  const gradientId = useId().replace(/[:]/g, '');
  const latest = points.length ? points[points.length - 1] : null;

  const summary =
    latest != null
      ? `Cumulative completion reached ${latest.cumulativePct} percent by day ${latest.day}.` +
        (resets.length
          ? ` ${resets.length} Strict reset${resets.length === 1 ? '' : 's'} in this window.`
          : ' No resets in this window.')
      : 'No days recorded yet.';

  return (
    <Plaque>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-xl text-ink">Completion over time</h2>
        <p className="font-sans text-xs uppercase tracking-[0.16em] text-ink/55">
          Cumulative
        </p>
      </div>
      <p className="mt-1 font-serif text-sm text-ink/70">
        The share of required rules kept, accumulated day by day.
      </p>

      <figure className="mt-6" role="group" aria-label="Completion over time chart">
        <p className="sr-only">{summary}</p>
        <div className="h-64 w-full" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.verdigris} stopOpacity={0.42} />
                  <stop offset="100%" stopColor={palette.verdigris} stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={palette.ink} strokeOpacity={0.08} vertical={false} />
              <XAxis
                dataKey="day"
                type="number"
                domain={[1, 'dataMax']}
                tick={{ fill: palette.ink, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: palette.ink, strokeOpacity: 0.2 }}
                stroke={palette.ink}
                minTickGap={24}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(v: number) => `${v}%`}
                tick={{ fill: palette.ink, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip
                cursor={{ stroke: palette.ink, strokeOpacity: 0.25 }}
                content={<CompletionTooltip />}
              />
              {resets.map((r) => (
                <ReferenceLine
                  key={`${r.day}-${r.date}`}
                  x={r.day}
                  stroke={palette.red}
                  strokeWidth={2}
                  strokeDasharray="4 3"
                />
              ))}
              <Area
                type="monotone"
                dataKey="cumulativePct"
                stroke={palette.verdigris}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{ r: 4, fill: palette.verdigris, stroke: palette.plaster, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {resets.length ? (
          <p className="mt-3 flex items-center gap-2 font-sans text-xs uppercase tracking-[0.14em] text-ink/55">
            <span
              aria-hidden="true"
              className="inline-block h-0 w-6 border-t-2 border-dashed border-pompeian-red"
            />
            Strict reset
          </p>
        ) : null}

        <details className="mt-4 group">
          <summary className="cursor-pointer font-sans text-xs uppercase tracking-[0.16em] text-pompeian-red underline-offset-4 hover:underline">
            View as table
          </summary>
          <div className="mt-3 max-h-64 overflow-auto rounded-plaque border border-ink/15">
            <table className="w-full border-collapse text-left font-sans text-sm">
              <caption className="sr-only">
                Cumulative completion percentage by day, with reset days noted.
              </caption>
              <thead>
                <tr className="bg-plaster-deep/70 text-ink/70">
                  <th scope="col" className="px-3 py-2 font-medium">Day</th>
                  <th scope="col" className="px-3 py-2 font-medium">Date</th>
                  <th scope="col" className="px-3 py-2 font-medium">Completion</th>
                  <th scope="col" className="px-3 py-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {points.map((p) => (
                  <tr key={p.day} className="border-t border-ink/10 text-ink/80">
                    <td className="px-3 py-1.5">{p.day}</td>
                    <td className="px-3 py-1.5">{formatLongDate(p.date)}</td>
                    <td className="px-3 py-1.5">{p.cumulativePct}%</td>
                    <td className="px-3 py-1.5 text-pompeian-red">
                      {p.reset ? 'Reset' : p.complete ? '' : 'Missed'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </figure>
    </Plaque>
  );
}

function CompletionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: CompletionPoint }[];
}) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-plaque border border-ink/20 bg-plaster-deep px-3 py-2 shadow-sm shadow-ink/20">
      <p className="font-sans text-xs uppercase tracking-[0.16em] text-ink/60">
        Day {p.day}
      </p>
      <p className="mt-0.5 font-display text-lg text-ink">{p.cumulativePct}%</p>
      <p className="font-serif text-xs text-ink/70">
        {p.reset ? 'Strict reset' : p.complete ? 'Day complete' : 'Day missed'}
      </p>
    </div>
  );
}
