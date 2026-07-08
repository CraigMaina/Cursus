-- 20260708000200_notification_queue.sql
-- PRD 6: server-authoritative alert evaluation. Given a moment `p_now`, return the set
-- of notifications that are due RIGHT NOW, one row per (user, push subscription). The
-- alert pipeline (hourly pg_cron -> edge function) calls this with the service role and
-- dispatches web push + email from the result. All timezone, evening-threshold, quiet-
-- hours, and "at risk" logic lives here so it cannot be bypassed by a client.
--
-- A user is DUE this hour when their local wall-clock hour equals their evening-threshold
-- hour (the cron fires at minute 0 each hour) and they are not inside quiet hours. For a
-- due user we look at every active challenge:
--   - at_risk  : one or more required daily rules for today are not yet completed
--   - milestone: today is complete AND the day number is a milestone (7,21,30,50,66,75,90,100)
--
-- SECURITY DEFINER + locked down to service_role: it reads across all users and exposes
-- auth.users.email, so it must never be callable by anon/authenticated.

create or replace function public.notification_queue(p_now timestamptz default now())
returns table (
  user_id        uuid,
  email          text,
  kind           text,
  challenge_id   uuid,
  challenge_name text,
  day_number     int,
  missing_count  int,
  push_enabled   boolean,
  email_enabled  boolean,
  endpoint       text,
  keys           jsonb
)
language sql
security definer
set search_path = public
as $$
  with prof as (
    select
      p.id                                   as user_id,
      u.email                                as email,
      (p_now at time zone p.timezone)        as local_ts,
      (p_now at time zone p.timezone)::date  as local_date,
      p.evening_threshold_local,
      coalesce(np.push_enabled, true)        as push_enabled,
      coalesce(np.email_enabled, false)      as email_enabled,
      np.quiet_start_local,
      np.quiet_end_local
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.notification_prefs np on np.user_id = p.id
  ),
  due as (
    select *
    from prof
    where to_char(local_ts, 'HH24') = split_part(evening_threshold_local, ':', 1)
      and not (
        quiet_start_local is not null and quiet_end_local is not null
        and case
              when quiet_start_local <= quiet_end_local
                then to_char(local_ts, 'HH24:MI') >= quiet_start_local
                     and to_char(local_ts, 'HH24:MI') <  quiet_end_local
              else to_char(local_ts, 'HH24:MI') >= quiet_start_local
                     or to_char(local_ts, 'HH24:MI') <  quiet_end_local
            end
      )
  ),
  active as (
    select
      d.*,
      c.id                              as challenge_id,
      c.name                            as challenge_name,
      (d.local_date - c.start_date + 1) as day_number
    from due d
    join public.challenges c
      on c.user_id = d.user_id
     and c.is_archived = false
     and d.local_date between c.start_date and (c.start_date + (c.duration_days - 1))
  ),
  eval as (
    select
      a.*,
      (
        select count(*)::int
        from public.rules r
        where r.challenge_id = a.challenge_id
          and r.is_required = true
          and r.frequency = 'daily'
          and not exists (
            select 1 from public.entries e
            where e.rule_id = r.id
              and e.entry_date = a.local_date
              and e.completed = true
          )
      ) as missing_count
    from active a
  )
  select
    e.user_id,
    e.email,
    case when e.missing_count > 0 then 'at_risk' else 'milestone' end as kind,
    e.challenge_id,
    e.challenge_name,
    e.day_number::int,
    e.missing_count,
    e.push_enabled,
    e.email_enabled,
    ps.endpoint,
    ps.keys
  from eval e
  left join public.push_subscriptions ps on ps.user_id = e.user_id
  where e.missing_count > 0
     or e.day_number in (7, 21, 30, 50, 66, 75, 90, 100);
$$;

-- Lock down: only the service role (edge function) may run it.
revoke all on function public.notification_queue(timestamptz) from public, anon, authenticated;
grant execute on function public.notification_queue(timestamptz) to service_role;
