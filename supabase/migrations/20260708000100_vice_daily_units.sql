-- 20260708000100_vice_daily_units.sql
-- Phase 4: the savings calculator needs a consumption RATE. The per-unit cost/time
-- figures on `vices` are meaningless for savings without units-per-day, so add
-- `daily_units` (units/day the user used to consume). Savings then =
--   elapsed_days * daily_units * cost_per_unit         (money reclaimed)
--   elapsed_days * daily_units * time_per_unit_minutes (time reclaimed)
-- Nullable: when null (or cost/time null) that dimension is simply not shown. RLS is
-- unchanged (inherited owner-only policy on vices). See DECISIONS D14.
alter table public.vices
  add column if not exists daily_units numeric;
