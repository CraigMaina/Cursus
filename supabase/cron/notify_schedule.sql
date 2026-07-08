-- supabase/cron/notify_schedule.sql
-- Hourly alert trigger (PRD 6). Run this in the Supabase SQL Editor AFTER you have:
--   1. Deployed the `notify` edge function (Dashboard > Edge Functions).
--   2. Set its Function secrets (CRON_SECRET, VAPID_*, RESEND_*).
--   3. Created the two Vault secrets below (Dashboard > Project Settings > Vault, or here).
-- Secrets live in Vault, never in this file or git.

-- Extensions (also toggleable in Dashboard > Database > Extensions).
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- --- Vault secrets: create once, then keep this block commented. --------------------
-- The cron secret MUST equal the CRON_SECRET you set on the edge function.
--   select vault.create_secret('https://YOUR-PROJECT-REF.functions.supabase.co', 'cursus_functions_url');
--   select vault.create_secret('YOUR-RANDOM-CRON-SECRET', 'cursus_cron_secret');
-- To rotate later: select vault.update_secret((select id from vault.secrets where name='cursus_cron_secret'), 'NEW-VALUE');

-- (Re)schedule the job idempotently: fires at minute 0 of every hour. The SQL function
-- itself decides who is actually due this hour (evening threshold, quiet hours, at-risk).
do $$
begin
  if exists (select 1 from cron.job where jobname = 'cursus-notify-hourly') then
    perform cron.unschedule('cursus-notify-hourly');
  end if;
end $$;

select cron.schedule('cursus-notify-hourly', '0 * * * *', $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'cursus_functions_url') || '/notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cursus_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
$job$);

-- Verify:   select jobid, jobname, schedule, active from cron.job;
-- Inspect runs: select * from cron.job_run_details order by start_time desc limit 20;
