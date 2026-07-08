import { Plaque, Icon, MeanderDivider } from '@/components/primitives';
import { splitMinutes, type Savings } from '@/lib/domain/compute';
import type { Vice } from '@/lib/domain/schemas';

/**
 * SavingsPanel — reclaimed money and time (PRD 4.1 #6). Renders only the dimensions
 * that have data (a dimension with any null input is omitted, per `computeSavings`).
 * Money is shown as a plain formatted number because the vice carries no currency; the
 * caption names the rate. Time is split into days/hours/minutes via `splitMinutes`.
 * Recomputes as days-clean grows because the parent recomputes `savings` each render.
 */
export function SavingsPanel({
  vice,
  savings,
  days,
}: {
  vice: Vice;
  savings: Savings;
  days: number;
}) {
  const showMoney = savings.money != null;
  const showTime = savings.minutes != null;

  if (!showMoney && !showTime) {
    return (
      <Plaque>
        <p className="font-sans text-xs uppercase tracking-[0.22em] text-ochre">
          What you reclaim
        </p>
        <p className="mt-3 font-serif text-ink/65">
          Add a unit cost or a unit time along with a daily amount, and this panel will
          tally the money and time you have saved since you quit.
        </p>
      </Plaque>
    );
  }

  const unit = vice.unitLabel ?? 'unit';

  return (
    <Plaque meanderTop>
      <div className="flex items-center gap-2">
        <Icon slot="savings" size="md" decorative className="text-verdigris" />
        <h2 className="font-display text-2xl text-ink">What you have reclaimed</h2>
      </div>
      <p className="mt-1 font-serif text-sm text-ink/55">
        Over {days} {days === 1 ? 'day' : 'days'} clean
        {vice.dailyUnits != null ? `, at ${formatNumber(vice.dailyUnits)} ${unit} per day avoided` : ''}.
      </p>

      <MeanderDivider tone="text-ochre/50" height={12} className="my-6" />

      <dl className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        {showMoney ? (
          <div>
            <dt className="font-sans text-xs uppercase tracking-[0.18em] text-ink/55">
              Money not spent
            </dt>
            <dd className="mt-2 font-display text-4xl text-ink sm:text-5xl">
              {formatNumber(savings.money!)}
            </dd>
            {vice.costPerUnit != null ? (
              <p className="mt-2 font-serif text-sm text-ink/55">
                at {formatNumber(vice.costPerUnit)} per {unit}, in your own currency
              </p>
            ) : null}
          </div>
        ) : null}

        {showTime ? (
          <div>
            <dt className="font-sans text-xs uppercase tracking-[0.18em] text-ink/55">
              Time given back
            </dt>
            <dd className="mt-2 font-display text-3xl text-ink sm:text-4xl">
              {formatDuration(savings.minutes!)}
            </dd>
            {vice.timePerUnitMinutes != null ? (
              <p className="mt-2 font-serif text-sm text-ink/55">
                at {formatNumber(vice.timePerUnitMinutes)} minutes per {unit}
              </p>
            ) : null}
          </div>
        ) : null}
      </dl>
    </Plaque>
  );
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
}

/** Whole days / hours / minutes, omitting leading zero segments. */
function formatDuration(totalMinutes: number): string {
  const { days, hours, minutes } = splitMinutes(totalMinutes);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
  return parts.join(' ');
}
