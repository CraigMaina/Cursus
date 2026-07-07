-- 20260707000300_templates.sql
-- PRD 10: templates (id, user_id nullable=system, name, description, duration_days,
-- strictness, is_system, definition jsonb).
-- System templates (user_id null, is_system true) are world-readable; writes locked to
-- the service role. Personal templates are owner-only.

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text check (description is null or char_length(description) <= 2000),
  duration_days integer not null check (duration_days > 0),
  strictness strictness not null,
  is_system boolean not null default false,
  definition jsonb not null default '{"rules": []}'::jsonb,
  created_at timestamptz not null default now(),
  -- A system template has no owner; a personal template must have one.
  constraint templates_ownership_ck check (
    (is_system and user_id is null) or (not is_system and user_id is not null)
  )
);

create index if not exists templates_user_id_idx on public.templates (user_id);

alter table public.templates enable row level security;

-- Readable: system templates by anyone signed in, plus the user's own saved templates.
drop policy if exists templates_select_visible on public.templates;
create policy templates_select_visible on public.templates
  for select using (is_system or user_id = auth.uid());

-- Writes: only a user's own (non-system) templates. System-template inserts are done by
-- the service role (seed), which bypasses RLS.
drop policy if exists templates_insert_own on public.templates;
create policy templates_insert_own on public.templates
  for insert with check (user_id = auth.uid() and is_system = false);

drop policy if exists templates_update_own on public.templates;
create policy templates_update_own on public.templates
  for update using (user_id = auth.uid() and is_system = false)
  with check (user_id = auth.uid() and is_system = false);

drop policy if exists templates_delete_own on public.templates;
create policy templates_delete_own on public.templates
  for delete using (user_id = auth.uid() and is_system = false);
