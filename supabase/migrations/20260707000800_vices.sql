-- 20260707000800_vices.sql
-- PRD 10: vices (id, user_id, name, quit_date, reason, triggers, cost_per_unit,
-- time_per_unit_minutes, unit_label, is_archived). Owner-only RLS.

create table if not exists public.vices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  quit_date date not null,
  reason text check (reason is null or char_length(reason) <= 2000),
  triggers text check (triggers is null or char_length(triggers) <= 2000),
  cost_per_unit numeric check (cost_per_unit is null or cost_per_unit >= 0),
  time_per_unit_minutes numeric check (time_per_unit_minutes is null or time_per_unit_minutes >= 0),
  unit_label text check (unit_label is null or char_length(unit_label) <= 40),
  is_archived boolean not null default false
);

create index if not exists vices_user_id_idx on public.vices (user_id);

alter table public.vices enable row level security;

drop policy if exists vices_select_own on public.vices;
create policy vices_select_own on public.vices
  for select using (user_id = auth.uid());

drop policy if exists vices_insert_own on public.vices;
create policy vices_insert_own on public.vices
  for insert with check (user_id = auth.uid());

drop policy if exists vices_update_own on public.vices;
create policy vices_update_own on public.vices
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists vices_delete_own on public.vices;
create policy vices_delete_own on public.vices
  for delete using (user_id = auth.uid());
