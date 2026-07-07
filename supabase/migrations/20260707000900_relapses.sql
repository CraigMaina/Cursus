-- 20260707000900_relapses.sql
-- PRD 10: relapses (id, vice_id, relapse_date, note). Ownership derives from the
-- parent vice; RLS uses an EXISTS check against vices.user_id = auth.uid().

create table if not exists public.relapses (
  id uuid primary key default gen_random_uuid(),
  vice_id uuid not null references public.vices (id) on delete cascade,
  relapse_date date not null,
  note text check (note is null or char_length(note) <= 2000)
);

create index if not exists relapses_vice_id_idx on public.relapses (vice_id);

alter table public.relapses enable row level security;

drop policy if exists relapses_select_own on public.relapses;
create policy relapses_select_own on public.relapses
  for select using (
    exists (
      select 1 from public.vices v
      where v.id = relapses.vice_id and v.user_id = auth.uid()
    )
  );

drop policy if exists relapses_insert_own on public.relapses;
create policy relapses_insert_own on public.relapses
  for insert with check (
    exists (
      select 1 from public.vices v
      where v.id = relapses.vice_id and v.user_id = auth.uid()
    )
  );

drop policy if exists relapses_update_own on public.relapses;
create policy relapses_update_own on public.relapses
  for update using (
    exists (
      select 1 from public.vices v
      where v.id = relapses.vice_id and v.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.vices v
      where v.id = relapses.vice_id and v.user_id = auth.uid()
    )
  );

drop policy if exists relapses_delete_own on public.relapses;
create policy relapses_delete_own on public.relapses
  for delete using (
    exists (
      select 1 from public.vices v
      where v.id = relapses.vice_id and v.user_id = auth.uid()
    )
  );
