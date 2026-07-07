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
