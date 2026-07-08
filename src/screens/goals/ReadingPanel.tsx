import { useState } from 'react';
import { Plaque, SealButton, Icon } from '@/components/primitives';
import type { Book, Goal } from '@/lib/domain/schemas';
import { formatLongDate } from '../today/dates';
import { useReading } from './useReading';
import { BookDialog } from './BookDialog';
import { ProgressBar, StarDisplay, ConfirmInline } from './parts';
import {
  finishedBooksCount,
  readingProgressPct,
  sortBooksForDisplay,
} from './goalModel';
import { bookToFormValues, emptyBook, toBookDomain, type BookFormValues } from './goalForms';

/**
 * Reading goal detail (D16). The finished-book count against the target, the books
 * logged (title, author, finished date, rating stars), and add / edit / remove. Reads
 * and writes ONLY through the DAL (`useReading` -> `useData`).
 */
export function ReadingPanel({ goal, authed }: { goal: Goal; authed: boolean }) {
  const r = useReading(goal.id, authed);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<Book | null>(null);

  const finished = finishedBooksCount(r.books);
  const pct = readingProgressPct(finished, goal.targetCount);
  const sorted = sortBooksForDisplay(r.books);

  async function submitAdd(values: BookFormValues) {
    await r.addBook(toBookDomain(goal.id, values));
    setAdding(false);
  }
  async function submitEdit(values: BookFormValues) {
    if (!editing) return;
    await r.updateBook(editing.id, toBookDomain(goal.id, values));
    setEditing(null);
  }

  return (
    <div>
      <Plaque>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.16em] text-ink/55">
              Books read
            </p>
            <p className="mt-1 font-display text-4xl text-ink">
              {finished}
              {goal.targetCount != null ? (
                <span className="text-2xl text-ink/60"> of {goal.targetCount}</span>
              ) : null}
            </p>
          </div>
          <SealButton
            onClick={() => setAdding(true)}
            leading={<Icon slot="add" size="sm" decorative className="text-plaster" />}
          >
            Add a book
          </SealButton>
        </div>
        {pct != null ? (
          <div className="mt-5">
            <ProgressBar pct={pct} tone="bg-ochre" label={`Reading progress: ${pct} percent`} />
            <p className="mt-1.5 font-sans text-xs uppercase tracking-[0.16em] text-ink/50">
              {pct}% of your target
            </p>
          </div>
        ) : null}
      </Plaque>

      <section className="mt-8">
        {r.loading ? (
          <p className="font-serif text-ink/50">Reading the shelf.</p>
        ) : r.error ? (
          <p role="alert" className="font-serif text-pompeian-red">
            {r.error instanceof Error ? r.error.message : 'Could not load your books.'}
          </p>
        ) : sorted.length === 0 ? (
          <div className="max-w-xl rounded-plaque border border-ink/15 bg-plaster-deep/60 p-8">
            <span className="inline-flex text-ochre">
              <Icon slot="reading" size="lg" decorative />
            </span>
            <h2 className="mt-4 font-display text-2xl text-ink">No books logged yet</h2>
            <p className="mt-2 font-serif text-ink/65">
              Add the books you finish and they will count toward your goal.
            </p>
            <div className="mt-6">
              <SealButton onClick={() => setAdding(true)}>Add your first book</SealButton>
            </div>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {sorted.map((b) => (
              <li key={b.id}>
                <Plaque as="article" className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-xl leading-tight text-ink">{b.title}</h3>
                      {b.author ? (
                        <p className="mt-0.5 font-serif text-sm text-ink/60">{b.author}</p>
                      ) : null}
                    </div>
                    {b.finishedDate ? (
                      <span className="shrink-0 font-sans text-xs uppercase tracking-[0.14em] text-verdigris">
                        Finished
                      </span>
                    ) : (
                      <span className="shrink-0 font-sans text-xs uppercase tracking-[0.14em] text-ink/45">
                        Reading
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <StarDisplay rating={b.rating} />
                  </div>
                  {b.finishedDate ? (
                    <p className="mt-2 font-sans text-xs uppercase tracking-[0.14em] text-ink/45">
                      {formatLongDate(b.finishedDate)}
                    </p>
                  ) : null}
                  {b.note ? (
                    <p className="mt-2 font-serif text-sm text-ink/65">{b.note}</p>
                  ) : null}

                  {confirmRemove?.id === b.id ? (
                    <ConfirmInline
                      label="Confirm remove"
                      message={`Remove "${b.title}" from this goal?`}
                      confirmText="Remove it"
                      pending={r.deletingBook}
                      onConfirm={() => {
                        r.deleteBook(b.id);
                        setConfirmRemove(null);
                      }}
                      onCancel={() => setConfirmRemove(null)}
                    />
                  ) : (
                    <div className="mt-auto flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => setEditing(b)}
                        className="font-sans text-xs uppercase tracking-[0.14em] text-ink/55 underline-offset-4 hover:text-ink hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmRemove(b)}
                        className="font-sans text-xs uppercase tracking-[0.14em] text-ink/45 underline-offset-4 hover:text-pompeian-red hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </Plaque>
              </li>
            ))}
          </ul>
        )}
      </section>

      <BookDialog
        open={adding}
        mode="add"
        initialValues={emptyBook()}
        pending={r.addingBook}
        error={r.addBookError}
        onSubmit={submitAdd}
        onClose={() => {
          if (!r.addingBook) {
            setAdding(false);
            r.resetAddBook();
          }
        }}
      />
      {editing ? (
        <BookDialog
          open={Boolean(editing)}
          mode="edit"
          initialValues={bookToFormValues(editing)}
          pending={r.updatingBook}
          error={r.updateBookError}
          onSubmit={submitEdit}
          onClose={() => {
            if (!r.updatingBook) {
              setEditing(null);
              r.resetUpdateBook();
            }
          }}
        />
      ) : null}
    </div>
  );
}
