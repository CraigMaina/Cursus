/**
 * Server-authoritative Strict-reset proof (P2-A definition of done).
 *
 * Proves the live evaluate_challenge_resets RPC:
 *   1. A Strict challenge with one missed required daily rule produces exactly ONE reset row
 *      at the missed date, and the effective start rewinds to the day after the miss.
 *   2. It is idempotent — re-running does not create a duplicate reset.
 *   3. A Standard challenge with the same miss produces ZERO resets.
 *   4. The client cannot write challenge_resets directly (server-authoritative).
 *
 * The scenario is seeded by a REAL signed-in user (anon key) so auth.uid() matches inside
 * the SECURITY DEFINER function, mirroring how the app calls it. The service role is used
 * only to mint/delete throwaway users, exactly like supabase/tests/rls.mjs.
 *
 * Requires (never commit these — pass via env):
 *   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 *
 * Run:  node supabase/tests/reset.mjs
 * Exit: 0 = all assertions held; 1 = a failure or setup error.
 */
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON || !SERVICE) {
  console.error(
    'Missing env. Set SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.',
  );
  process.exit(1);
}

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

let failures = 0;
function check(name, passed, detail = '') {
  const tag = passed ? 'PASS' : 'FAIL';
  if (!passed) failures += 1;
  console.log(`[${tag}] ${name}${detail ? ` — ${detail}` : ''}`);
}

const MS_PER_DAY = 86_400_000;
function isoUTCToday() {
  return new Date().toISOString().slice(0, 10);
}
function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + n * MS_PER_DAY).toISOString().slice(0, 10);
}

const stamp = Date.now();
const email = `reset-${stamp}@example.com`;
const password = 'Test-password-123!';

async function makeUser() {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(`createUser: ${error.message}`);
  return data.user.id;
}

async function clientFor() {
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`signIn: ${error.message}`);
  return c;
}

/**
 * Seed a challenge with one required daily boolean rule, completing every day from
 * start..throughToday EXCEPT `missDate` (left with no entry, i.e. a miss). Keeping every
 * other day complete makes the result independent of the time of day the test runs.
 */
async function seedChallenge(user, { strictness, start, throughToday, missDate }) {
  const { data: ch, error: chErr } = await user
    .from('challenges')
    .insert({
      name: `${strictness} reset scenario`,
      duration_days: 30,
      start_date: start,
      strictness,
    })
    .select('*')
    .single();
  if (chErr) throw new Error(`create challenge: ${chErr.message}`);

  const { data: rule, error: ruleErr } = await user
    .from('rules')
    .insert({
      challenge_id: ch.id,
      name: 'Required daily rule',
      icon_slot: 'water',
      type: 'boolean',
      frequency: 'daily',
      is_required: true,
      sort_order: 0,
    })
    .select('*')
    .single();
  if (ruleErr) throw new Error(`create rule: ${ruleErr.message}`);

  const rows = [];
  for (let d = start; d <= throughToday; d = addDays(d, 1)) {
    if (d === missDate) continue; // the miss: no completed entry this day
    rows.push({ rule_id: rule.id, entry_date: d, completed: true });
  }
  if (rows.length > 0) {
    const { error: entErr } = await user.from('entries').insert(rows);
    if (entErr) throw new Error(`seed entries: ${entErr.message}`);
  }
  return ch.id;
}

async function main() {
  const userId = await makeUser();
  const user = await clientFor();

  const today = isoUTCToday();
  const start = addDays(today, -5);
  const missDate = addDays(today, -3);

  // --- Scenario 1: Strict challenge, one miss -> exactly one reset --------------
  const strictId = await seedChallenge(user, {
    strictness: 'strict',
    start,
    throughToday: today,
    missDate,
  });

  const { data: resets1, error: rpcErr1 } = await user.rpc(
    'evaluate_challenge_resets',
    { p_challenge_id: strictId, p_through_date: today },
  );
  check('Strict RPC succeeds', !rpcErr1, rpcErr1?.message);
  check(
    'Strict miss produces exactly one reset',
    (resets1 ?? []).length === 1,
    `got ${(resets1 ?? []).length}`,
  );
  check(
    'Reset is dated at the missed day',
    (resets1 ?? [])[0]?.reset_date === missDate,
    `expected ${missDate}, got ${(resets1 ?? [])[0]?.reset_date}`,
  );
  // Effective start (derived) rewinds to the day AFTER the miss.
  const effStart =
    (resets1 ?? []).length > 0 ? addDays((resets1 ?? [])[0].reset_date, 1) : start;
  check(
    'Effective start rewinds to the day after the miss',
    effStart === addDays(missDate, 1),
    `effStart ${effStart}`,
  );

  // --- Scenario 2: idempotency -------------------------------------------------
  const { data: resets2 } = await user.rpc('evaluate_challenge_resets', {
    p_challenge_id: strictId,
    p_through_date: today,
  });
  check(
    'Re-running does not duplicate the reset (idempotent)',
    (resets2 ?? []).length === 1,
    `got ${(resets2 ?? []).length}`,
  );
  const { data: storedResets } = await user
    .from('challenge_resets')
    .select('*')
    .eq('challenge_id', strictId);
  check(
    'Exactly one reset row persisted after two evaluations',
    (storedResets ?? []).length === 1,
    `got ${(storedResets ?? []).length}`,
  );

  // --- Scenario 3: Standard never resets --------------------------------------
  const standardId = await seedChallenge(user, {
    strictness: 'standard',
    start,
    throughToday: today,
    missDate,
  });
  const { data: resets3, error: rpcErr3 } = await user.rpc(
    'evaluate_challenge_resets',
    { p_challenge_id: standardId, p_through_date: today },
  );
  check('Standard RPC succeeds', !rpcErr3, rpcErr3?.message);
  check(
    'Standard challenge never resets',
    (resets3 ?? []).length === 0,
    `got ${(resets3 ?? []).length}`,
  );
  const { data: standardStored } = await user
    .from('challenge_resets')
    .select('*')
    .eq('challenge_id', standardId);
  check(
    'No reset row written for a Standard challenge',
    (standardStored ?? []).length === 0,
    `got ${(standardStored ?? []).length}`,
  );

  // --- Scenario 4: client cannot write resets directly ------------------------
  const directInsert = await user
    .from('challenge_resets')
    .insert({ challenge_id: strictId, reset_date: addDays(today, -1) })
    .select('*');
  check(
    'Client cannot insert a challenge_reset directly',
    !!directInsert.error || (directInsert.data ?? []).length === 0,
  );

  // --- Cleanup -----------------------------------------------------------------
  await admin.auth.admin.deleteUser(userId); // cascades challenges/rules/entries/resets

  console.log(
    `\n${failures === 0 ? 'ALL RESET CHECKS PASSED' : `${failures} RESET CHECK(S) FAILED`}`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Reset proof errored:', err.message);
  process.exit(1);
});
