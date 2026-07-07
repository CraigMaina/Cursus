-- 20260707001000_quotes.sql
-- PRD 10: quotes (id, text, author, source, category). World-readable; writes locked to
-- the service role (the seed runs as service role and bypasses RLS).

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(text) >= 1),
  author text not null check (char_length(author) >= 1),
  source text,
  category quote_category not null
);

create index if not exists quotes_category_idx on public.quotes (category);

-- Deduplication key for idempotent seeding (same line + author is the same quote).
create unique index if not exists quotes_text_author_uniq
  on public.quotes (md5(text), md5(author));

alter table public.quotes enable row level security;

-- World-readable to any authenticated user.
drop policy if exists quotes_select_all on public.quotes;
create policy quotes_select_all on public.quotes
  for select using (true);

-- No insert/update/delete policies: writes are denied to all clients and performed only
-- by the service role (seed / admin), which bypasses RLS.
