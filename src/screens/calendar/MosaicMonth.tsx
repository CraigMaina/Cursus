import { MosaicTile } from '@/components/primitives';
import { cx } from '@/theme';
import type { MonthView } from './calendarModel';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Day-of-month number from a 'YYYY-MM-DD'. */
function dom(date: string): number {
  return Number(date.slice(8, 10));
}

/**
 * One month of the progress mosaic (PRD 4.1 #5, section 8). A Monday-first grid of
 * MosaicTile tesserae over a warm grout ground. Challenge days are interactive
 * (tap to backfill); dates outside the challenge window are dimmed grout, and a
 * recorded Strict reset carries the break-line scar via the tile's `reset` state.
 */
export function MosaicMonth({
  month,
  onSelectDay,
}: {
  month: MonthView;
  onSelectDay: (date: string) => void;
}) {
  return (
    <div>
      <div
        className="grid grid-cols-7 gap-2 rounded-plaque border border-ink/10 bg-ink/[0.04] p-3 sm:gap-2.5 sm:p-4"
        role="grid"
        aria-label={`Progress mosaic for ${month.label}`}
      >
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            role="columnheader"
            className="pb-1 text-center font-sans text-[0.6rem] uppercase tracking-[0.14em] text-ink/45"
          >
            {w}
          </div>
        ))}

        {month.weeks.map((week, wi) => (
          <div key={wi} role="row" className="contents">
            {week.map((cell, ci) => {
              if (cell.pad) {
                return <span key={`p-${wi}-${ci}`} role="gridcell" aria-hidden className="h-9 w-full" />;
              }
              if (cell.outOfRange || !cell.day) {
                return (
                  <span
                    key={cell.date}
                    role="gridcell"
                    aria-label={`${dom(cell.date)}, outside the challenge`}
                    className="flex h-9 items-center justify-center rounded-tessera bg-plaster/40 font-sans text-[0.6rem] tabular-nums text-ink/25"
                  >
                    {dom(cell.date)}
                  </span>
                );
              }
              const day = cell.day;
              return (
                <span key={cell.date} role="gridcell" className="flex items-center justify-center">
                  <MosaicTile
                    state={day.state}
                    dayLabel={dom(cell.date)}
                    onSelect={() => onSelectDay(cell.date)}
                    className="h-9 w-full"
                  />
                </span>
              );
            })}
          </div>
        ))}
      </div>

      <Legend />
    </div>
  );
}

const LEGEND: { state: string; label: string; swatch: string }[] = [
  { state: 'complete', label: 'Held', swatch: 'bg-pompeian-red' },
  { state: 'partial', label: 'Partial', swatch: 'bg-ochre/80' },
  { state: 'missed', label: 'Missed', swatch: 'bg-ink/15' },
  { state: 'rest', label: 'Rest', swatch: 'bg-verdigris/45' },
  { state: 'future', label: 'Ahead', swatch: 'bg-plaster-deep' },
  { state: 'reset', label: 'Reset scar', swatch: 'bg-ink/15 ring-1 ring-pompeian-red/70' },
];

function Legend() {
  return (
    <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
      {LEGEND.map((item) => (
        <li key={item.state} className="flex items-center gap-2">
          <span
            aria-hidden
            className={cx('inline-block h-3 w-3 rounded-tessera', item.swatch)}
          />
          <span className="font-sans text-[0.68rem] uppercase tracking-[0.12em] text-ink/55">
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
