-- 20260707000700_challenge_resets.sql
-- PRD 10: challenge_resets (id, challenge_id, reset_date, reason) — the Strict-mode
-- scars drawn on the calendar. Ownership derives from the parent challenge.
--
-- SERVER-AUTHORITATIVE: the client may READ its own resets but never write them. Only
-- SELECT is granted to authenticated users; inserts/updates/deletes come exclusively
-- from the server-side reset routine (service role / SECURITY DEFINER, Phase 2), which
-- bypasses RLS. This is what makes a reset impossible to fabricate or suppress from the UI.

create table if not exists public.challenge_resets (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  reset_date date not null,
  reason text check (reason is null or char_length(reason) <= 500),
  constraint challenge_resets_uniq unique (challenge_id, reset_date)
);

create index if not exists challenge_resets_challenge_id_idx
  on public.challenge_resets (challenge_id);

alter table public.challenge_resets enable row level security;

-- Read-only for the owner.
drop policy if exists challenge_resets_select_own on public.challenge_resets;
create policy challenge_resets_select_own on public.challenge_resets
  for select using (
    exists (
      select 1 from public.challenges c
      where c.id = challenge_resets.challenge_id and c.user_id = auth.uid()
    )
  );

-- No insert/update/delete policies for authenticated users: writes are denied to the
-- client and performed only by the server-side reset logic (service role).
