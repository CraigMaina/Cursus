import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plaque, Icon, MedallionBadge } from '@/components/primitives';
import { useData } from '@/app/data-context';
import { daysClean } from '@/lib/domain/compute';
import { cx } from '@/theme';
import type { Vice } from '@/lib/domain/schemas';
import { todayIso } from '../today/dates';

/**
 * VicePlaque — one vice as a fresco plaque in the list (PRD 4.1 #6). Carries the
 * broken-chain vice motif, the days-clean count on a small medallion, and the quit
 * date. It reads the vice's relapse history (shared cache with the detail screen) so
 * the count is anchored on the most recent relapse, not merely the quit date. The
 * whole plaque links through to the detail screen.
 */
export function VicePlaque({ vice }: { vice: Vice }) {
  const data = useData();
  const today = todayIso();

  // Shares the ['relapses', viceId] cache the detail screen populates.
  const relapsesQuery = useQuery({
    queryKey: ['relapses', vice.id],
    queryFn: () => data.listRelapses(vice.id),
  });

  const lastRelapse = useMemo(() => {
    const rows = relapsesQuery.data ?? [];
    if (rows.length === 0) return null;
    return rows.reduce<string>(
      (max, r) => (r.relapseDate > max ? r.relapseDate : max),
      rows[0].relapseDate,
    );
  }, [relapsesQuery.data]);

  const days = daysClean(vice.quitDate, lastRelapse, today);

  return (
    <Link
      to={`/vices/${vice.id}`}
      className={cx(
        'group block h-full rounded-plaque',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egyptian',
      )}
    >
      <Plaque as="article" meanderTop className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.16em] text-ink/55">
              <Icon slot="vice" size="sm" decorative />
              Quit {vice.quitDate}
            </span>
            <h3 className="mt-2 font-display text-2xl leading-tight text-ink group-hover:text-pompeian-red">
              {vice.name}
            </h3>
          </div>
          <MedallionBadge
            value={days}
            label={`${days} days clean`}
            size="sm"
            tone="text-verdigris"
            laurel={false}
          />
        </div>

        <p className="mt-4 inline-flex items-center gap-2 font-serif text-ink/70">
          <Icon slot="days_clean" size="sm" decorative className="text-verdigris" />
          <span>
            <span className="font-display text-lg text-ink">{days}</span>{' '}
            {days === 1 ? 'day clean' : 'days clean'}
          </span>
        </p>

        {vice.reason ? (
          <p className="mt-3 line-clamp-2 font-serif text-sm text-ink/60">{vice.reason}</p>
        ) : null}

        <span className="mt-auto pt-5 font-sans text-xs uppercase tracking-[0.16em] text-ochre">
          Open the record
        </span>
      </Plaque>
    </Link>
  );
}
