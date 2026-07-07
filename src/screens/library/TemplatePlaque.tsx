import { Plaque, Icon, SealButton } from '@/components/primitives';
import type { Template } from '@/lib/domain/schemas';
import { StrictnessTag } from './StrictnessTag';

/**
 * TemplatePlaque — one system/personal Template as a fresco plaque (PRD 4.1 #2). Shows
 * name, strictness, duration, rule count, description, and the rules' icon slots. The
 * Begin action hands the template up so the parent can collect a start date and call
 * `startFromTemplate`.
 */
export function TemplatePlaque({
  template,
  onBegin,
}: {
  template: Template;
  onBegin: (template: Template) => void;
}) {
  const rules = template.definition.rules;
  const ruleCount = rules.length;

  return (
    <Plaque as="article" meanderTop className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-2xl leading-tight text-ink">{template.name}</h3>
        <StrictnessTag strictness={template.strictness} />
      </div>

      <p className="mt-2 font-sans text-xs uppercase tracking-[0.16em] text-ink/55">
        {template.durationDays} days
        <span className="mx-2 text-ink/30">/</span>
        {ruleCount} {ruleCount === 1 ? 'rule' : 'rules'}
      </p>

      {template.description ? (
        <p className="mt-4 font-serif text-ink/75">{template.description}</p>
      ) : null}

      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Rules in this challenge">
        {rules.map((r, i) => (
          <li
            key={`${r.name}-${i}`}
            className="inline-flex items-center gap-1.5 rounded-tessera bg-plaster/70 px-2 py-1 font-sans text-xs text-ink/70"
          >
            <Icon slot={r.iconSlot} size="sm" decorative />
            <span className="max-w-[9rem] truncate">{r.name}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <SealButton onClick={() => onBegin(template)}>Begin this challenge</SealButton>
      </div>
    </Plaque>
  );
}
