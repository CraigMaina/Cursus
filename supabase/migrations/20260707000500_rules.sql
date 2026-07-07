-- 20260707000500_rules.sql
-- PRD 10: rules (id, challenge_id, name, icon_slot, type, target_value, unit,
-- frequency, is_required, sort_order). frequency_count carries n for n_per_week.
-- No user_id column: ownership is derived through the parent challenge, so RLS uses an
-- EXISTS check against challenges.user_id = auth.uid().

create table if not exists public.rules (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  icon_slot icon_slot not null,
  type rule_type not null,
  target_value numeric check (target_value is null or target_value >= 0),
  unit text check (unit is null or char_length(unit) <= 24),
  frequency rule_frequency not null default 'daily',
  frequency_count integer check (frequency_count is null or frequency_count > 0),
  is_required boolean not null default true,
  sort_order integer not null default 0
);

create index if not exists rules_challenge_id_idx on public.rules (challenge_id);

alter table public.rules enable row level security;

drop policy if exists rules_select_own on public.rules;
create policy rules_select_own on public.rules
  for select using (
    exists (
      select 1 from public.challenges c
      where c.id = rules.challenge_id and c.user_id = auth.uid()
    )
  );

drop policy if exists rules_insert_own on public.rules;
create policy rules_insert_own on public.rules
  for insert with check (
    exists (
      select 1 from public.challenges c
      where c.id = rules.challenge_id and c.user_id = auth.uid()
    )
  );

drop policy if exists rules_update_own on public.rules;
create policy rules_update_own on public.rules
  for update using (
    exists (
      select 1 from public.challenges c
      where c.id = rules.challenge_id and c.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.challenges c
      where c.id = rules.challenge_id and c.user_id = auth.uid()
    )
  );

drop policy if exists rules_delete_own on public.rules;
create policy rules_delete_own on public.rules
  for delete using (
    exists (
      select 1 from public.challenges c
      where c.id = rules.challenge_id and c.user_id = auth.uid()
    )
  );
