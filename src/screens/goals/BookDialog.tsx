import { useEffect, useId, useRef } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MeanderDivider, SealButton } from '@/components/primitives';
import { cx } from '@/theme';
import { Field, controlClass, labelClass } from './fields';
import { StarRatingInput } from './parts';
import { bookFormSchema, type BookFormValues } from './goalForms';

/**
 * Add or edit a book in a native <dialog> (accessible focus trapping + Escape-to-close).
 * The rating is a keyboard-reachable star radiogroup driven through react-hook-form's
 * controlled value. On submit the caller maps + revalidates to `newBookInput`.
 */
export function BookDialog({
  open,
  mode,
  initialValues,
  pending,
  error,
  onSubmit,
  onClose,
}: {
  open: boolean;
  mode: 'add' | 'edit';
  initialValues: BookFormValues;
  pending: boolean;
  error: unknown;
  onSubmit: (values: BookFormValues) => Promise<unknown>;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const ratingLabelId = useId();

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema) as unknown as Resolver<BookFormValues>,
    defaultValues: initialValues,
    mode: 'onBlur',
  });
  const errors = form.formState.errors;
  const rating = form.watch('rating');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      form.reset(initialValues);
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
    // Reseed only on an open transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      className={cx(
        'w-[min(38rem,94vw)] rounded-plaque bg-plaster-deep p-0 text-ink',
        'shadow-xl shadow-ink/30 backdrop:bg-ink/50',
      )}
    >
      <form
        noValidate
        className="max-h-[86vh] overflow-y-auto p-6 sm:p-8"
        onSubmit={form.handleSubmit((values) => onSubmit(values))}
      >
        <p className="font-sans text-xs uppercase tracking-[0.22em] text-ochre">
          {mode === 'add' ? 'Log a book you have read' : 'Revise this book'}
        </p>
        <h2 id={titleId} className="mt-2 font-display text-2xl text-ink sm:text-3xl">
          {mode === 'add' ? 'Add a book' : 'Edit book'}
        </h2>
        <MeanderDivider tone="text-ochre/60" height={12} className="my-5 max-w-[10rem]" />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
          <Field
            label="Title"
            htmlFor="book-title"
            error={errors.title?.message}
            className="sm:col-span-6"
          >
            <input
              id="book-title"
              type="text"
              className={controlClass(Boolean(errors.title))}
              aria-invalid={errors.title ? true : undefined}
              {...form.register('title')}
            />
          </Field>
          <Field
            label="Author"
            htmlFor="book-author"
            error={errors.author?.message}
            className="sm:col-span-4"
          >
            <input
              id="book-author"
              type="text"
              placeholder="Optional"
              className={controlClass(Boolean(errors.author))}
              {...form.register('author')}
            />
          </Field>
          <Field
            label="Finished"
            htmlFor="book-finished"
            hint="Leave blank if still reading"
            error={errors.finishedDate?.message}
            className="sm:col-span-2"
          >
            <input
              id="book-finished"
              type="date"
              className={controlClass(Boolean(errors.finishedDate))}
              {...form.register('finishedDate')}
            />
          </Field>

          <div className="sm:col-span-6">
            <span id={ratingLabelId} className={labelClass}>
              Rating
            </span>
            <div className="mt-1.5">
              <StarRatingInput
                value={rating}
                onChange={(v) => form.setValue('rating', v, { shouldDirty: true })}
                labelId={ratingLabelId}
              />
            </div>
          </div>

          <Field
            label="Note"
            htmlFor="book-note"
            error={errors.note?.message}
            className="sm:col-span-6"
          >
            <textarea
              id="book-note"
              rows={2}
              placeholder="Optional"
              className={controlClass(Boolean(errors.note))}
              {...form.register('note')}
            />
          </Field>
        </div>

        {error ? (
          <p role="alert" className="mt-4 font-sans text-sm text-pompeian-red">
            {error instanceof Error ? error.message : 'Could not save the book.'}
          </p>
        ) : null}

        <div className="mt-7 flex justify-end gap-3">
          <SealButton type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </SealButton>
          <SealButton type="submit" loading={pending}>
            {mode === 'add' ? 'Add book' : 'Save changes'}
          </SealButton>
        </div>
      </form>
    </dialog>
  );
}
