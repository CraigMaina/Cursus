import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import { SealButton } from '@/components/primitives';
import { Icon } from '@/components/primitives';
import { emptyRule, type BuilderFormValues } from './builderForms';
import { RuleRow } from './RuleRow';

/**
 * Rules editor (PRD 4.1 #3) — the reorderable list of rules. Owns the react-hook-form
 * field array: append, remove, and move (reorder) all run through it, and `sortOrder`
 * is derived from array position at save time. Each row validates against
 * `builderRuleSchema` through the shared resolver.
 */
export function RulesEditor({ form }: { form: UseFormReturn<BuilderFormValues> }) {
  const { control, register, watch, setValue, formState } = form;
  const { fields, append, remove, move } = useFieldArray({ control, name: 'rules' });
  const watched = watch('rules');

  const rootError =
    formState.errors.rules && !Array.isArray(formState.errors.rules)
      ? (formState.errors.rules as { message?: string }).message
      : undefined;

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <h2 className="font-display text-xl text-ink">The rules</h2>
          <p className="mt-1 font-serif text-sm text-ink/60">
            Each rule is one thing you seal each day. Reorder them into the sequence you
            keep them in.
          </p>
        </div>
        <p className="font-sans text-xs uppercase tracking-[0.16em] text-ink/50">
          {fields.length} {fields.length === 1 ? 'rule' : 'rules'}
        </p>
      </div>

      <ol className="flex flex-col gap-4">
        {fields.map((field, index) => (
          <li key={field.id}>
            <RuleRow
              index={index}
              total={fields.length}
              value={watched?.[index] ?? emptyRule()}
              register={register}
              errors={formState.errors.rules?.[index]}
              required={watched?.[index]?.isRequired ?? true}
              onRequiredChange={(next) =>
                setValue(`rules.${index}.isRequired`, next, { shouldDirty: true })
              }
              onMoveUp={() => move(index, index - 1)}
              onMoveDown={() => move(index, index + 1)}
              onRemove={() => remove(index)}
            />
          </li>
        ))}
      </ol>

      {rootError ? (
        <p role="alert" className="mt-3 font-sans text-sm text-pompeian-red">
          {rootError}
        </p>
      ) : null}

      <div className="mt-5">
        <SealButton
          type="button"
          variant="ghost"
          onClick={() => append(emptyRule())}
          leading={<Icon slot="add" size="sm" decorative />}
        >
          Add a rule
        </SealButton>
      </div>
    </div>
  );
}
