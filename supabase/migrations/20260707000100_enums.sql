-- 20260707000100_enums.sql
-- Domain enums, mirroring src/lib/domain/schemas.ts. Snake_case DB, camelCase domain.
-- Idempotent: guarded so re-running the migration set is safe.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'strictness') then
    create type strictness as enum ('strict', 'standard', 'freeze');
  end if;

  if not exists (select 1 from pg_type where typname = 'rule_type') then
    create type rule_type as enum ('boolean', 'quantity', 'duration', 'photo');
  end if;

  if not exists (select 1 from pg_type where typname = 'rule_frequency') then
    create type rule_frequency as enum ('daily', 'n_per_week');
  end if;

  if not exists (select 1 from pg_type where typname = 'quote_category') then
    create type quote_category as enum ('daily', 'milestone', 'reset');
  end if;

  if not exists (select 1 from pg_type where typname = 'icon_slot') then
    create type icon_slot as enum (
      'water', 'indoor_workout', 'outdoor_workout', 'reading', 'diet', 'photo',
      'streak', 'milestone', 'vice', 'days_clean', 'relapse', 'reminder',
      'calendar', 'settings', 'savings', 'add'
    );
  end if;
end
$$;
