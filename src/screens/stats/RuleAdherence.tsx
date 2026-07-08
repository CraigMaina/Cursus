import { Plaque, Icon } from '@/components/primitives';
import { cx } from '@/theme';
import type { RuleAdherence as Adherence } from '@/lib/domain/stats';
import type { Rule } from '@/lib/domain/schemas';
import { ratePct } from './statsModel';

/**
 * Per-rule adherence (PRD 4.1 #9). Each rule is a plaque row with its icon, name, a
 * token-colored meter bar, and its rate as a carved percentage. The rate sits directly
 * on the row (never color-alone) and each bar is an ARIA meter, so the section is
 * legible to screen readers and satisfies the contrast relief for the gold fill. Bars
 * use bg-ochre by token name; no inline hex.
 */
export function RuleAdherence({
  perRule,
  rulesById,
}: {
  perRule: Adherence[];
  rulesById: Map<string, Rule>;
}) {
  return (
    <Plaque>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-xl text-ink">Per-rule adherence</h2>
        <p className="font-sans text-xs uppercase tracking-[0.16em] text-ink/55">
          Kept vs expected
        </p>
      </div>
      <p className="mt-1 font-serif text-sm text-ink/70">
        How reliably each rule has been sealed over the elapsed window.
      </p>

      <ul className="mt-6 flex flex-col gap-4">
        {perRule.map((r) => {
          const pct = ratePct(r.rate);
          const rule = rulesById.get(r.ruleId);
          return (
            <li key={r.ruleId}>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-plaque bg-plaster-deep/70">
                  <Icon
                    slot={rule?.iconSlot ?? 'streak'}
                    size="md"
                    decorative
                    className="text-ink/70"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate font-serif text-base text-ink">{r.name}</p>
                    <p className="shrink-0 font-display text-lg text-ink">{pct}%</p>
                  </div>
                  <div
                    role="meter"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${r.name}: ${pct} percent adherence, ${r.completed} of ${r.expected}`}
                    className="mt-1.5 h-2.5 w-full overflow-hidden rounded-tessera bg-ink/10"
                  >
                    <div
                      className={cx('h-full rounded-tessera', pct >= 100 ? 'bg-verdigris' : 'bg-ochre')}
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                  <p className="mt-1 font-sans text-xs uppercase tracking-[0.14em] text-ink/50">
                    {r.completed} of {r.expected} kept
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {perRule.length === 0 ? (
        <p className="mt-4 font-serif text-sm text-ink/60">No rules to report yet.</p>
      ) : null}
    </Plaque>
  );
}
