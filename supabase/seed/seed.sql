-- seed.sql — aggregate seed runner. Applies quotes then system templates.
-- Run once after migrations, as the service role:
--   psql "$DATABASE_URL" -f supabase/seed/seed.sql
-- or via the Supabase SQL editor. Both files are idempotent.

\i quotes.sql
\i templates.sql
