-- 20260707000400_challenges.sql
-- PRD 10: challenges (id, user_id, name, description, duration_days, start_date,
-- strictness, freeze_tokens, is_archived, created_at). Owner-only RLS.
-- freeze_tokens present from first migration (PRD 3) but no freeze logic in v1.

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text check (description is null or char_length(description) <= 2000),
  duration_days integer not null check (duration_days > 0),
  start_date date not null,
  strictness strictness not null,
  freeze_tokens integer not null default 0 check (freeze_tokens >= 0),
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists challenges_user_id_idx on public.challenges (user_id);

alter table public.challenges enable row level security;

drop policy if exists challenges_select_own on public.challenges;
create policy challenges_select_own on public.challenges
  for select using (user_id = auth.uid());

drop policy if exists challenges_insert_own on public.challenges;
create policy challenges_insert_own on public.challenges
  for insert with check (user_id = auth.uid());

drop policy if exists challenges_update_own on public.challenges;
create policy challenges_update_own on public.challenges
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists challenges_delete_own on public.challenges;
create policy challenges_delete_own on public.challenges
  for delete using (user_id = auth.uid());
