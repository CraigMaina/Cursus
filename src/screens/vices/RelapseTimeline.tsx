import { Icon } from '@/components/primitives';
import type { Relapse } from '@/lib/domain/schemas';
import { formatLongDate } from '../today/dates';

/**
 * RelapseTimeline — the kept history of relapses (PRD 4.1 #6). Logging a relapse resets
 * the days-clean counter but never erases the past; every fall is listed here, newest
 * first, so the record stays honest. Rendered as an ordered list for screen readers.
 */
export function RelapseTimeline({ relapses }: { relapses: Relapse[] }) {
  return (
    <section aria-labelledby="relapse-history-title">
      <div className="flex items-center gap-2">
        <Icon slot="relapse" size="md" decorative className="text-pompeian-red" />
        <h2 id="relapse-history-title" className="font-display text-2xl text-ink">
          The record
        </h2>
      </div>

      {relapses.length === 0 ? (
        <p className="mt-3 font-serif text-ink/65">
          No relapses recorded. The count has held since the day you quit.
        </p>
      ) : (
        <ol className="mt-5 border-l border-ink/15 pl-5">
          {relapses.map((r) => (
            <li key={r.id} className="relative pb-6 last:pb-0">
              <span
                aria-hidden
                className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full border border-pompeian-red bg-plaster"
              />
              <p className="font-sans text-xs uppercase tracking-[0.16em] text-ink/55">
                {formatLongDate(r.relapseDate)}
              </p>
              {r.note ? (
                <p className="mt-1 font-serif text-ink/75">{r.note}</p>
              ) : (
                <p className="mt-1 font-serif text-sm italic text-ink/45">No note.</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
