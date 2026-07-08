import {
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form';
import { Icon, ICON_REGISTRY } from '@/components/primitives';
import { cx } from '@/theme';
import {
  ICON_SLOT_OPTIONS,
  RULE_FREQUENCY_LABELS,
  RULE_TYPE_LABELS,
  ruleNeedsTarget,
  type BuilderFormValues,
  type RuleFormValues,
} from './builderForms';
import { Field, Toggle, controlClass } from './fields';
import { ruleTypeEnum, ruleFrequencyEnum } from '@/lib/domain/schemas';

/**
 * One rule editor row (PRD 4.1 #3). Renders name, icon slot, type, and frequency, and
 * conditionally reveals target/unit (for quantity/duration) and a per-week count (for
 * n_per_week). Reorder and remove controls are real buttons with accessible labels.
 * All validation flows from `builderRuleSchema` via the parent's resolver.
 */
export function RuleRow({
  index,
  total,
  value,
  register,
  errors,
  required,
  onRequiredChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  index: number;
  total: number;
  value: RuleFormValues;
  register: UseFormRegister<BuilderFormValues>;
  errors: FieldErrors<RuleFormValues> | undefined;
  required: boolean;
  onRequiredChange: (next: boolean) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const base = `rules.${index}` as const;
  const needsTarget = ruleNeedsTarget(value.type);
  const isPerWeek = value.frequency === 'n_per_week';
  const rowLabel = value.name.trim() || `Rule ${index + 1}`;

  return (
    <fieldset
      className={cx(
        'relative rounded-plaque border border-ink/15 bg-plaster/60 p-5',
        'focus-within:border-ink/30',
      )}
    >
      <legend className="sr-only">{rowLabel}</legend>

      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2">
          <Icon slot={value.iconSlot} size="sm" decorative className="text-ochre" />
          <span className="font-display text-sm uppercase tracking-[0.14em] text-ink/70">
            {rowLabel}
          </span>
        </span>
        <div className="flex items-center gap-1">
          <RowIconButton
            label={`Move ${rowLabel} up`}
            disabled={index === 0}
            onClick={onMoveUp}
            glyph="up"
          />
          <RowIconButton
            label={`Move ${rowLabel} down`}
            disabled={index === total - 1}
            onClick={onMoveDown}
            glyph="down"
          />
          <RowIconButton
            label={`Remove ${rowLabel}`}
            disabled={total <= 1}
            onClick={onRemove}
            glyph="remove"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
        <Field
          label="Rule name"
          htmlFor={`${base}-name`}
          error={errors?.name?.message}
          className="sm:col-span-4"
        >
          <input
            id={`${base}-name`}
            type="text"
            placeholder="Read ten pages"
            className={controlClass(Boolean(errors?.name))}
            aria-invalid={errors?.name ? true : undefined}
            {...register(`${base}.name` as const)}
          />
        </Field>

        <Field
          label="Icon"
          htmlFor={`${base}-icon`}
          error={errors?.iconSlot?.message}
          className="sm:col-span-2"
        >
          <select
            id={`${base}-icon`}
            className={controlClass(Boolean(errors?.iconSlot))}
            {...register(`${base}.iconSlot` as const)}
          >
            {ICON_SLOT_OPTIONS.map((slot) => (
              <option key={slot} value={slot}>
                {ICON_REGISTRY[slot].label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Kind of rule"
          htmlFor={`${base}-type`}
          error={errors?.type?.message}
          className="sm:col-span-3"
        >
          <select
            id={`${base}-type`}
            className={controlClass(Boolean(errors?.type))}
            {...register(`${base}.type` as const)}
          >
            {ruleTypeEnum.options.map((t) => (
              <option key={t} value={t}>
                {RULE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="How often"
          htmlFor={`${base}-frequency`}
          error={errors?.frequency?.message}
          className="sm:col-span-3"
        >
          <select
            id={`${base}-frequency`}
            className={controlClass(Boolean(errors?.frequency))}
            {...register(`${base}.frequency` as const)}
          >
            {ruleFrequencyEnum.options.map((f) => (
              <option key={f} value={f}>
                {RULE_FREQUENCY_LABELS[f]}
              </option>
            ))}
          </select>
        </Field>

        {needsTarget ? (
          <>
            <Field
              label="Target"
              htmlFor={`${base}-target`}
              error={errors?.targetValue?.message}
              className="sm:col-span-3"
            >
              <input
                id={`${base}-target`}
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder="10"
                className={controlClass(Boolean(errors?.targetValue))}
                aria-invalid={errors?.targetValue ? true : undefined}
                {...register(`${base}.targetValue` as const, { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Unit"
              htmlFor={`${base}-unit`}
              error={errors?.unit?.message}
              className="sm:col-span-3"
            >
              <input
                id={`${base}-unit`}
                type="text"
                placeholder="pages, L, min"
                className={controlClass(Boolean(errors?.unit))}
                aria-invalid={errors?.unit ? true : undefined}
                {...register(`${base}.unit` as const)}
              />
            </Field>
          </>
        ) : null}

        {isPerWeek ? (
          <Field
            label="Days per week"
            htmlFor={`${base}-count`}
            error={errors?.frequencyCount?.message}
            className="sm:col-span-3"
          >
            <input
              id={`${base}-count`}
              type="number"
              inputMode="numeric"
              min={1}
              max={7}
              step={1}
              placeholder="3"
              className={controlClass(Boolean(errors?.frequencyCount))}
              aria-invalid={errors?.frequencyCount ? true : undefined}
              {...register(`${base}.frequencyCount` as const, { valueAsNumber: true })}
            />
          </Field>
        ) : null}

        <div className="flex items-end sm:col-span-3">
          <Toggle
            id={`${base}-required`}
            label="Required"
            checked={required}
            onChange={onRequiredChange}
          />
        </div>
      </div>
    </fieldset>
  );
}

function RowIconButton({
  label,
  glyph,
  disabled,
  onClick,
}: {
  label: string;
  glyph: 'up' | 'down' | 'remove';
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'inline-flex h-8 w-8 items-center justify-center rounded-tessera border border-ink/20 text-ink/70',
        'transition-colors hover:bg-ink/5',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egyptian',
        'disabled:cursor-not-allowed disabled:opacity-40',
      )}
    >
      <Glyph kind={glyph} />
    </button>
  );
}

/** Line glyphs in currentColor (no emoji), matching the etched Icon treatment. */
function Glyph({ kind }: { kind: 'up' | 'down' | 'remove' }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: 'h-4 w-4',
    'aria-hidden': true,
  };
  if (kind === 'up') {
    return (
      <svg {...common}>
        <path d="M12 19V5M6 11l6-6 6 6" />
      </svg>
    );
  }
  if (kind === 'down') {
    return (
      <svg {...common}>
        <path d="M12 5v14M18 13l-6 6-6-6" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M6 7h12M9 7V5h6v2M8 7l1 12h6l1-12" />
    </svg>
  );
}
