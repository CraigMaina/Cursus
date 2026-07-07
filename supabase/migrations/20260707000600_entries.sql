-- 20260707000600_entries.sql
-- PRD 10: entries (id, user_id, rule_id, entry_date, completed, value, note,
-- photo_path, created_at) with UNIQUE (rule_id, entry_date). Owner-only RLS.
-- user_id is denormalized onto the row so RLS is a direct, cheap check and the Today
-- upsert never has to join. It defaults to auth.uid() on insert.

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  rule_id uuid not null references public.rules (id) on delete cascade,
  entry_date date not null,
  completed boolean not null default false,
  value numeric,
  note text check (note is null or char_length(note) <= 2000),
  photo_path text,
  created_at timestamptz not null default now(),
  constraint entries_rule_date_uniq unique (rule_id, entry_date)
);

create index if not exists entries_user_id_idx on public.entries (user_id);
create index if not exists entries_rule_id_idx on public.entries (rule_id);

alter table public.entries enable row level security;

drop policy if exists entries_select_own on public.entries;
create policy entries_select_own on public.entries
  for select using (user_id = auth.uid());

drop policy if exists entries_insert_own on public.entries;
create policy entries_insert_own on public.entries
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.rules r
      join public.challenges c on c.id = r.challenge_id
      where r.id = entries.rule_id and c.user_id = auth.uid()
    )
  );

drop policy if exists entries_update_own on public.entries;
create policy entries_update_own on public.entries
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists entries_delete_own on public.entries;
create policy entries_delete_own on public.entries
  for delete using (user_id = auth.uid());
