import { useEffect, useId, useRef } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MeanderDivider, SealButton } from '@/components/primitives';
import { cx } from '@/theme';
import type { NewViceInput } from '@/lib/domain/schemas';
import { ViceForm } from './ViceForm';
import {
  toDomain,
  viceFormSchema,
  type ViceFormValues,
} from './viceForms';

/**
 * Add/edit a vice in a native <dialog> (focus trapping and Escape-to-close come for
 * free and accessibly). Owns the react-hook-form instance; on submit it maps + revalidates
 * to `newViceInput` and hands it up. Token-styled, no inline hex; the backdrop uses the
 * `backdrop:` variant.
 */
export function ViceDialog({
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
  initialValues: ViceFormValues;
  pending: boolean;
  error: unknown;
  onSubmit: (input: NewViceInput) => Promise<unknown>;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const form = useForm<ViceFormValues>({
    resolver: zodResolver(viceFormSchema) as unknown as Resolver<ViceFormValues>,
    defaultValues: initialValues,
    mode: 'onBlur',
  });

  // Sync open state to the native dialog, and reseed the form each time it opens.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      form.reset(initialValues);
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
    // Reseed only on an open transition, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function submit(values: ViceFormValues) {
    const input = toDomain(values);
    await onSubmit(input);
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      className={cx(
        'w-[min(40rem,94vw)] rounded-plaque bg-plaster-deep p-0 text-ink',
        'shadow-xl shadow-ink/30',
        'backdrop:bg-ink/50',
      )}
    >
      <form
        noValidate
        className="max-h-[86vh] overflow-y-auto p-6 sm:p-8"
        onSubmit={form.handleSubmit(submit)}
      >
        <p className="font-sans text-xs uppercase tracking-[0.22em] text-ochre">
          {mode === 'add' ? 'Name what you are quitting' : 'Revise this vice'}
        </p>
        <h2 id={titleId} className="mt-2 font-display text-2xl text-ink sm:text-3xl">
          {mode === 'add' ? 'Record a vice' : 'Edit vice'}
        </h2>
        <MeanderDivider tone="text-ochre/60" height={12} className="my-5 max-w-[10rem]" />

        <ViceForm form={form} />

        {error ? (
          <p role="alert" className="mt-4 font-sans text-sm text-pompeian-red">
            {error instanceof Error ? error.message : 'Could not save the vice.'}
          </p>
        ) : null}

        <div className="mt-7 flex justify-end gap-3">
          <SealButton type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </SealButton>
          <SealButton type="submit" loading={pending}>
            {mode === 'add' ? 'Record vice' : 'Save changes'}
          </SealButton>
        </div>
      </form>
    </dialog>
  );
}
