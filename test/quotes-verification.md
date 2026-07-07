# Quotes seed verification checklist (PRD section 7)

Applied at integration against the Architect's seed file (`supabase/seed/quotes.*`),
which is being authored in a separate worktree and is **not present here yet**. This
checklist is the acceptance gate for that file; run it the moment the seed lands on
`main` or is shared for review. Codex owns verification; the Architect owns the file
and applies any fixes (Codex reports, does not rewrite the seed).

## A. Public-domain provenance (hard gate)

Every quote must trace to a genuinely public-domain source. Ancient / classical /
stoic works and pre-1929 translations are safe; modern copyrighted translations and
modern authors are not.

- [ ] Each row has a real `author` and a `source` that is a public-domain work.
- [ ] Allowed source set only: Marcus Aurelius (*Meditations*), Seneca (*Letters /
      Epistulae Morales*), Epictetus (*Enchiridion / Discourses*), Sun Tzu (*The Art
      of War*), Heraclitus (fragments), Cato (*Distichs*), and similarly ancient
      material. Flag anything outside this set for provenance review.
- [ ] No modern copyrighted quotes (no living authors, no 20th/21st-century books,
      no film/song lyrics, no "internet motivational" lines of unknown origin).
- [ ] Wording is checked against a **public-domain translation** (e.g. George Long
      or Meric Casaubon for Aurelius; pre-1929 editions), not a modern copyrighted
      translation. Note the specific translation used per author.
- [ ] No attribution to a source the line does not actually appear in
      (paraphrase-drift). If wording is a known paraphrase, either correct it to the
      public-domain text or drop the row.

## B. The reset "falling / rising" line (specific, load-bearing)

PRD 7 calls this out explicitly because it is near-universally misattributed.

- [ ] The line "Our greatest glory is not in never falling, but in rising every time
      we fall." is attributed to **Oliver Goldsmith** — NOT Confucius.
- [ ] `source` names *The Citizen of the World*, Letter VII (1760). Goldsmith died
      1774, so the text is firmly public domain.
- [ ] No row in the seed attributes any "falling / rising" variant to Confucius.
      (Goldsmith wrote the piece as letters from a fictional Chinese philosopher,
      which is the origin of the misattribution — reject it wherever it appears.)
- [ ] `category` for this line is `reset`.
- [ ] If the Letter XXII variant is seeded — "True magnanimity consists not in never
      falling, but in rising every time we fall." — it is also attributed to
      Goldsmith, `source` cites Letter XXII, and `category` is `reset`.

## C. Category correctness (`daily` | `milestone` | `reset`)

Category drives reward-card selection (PRD 7), so miscategorization is a functional
bug, not a cosmetic one.

- [ ] `category` is one of exactly `daily`, `milestone`, `reset` (matches
      `quoteCategoryEnum` in `src/lib/domain/schemas.ts`). No other value.
- [ ] `daily` rows read as steady day-to-day encouragement.
- [ ] `milestone` rows read as grand / carved / triumphal (fit the milestone badge).
- [ ] `reset` rows are about falling, defeat, endurance, and rising again — the
      death-screen tone. The two Goldsmith lines belong here.
- [ ] Each category has enough rows for the "avoid repeating the last few shown"
      selection rule to have variety (suggest >= 5 `daily`, >= 3 each for
      `milestone` and `reset`; confirm against the final seed and the selection code).

## D. Schema + data hygiene

- [ ] Every seeded row validates against `quoteSchema`: non-empty `text`, non-empty
      `author`, `source` string or null, `category` in enum, `id` a valid UUID.
- [ ] No duplicate `text` rows.
- [ ] No emoji and no em dashes in quote text or attribution (PRD 8 / copy rules).
- [ ] Straight quotes/apostrophes are handled consistently (no mojibake from a bad
      encoding round-trip).

## E. How to confirm the anchor cases quickly

Once the seed file exists, these greps are the fast first pass (adjust to the seed's
format, SQL or TS):

- [ ] Confucius does NOT appear as an author on any falling/rising line:
      search the seed for `Confucius` and confirm zero hits on the reset lines.
- [ ] Goldsmith IS present on the reset line: search for `Goldsmith` and confirm the
      Letter VII (1760) attribution.
- [ ] Category values are all in-enum: extract every `category` value and diff
      against `{daily, milestone, reset}`.

## Result log (fill on integration)

- Seed file reviewed: `<path>` at commit `<sha>`
- Total quotes: `<n>` (daily `<n>` / milestone `<n>` / reset `<n>`)
- Provenance: `<pass | findings>`
- Goldsmith reset line correct, not Confucius: `<yes | no>`
- Findings filed (mapped to PRD 7): `<list or none>`
