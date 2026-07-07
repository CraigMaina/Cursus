-- 20260707001200_notification_prefs.sql
-- PRD 10: notification_prefs (user_id, push_enabled, email_enabled, quiet_start_local,
-- quiet_end_local). One row per user (user_id is the PK). Owner-only RLS. Quiet hours are
-- honored server-side in the alert query (PRD 6), not just the client.

create table if not exists public.notification_prefs (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  push_enabled boolean not null default true,
  email_enabled boolean not null default false,
  quiet_start_local text
    check (quiet_start_local is null or quiet_start_local ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  quiet_end_local text
    check (quiet_end_local is null or quiet_end_local ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
);

alter table public.notification_prefs enable row level security;

drop policy if exists notification_prefs_select_own on public.notification_prefs;
create policy notification_prefs_select_own on public.notification_prefs
  for select using (user_id = auth.uid());

drop policy if exists notification_prefs_insert_own on public.notification_prefs;
create policy notification_prefs_insert_own on public.notification_prefs
  for insert with check (user_id = auth.uid());

drop policy if exists notification_prefs_update_own on public.notification_prefs;
create policy notification_prefs_update_own on public.notification_prefs
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists notification_prefs_delete_own on public.notification_prefs;
create policy notification_prefs_delete_own on public.notification_prefs
  for delete using (user_id = auth.uid());
