-- 20260707001500_reset_function.sql
-- PHASE 2 — the REAL server-authoritative Strict-mode reset routine (PRD 3, 4.1 #5, 11).
--
-- Replaces the Phase-1 STUB (20260707001400) with the same signature, so applying this
-- after 1400 cleanly swaps the body. This function is the ONLY writer of challenge_resets
-- (the client has SELECT-only RLS on that table), which is what makes a reset impossible
-- to fabricate or suppress from the UI.
--
-- Semantics (matches src/data/resetLogic.ts, the unit-tested pure mirror):
--   * Only STRICT challenges reset. Standard (and reserved 'freeze') never do — a miss
--     there only affects completion %/streak, computed elsewhere.
--   * Walk each day from the challenge's ORIGINAL start_date forward. A day is a MISS if
--     any REQUIRED, DAILY rule has no entry with completed = true on that day. n_per_week
--     rules are NOT evaluated per-day (a specific day cannot be "missed" for them); see the
--     follow-up note in tickets/P2-A.md.
--   * On a miss: insert a challenge_resets row at that date and rewind the EFFECTIVE start
--     to the day AFTER the miss (start_date itself is never mutated, so the calendar keeps
--     the pre-reset days to draw the scar; the effective start is derived from reset rows).
--   * A day is only evaluable once it is CLOSED: strictly before today in the owner's
--     timezone, or today once the local clock has passed the owner's evening threshold.
--   * The client-supplied p_through_date is CLAMPED to that last-closed day, so a client
--     can never push evaluation into not-yet-closed days to fabricate a miss.
--   * Idempotent: the reset dates are a pure function of (challenge, entries, horizon), and
--     the unique (challenge_id, reset_date) + ON CONFLICT DO NOTHING prevents duplicates,
--     so re-running never creates a second row for the same miss.

create or replace function public.evaluate_challenge_resets(
  p_challenge_id uuid,
  p_through_date date
)
returns setof public.challenge_resets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_challenge public.challenges%rowtype;
  v_tz        text;
  v_threshold time;
  v_now_local timestamp;
  v_today     date;
  v_last_eval date;
  v_horizon   date;
  v_eff_start date;
  v_run_end   date;
  v_day       date;
  v_missed    boolean;
begin
  -- Ownership gate: an authenticated caller may only evaluate their own challenge.
  select * into v_challenge
    from public.challenges
    where id = p_challenge_id and user_id = auth.uid();
  if not found then
    raise exception 'challenge not found or not owned by caller';
  end if;

  -- Standard / reserved-freeze challenges never reset. Return existing resets unchanged
  -- (there should be none, but keep the shape stable and write nothing).
  if v_challenge.strictness <> 'strict' then
    return query
      select r.*
        from public.challenge_resets r
        where r.challenge_id = p_challenge_id
        order by r.reset_date;
    return;
  end if;

  -- Resolve the owner's timezone + evening threshold to find the last CLOSED day.
  select coalesce(p.timezone, 'UTC'),
         coalesce(p.evening_threshold_local, '20:00')::time
    into v_tz, v_threshold
    from public.profiles p
    where p.id = v_challenge.user_id;
  if v_tz is null then v_tz := 'UTC'; end if;
  if v_threshold is null then v_threshold := time '20:00'; end if;

  v_now_local := now() at time zone v_tz;              -- wall-clock in the owner's tz
  v_today := v_now_local::date;
  if v_now_local::time >= v_threshold then
    v_last_eval := v_today;      -- today is past the evening threshold -> closed
  else
    v_last_eval := v_today - 1;  -- today not yet closed
  end if;

  -- Clamp the client's through-date so it can never force evaluation of open days.
  v_horizon := least(p_through_date, v_last_eval);

  -- Walk from the original start, rewinding the effective start on each miss.
  v_eff_start := v_challenge.start_date;
  v_day := v_challenge.start_date;
  while v_day <= v_horizon loop
    v_run_end := v_eff_start + (v_challenge.duration_days - 1);
    exit when v_day > v_run_end;   -- current run completed cleanly; stop evaluating

    v_missed := exists (
      select 1
        from public.rules ru
        where ru.challenge_id = p_challenge_id
          and ru.is_required = true
          and ru.frequency = 'daily'
          and not exists (
            select 1
              from public.entries e
              where e.rule_id = ru.id
                and e.entry_date = v_day
                and e.completed = true
          )
    );

    if v_missed then
      insert into public.challenge_resets (challenge_id, reset_date, reason)
        values (
          p_challenge_id,
          v_day,
          'Missed a required rule on ' || to_char(v_day, 'YYYY-MM-DD')
        )
        on conflict (challenge_id, reset_date) do nothing;
      v_eff_start := v_day + 1;   -- effective start rewinds to the day after the miss
    end if;

    v_day := v_day + 1;
  end loop;

  return query
    select r.*
      from public.challenge_resets r
      where r.challenge_id = p_challenge_id
      order by r.reset_date;
end;
$$;

revoke all on function public.evaluate_challenge_resets(uuid, date) from public;
grant execute on function public.evaluate_challenge_resets(uuid, date) to authenticated;
