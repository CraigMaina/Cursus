-- 20260708000300_goals.sql
-- Goals feature (scope expansion D16). A unified Goals area with three kinds:
--   metric  - a numeric measurement tracked over time toward an optional target (weight,
--             body fat, etc). Progress lives in goal_metric_entries.
--   reading - a reading log with an optional count target. Books in goal_books.
--   routine - a workout routine (detailed): a template of exercises (routine_exercises)
--             plus logged sessions (workout_sessions) each holding actual sets (workout_sets).
--
-- Owner-only RLS everywhere: every table carries user_id defaulting to auth.uid(), matching
-- the entries/vices pattern, so policies stay a simple `user_id = auth.uid()`.

-- Enums
do $$ begin
  create type goal_kind as enum ('metric', 'reading', 'routine');
exception when duplicate_object then null; end $$;
do $$ begin
  create type metric_direction as enum ('down', 'up', 'maintain');
exception when duplicate_object then null; end $$;

-- Parent: a goal of one kind.
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind goal_kind not null,
  name text not null check (char_length(name) between 1 and 120),
  -- metric-only (null for other kinds)
  unit text check (unit is null or char_length(unit) <= 24),
  start_value numeric,
  target_value numeric,
  direction metric_direction,
  -- reading-only (null otherwise): optional target number of books
  target_count integer check (target_count is null or target_count >= 0),
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists goals_user_idx on public.goals (user_id, kind);

-- metric measurements over time
create table if not exists public.goal_metric_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  entry_date date not null,
  value numeric not null,
  note text check (note is null or char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  unique (goal_id, entry_date)
);
create index if not exists goal_metric_entries_goal_idx on public.goal_metric_entries (goal_id, entry_date);

-- reading log
create table if not exists public.goal_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  author text check (author is null or char_length(author) <= 200),
  finished_date date,
  rating integer check (rating is null or rating between 1 and 5),
  note text check (note is null or char_length(note) <= 2000),
  created_at timestamptz not null default now()
);
create index if not exists goal_books_goal_idx on public.goal_books (goal_id, finished_date);

-- routine template: the exercises that make up a routine
create table if not exists public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  target_sets integer check (target_sets is null or target_sets >= 0),
  target_reps integer check (target_reps is null or target_reps >= 0),
  target_weight numeric,
  unit text check (unit is null or char_length(unit) <= 12),
  sort_order integer not null default 0
);
create index if not exists routine_exercises_goal_idx on public.routine_exercises (goal_id, sort_order);

-- routine actuals: a logged workout session
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  session_date date not null,
  note text check (note is null or char_length(note) <= 2000),
  created_at timestamptz not null default now()
);
create index if not exists workout_sessions_goal_idx on public.workout_sessions (goal_id, session_date);

-- routine actuals: the sets performed in a session
create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id uuid references public.routine_exercises (id) on delete set null,
  exercise_name text not null check (char_length(exercise_name) between 1 and 120),
  set_number integer not null default 1,
  reps integer check (reps is null or reps >= 0),
  weight numeric,
  created_at timestamptz not null default now()
);
create index if not exists workout_sets_session_idx on public.workout_sets (session_id);

-- Owner-only RLS on all six tables.
do $$
declare t text;
begin
  foreach t in array array[
    'goals','goal_metric_entries','goal_books','routine_exercises','workout_sessions','workout_sets'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t||'_select_own', t);
    execute format('create policy %I on public.%I for select using (user_id = auth.uid())', t||'_select_own', t);
    execute format('drop policy if exists %I on public.%I', t||'_insert_own', t);
    execute format('create policy %I on public.%I for insert with check (user_id = auth.uid())', t||'_insert_own', t);
    execute format('drop policy if exists %I on public.%I', t||'_update_own', t);
    execute format('create policy %I on public.%I for update using (user_id = auth.uid()) with check (user_id = auth.uid())', t||'_update_own', t);
    execute format('drop policy if exists %I on public.%I', t||'_delete_own', t);
    execute format('create policy %I on public.%I for delete using (user_id = auth.uid())', t||'_delete_own', t);
  end loop;
end $$;
