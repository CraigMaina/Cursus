-- seed_combined.sql — quotes + system templates in ONE file for the Supabase SQL Editor.
-- Generated from quotes.sql + templates.sql (which seed.sql \i-includes; \i does not
-- work in the web SQL Editor). Both halves are idempotent, so re-running is safe.
-- Paste this whole file into the Supabase Dashboard -> SQL Editor -> Run.

-- ============================== quotes.sql ==============================
-- quotes.sql — reward-system seed (PRD 7). PUBLIC-DOMAIN classical / stoic sources ONLY.
-- Categories: daily (steady encouragement), milestone (grand, carved), reset (the
-- "death-screen" line about falling and rising).
--
-- The reset line "Our greatest glory is not in never falling, but in rising every time we
-- fall." is attributed to Oliver GOLDSMITH (The Citizen of the World, Letter VII, 1760),
-- NOT Confucius — Goldsmith wrote the piece as letters from a fictional Chinese philosopher,
-- which is the source of the common misattribution. Goldsmith died 1774: firmly public domain.
--
-- Idempotent: dedupes on (md5(text), md5(author)) so re-running the seed is safe.
-- Run as the service role (bypasses the world-readable-but-write-locked RLS on quotes).

insert into public.quotes (text, author, source, category) values
  -- daily -------------------------------------------------------------------
  ('You have power over your mind, not outside events. Realize this, and you will find strength.', 'Marcus Aurelius', 'Meditations', 'daily'),
  ('We suffer more often in imagination than in reality.', 'Seneca', 'Letters to Lucilius', 'daily'),
  ('No man is free who is not master of himself.', 'Epictetus', 'Discourses', 'daily'),
  ('Waste no more time arguing about what a good man should be. Be one.', 'Marcus Aurelius', 'Meditations', 'daily'),
  ('It is not that we have a short time to live, but that we waste a great deal of it.', 'Seneca', 'On the Shortness of Life', 'daily'),
  ('First say to yourself what you would be; and then do what you have to do.', 'Epictetus', 'Discourses', 'daily'),
  ('The soul becomes dyed with the color of its thoughts.', 'Marcus Aurelius', 'Meditations', 'daily'),
  ('He who is brave is free.', 'Seneca', 'Letters to Lucilius', 'daily'),
  ('Well begun is half done.', 'Aristotle', 'Politics', 'daily'),
  ('Confine yourself to the present.', 'Marcus Aurelius', 'Meditations', 'daily'),
  -- milestone ---------------------------------------------------------------
  ('The impediment to action advances action. What stands in the way becomes the way.', 'Marcus Aurelius', 'Meditations', 'milestone'),
  ('Victorious warriors win first and then go to war.', 'Sun Tzu', 'The Art of War', 'milestone'),
  ('Difficulties strengthen the mind, as labor does the body.', 'Seneca', 'Letters to Lucilius', 'milestone'),
  ('Opportunities multiply as they are seized.', 'Sun Tzu', 'The Art of War', 'milestone'),
  ('In the midst of chaos, there is also opportunity.', 'Sun Tzu', 'The Art of War', 'milestone'),
  ('No great thing is created suddenly.', 'Epictetus', 'Discourses', 'milestone'),
  ('The best revenge is to be unlike him who performed the injury.', 'Marcus Aurelius', 'Meditations', 'milestone'),
  -- reset (death-screen; falling and rising) --------------------------------
  ('Our greatest glory is not in never falling, but in rising every time we fall.', 'Oliver Goldsmith', 'The Citizen of the World, Letter VII (1760)', 'reset'),
  ('True magnanimity consists not in never falling, but in rising every time we fall.', 'Oliver Goldsmith', 'The Citizen of the World, Letter XXII (1760)', 'reset'),
  ('It is not because things are difficult that we do not dare; it is because we do not dare that they are difficult.', 'Seneca', 'Letters to Lucilius', 'reset'),
  ('The greater the difficulty, the more glory in surmounting it.', 'Epicurus', 'Vatican Sayings', 'reset'),
  ('Fall seven times, stand up eight.', 'Japanese proverb', 'Traditional', 'reset'),
  ('No man is more unhappy than he who never faces adversity, for he is not permitted to prove himself.', 'Seneca', 'On Providence', 'reset')
on conflict (md5(text), md5(author)) do nothing;

-- ============================ templates.sql ============================
-- templates.sql — the six built-in SYSTEM templates (PRD 3, 5).
-- user_id is null and is_system is true, so they are world-readable and write-locked to
-- the service role. definition.rules uses the CAMELCASE rule-blueprint shape that the DAL
-- validates against (ruleSchema without id/challengeId): every key present, nullable keys
-- carry null. 75 Hard is faithful to PRD 5 (two 45-min workouts one outdoor, diet+no-alcohol
-- boolean, 3.7 L water, 10 pages reading, daily photo).
--
-- Idempotent: each insert is guarded by WHERE NOT EXISTS on (is_system, name).
-- Run as the service role.

-- 75 Hard ---------------------------------------------------------------------
insert into public.templates (user_id, name, description, duration_days, strictness, is_system, definition)
select null, '75 Hard',
  'The original mental-toughness protocol. Miss any required rule on any day and the challenge resets to day one.',
  75, 'strict', true,
  '{"rules":[
    {"name":"Outdoor workout (45 min)","iconSlot":"outdoor_workout","type":"duration","targetValue":45,"unit":"min","frequency":"daily","frequencyCount":null,"isRequired":true,"sortOrder":0},
    {"name":"Second workout (45 min)","iconSlot":"indoor_workout","type":"duration","targetValue":45,"unit":"min","frequency":"daily","frequencyCount":null,"isRequired":true,"sortOrder":1},
    {"name":"Follow your diet, no alcohol or cheat meals","iconSlot":"diet","type":"boolean","targetValue":null,"unit":null,"frequency":"daily","frequencyCount":null,"isRequired":true,"sortOrder":2},
    {"name":"Drink 3.7 L of water (1 US gallon)","iconSlot":"water","type":"quantity","targetValue":3.7,"unit":"L","frequency":"daily","frequencyCount":null,"isRequired":true,"sortOrder":3},
    {"name":"Read 10 pages of non-fiction","iconSlot":"reading","type":"quantity","targetValue":10,"unit":"pages","frequency":"daily","frequencyCount":null,"isRequired":true,"sortOrder":4},
    {"name":"Take a progress photo","iconSlot":"photo","type":"photo","targetValue":null,"unit":null,"frequency":"daily","frequencyCount":null,"isRequired":true,"sortOrder":5}
  ]}'::jsonb
where not exists (select 1 from public.templates where is_system and name = '75 Hard');

-- 75 Soft ---------------------------------------------------------------------
insert into public.templates (user_id, name, description, duration_days, strictness, is_system, definition)
select null, '75 Soft',
  'The 75-day format with room to breathe: Standard strictness, one workout, and a lighter diet rule.',
  75, 'standard', true,
  '{"rules":[
    {"name":"Workout (45 min)","iconSlot":"outdoor_workout","type":"duration","targetValue":45,"unit":"min","frequency":"daily","frequencyCount":null,"isRequired":true,"sortOrder":0},
    {"name":"Follow a diet (one cheat meal allowed weekly)","iconSlot":"diet","type":"boolean","targetValue":null,"unit":null,"frequency":"daily","frequencyCount":null,"isRequired":true,"sortOrder":1},
    {"name":"Drink 3 L of water","iconSlot":"water","type":"quantity","targetValue":3,"unit":"L","frequency":"daily","frequencyCount":null,"isRequired":true,"sortOrder":2},
    {"name":"Read 10 pages","iconSlot":"reading","type":"quantity","targetValue":10,"unit":"pages","frequency":"daily","frequencyCount":null,"isRequired":true,"sortOrder":3},
    {"name":"Take a progress photo","iconSlot":"photo","type":"photo","targetValue":null,"unit":null,"frequency":"daily","frequencyCount":null,"isRequired":false,"sortOrder":4}
  ]}'::jsonb
where not exists (select 1 from public.templates where is_system and name = '75 Soft');

-- 30-Day Reset ----------------------------------------------------------------
insert into public.templates (user_id, name, description, duration_days, strictness, is_system, definition)
select null, '30-Day Reset',
  'A month to break a slump: no alcohol, daily movement, water, and reading. Standard strictness.',
  30, 'standard', true,
  '{"rules":[
    {"name":"No alcohol today","iconSlot":"diet","type":"boolean","targetValue":null,"unit":null,"frequency":"daily","frequencyCount":null,"isRequired":true,"sortOrder":0},
    {"name":"Move for 30 minutes","iconSlot":"indoor_workout","type":"duration","targetValue":30,"unit":"min","frequency":"daily","frequencyCount":null,"isRequired":true,"sortOrder":1},
    {"name":"Drink 2.5 L of water","iconSlot":"water","type":"quantity","targetValue":2.5,"unit":"L","frequency":"daily","frequencyCount":null,"isRequired":true,"sortOrder":2},
    {"name":"Read 10 pages","iconSlot":"reading","type":"quantity","targetValue":10,"unit":"pages","frequency":"daily","frequencyCount":null,"isRequired":true,"sortOrder":3}
  ]}'::jsonb
where not exists (select 1 from public.templates where is_system and name = '30-Day Reset');

-- 21-Day Habit Builder --------------------------------------------------------
insert into public.templates (user_id, name, description, duration_days, strictness, is_system, definition)
select null, '21-Day Habit Builder',
  'Three weeks to seat a single keystone habit, with light supporting rules. Standard strictness.',
  21, 'standard', true,
  '{"rules":[
    {"name":"Practice your keystone habit","iconSlot":"streak","type":"boolean","targetValue":null,"unit":null,"frequency":"daily","frequencyCount":null,"isRequired":true,"sortOrder":0},
    {"name":"Move for 20 minutes","iconSlot":"indoor_workout","type":"duration","targetValue":20,"unit":"min","frequency":"daily","frequencyCount":null,"isRequired":true,"sortOrder":1},
    {"name":"Read 10 pages","iconSlot":"reading","type":"quantity","targetValue":10,"unit":"pages","frequency":"daily","frequencyCount":null,"isRequired":false,"sortOrder":2}
  ]}'::jsonb
where not exists (select 1 from public.templates where is_system and name = '21-Day Habit Builder');

-- 66-Day Formation ------------------------------------------------------------
insert into public.templates (user_id, name, description, duration_days, strictness, is_system, definition)
select null, '66-Day Formation',
  'Sixty-six days, the span research associates with automatic habit formation. Standard strictness.',
  66, 'standard', true,
  '{"rules":[
    {"name":"Complete your daily habit","iconSlot":"streak","type":"boolean","targetValue":null,"unit":null,"frequency":"daily","frequencyCount":null,"isRequired":true,"sortOrder":0},
    {"name":"Move for 30 minutes","iconSlot":"indoor_workout","type":"duration","targetValue":30,"unit":"min","frequency":"daily","frequencyCount":null,"isRequired":true,"sortOrder":1},
    {"name":"Drink 2.5 L of water","iconSlot":"water","type":"quantity","targetValue":2.5,"unit":"L","frequency":"daily","frequencyCount":null,"isRequired":true,"sortOrder":2},
    {"name":"Read 10 pages","iconSlot":"reading","type":"quantity","targetValue":10,"unit":"pages","frequency":"daily","frequencyCount":null,"isRequired":false,"sortOrder":3}
  ]}'::jsonb
where not exists (select 1 from public.templates where is_system and name = '66-Day Formation');

-- Monk Mode -------------------------------------------------------------------
insert into public.templates (user_id, name, description, duration_days, strictness, is_system, definition)
select null, 'Monk Mode',
  'Ninety days of deep focus and discipline: long deep work, daily training, no social media. Strict strictness.',
  90, 'strict', true,
  '{"rules":[
    {"name":"Deep work (4 hours)","iconSlot":"reading","type":"duration","targetValue":240,"unit":"min","frequency":"daily","frequencyCount":null,"isRequired":true,"sortOrder":0},
    {"name":"Workout (60 min)","iconSlot":"outdoor_workout","type":"duration","targetValue":60,"unit":"min","frequency":"daily","frequencyCount":null,"isRequired":true,"sortOrder":1},
    {"name":"No social media or doomscrolling","iconSlot":"vice","type":"boolean","targetValue":null,"unit":null,"frequency":"daily","frequencyCount":null,"isRequired":true,"sortOrder":2},
    {"name":"Meditate for 20 minutes","iconSlot":"streak","type":"duration","targetValue":20,"unit":"min","frequency":"daily","frequencyCount":null,"isRequired":true,"sortOrder":3},
    {"name":"Read 20 pages","iconSlot":"reading","type":"quantity","targetValue":20,"unit":"pages","frequency":"daily","frequencyCount":null,"isRequired":true,"sortOrder":4}
  ]}'::jsonb
where not exists (select 1 from public.templates where is_system and name = 'Monk Mode');
