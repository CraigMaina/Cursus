-- 20260707001400_reset_function_stub.sql
-- PHASE 2 PLACEHOLDER — server-authoritative Strict-mode reset logic.
--
-- This is a documented STUB. The real routine (Phase 2) will, for a Strict challenge,
-- walk each day from the effective start through p_through_date, and for any day where a
-- required rule was left unmet past threshold, insert a challenge_resets row and rewind
-- the effective start. It runs SECURITY DEFINER (bypassing the read-only client RLS on
-- challenge_resets) and is the ONLY writer of that table.
--
-- For Phase 1 it computes nothing: it returns the challenge's existing resets so the shape
-- is stable. The DAL does NOT depend on this function (evaluateResets() reads existing
-- resets directly), so nothing client-side relies on this stub. Do not build against it.

create or replace function public.evaluate_challenge_resets(
  p_challenge_id uuid,
  p_through_date date
)
returns setof public.challenge_resets
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Phase 2: real reset evaluation goes here (insert scars, rewind effective start).
  -- Phase 1: no-op — return existing resets for the owner's challenge only.
  perform 1 from public.challenges c
    where c.id = p_challenge_id and c.user_id = auth.uid();
  if not found then
    raise exception 'challenge not found or not owned by caller';
  end if;

  return query
    select r.* from public.challenge_resets r
    where r.challenge_id = p_challenge_id
      and r.reset_date <= p_through_date
    order by r.reset_date;
end;
$$;

revoke all on function public.evaluate_challenge_resets(uuid, date) from public;
grant execute on function public.evaluate_challenge_resets(uuid, date) to authenticated;
