/**
 * Two-user RLS proof (P1-A definition of done, ARCHITECTURE.md 7).
 *
 * Proves that user A cannot READ or WRITE user B's rows across every owner-scoped table,
 * that resets are read-only to clients, and that quotes / system templates are world-
 * readable. This is authored now and RUN ONCE credentials exist (docs/SETUP.md 9); there
 * is no local Supabase on the build machine yet, so it does not run in CI at authoring time.
 *
 * Requires (never commit these — pass via env):
 *   SUPABASE_URL                 project URL
 *   SUPABASE_ANON_KEY            anon public key
 *   SUPABASE_SERVICE_ROLE_KEY    service role key (server-only; used here to mint + delete
 *                                two throwaway test users without email confirmation)
 *
 * Run:  node supabase/tests/rls.mjs
 * Exit: 0 = all RLS assertions held; 1 = a violation (A saw or wrote B's data) or setup error.
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

const stamp = Date.now();
const emailA = `rls-a-${stamp}@example.com`;
const emailB = `rls-b-${stamp}@example.com`;
const password = 'Test-password-123!';

async function makeUser(email) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  return data.user.id;
}

async function clientFor(email) {
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`signIn ${email}: ${error.message}`);
  return c;
}

async function main() {
  const userAId = await makeUser(emailA);
  const userBId = await makeUser(emailB);
  const a = await clientFor(emailA);
  const b = await clientFor(emailB);

  // --- A seeds a full owned graph: challenge -> rule -> entry, plus a vice -> relapse ---
  const { data: chA, error: chErr } = await a
    .from('challenges')
    .insert({
      name: 'A private challenge',
      duration_days: 30,
      start_date: '2026-07-07',
      strictness: 'standard',
    })
    .select('*')
    .single();
  check('A can create own challenge', !chErr && !!chA, chErr?.message);

  const { data: ruleA } = await a
    .from('rules')
    .insert({
      challenge_id: chA.id,
      name: 'A rule',
      icon_slot: 'water',
      type: 'boolean',
      is_required: true,
      sort_order: 0,
    })
    .select('*')
    .single();

  const { data: entryA } = await a
    .from('entries')
    .insert({ rule_id: ruleA.id, entry_date: '2026-07-07', completed: true })
    .select('*')
    .single();

  const { data: viceA } = await a
    .from('vices')
    .insert({ name: 'A vice', quit_date: '2026-07-01' })
    .select('*')
    .single();

  await a.from('relapses').insert({ vice_id: viceA.id, relapse_date: '2026-07-05' });

  // --- B must not READ any of A's rows -------------------------------------
  const bReadChallenge = await b.from('challenges').select('*').eq('id', chA.id);
  check('B cannot read A challenge', (bReadChallenge.data ?? []).length === 0);

  const bReadRule = await b.from('rules').select('*').eq('id', ruleA.id);
  check('B cannot read A rule', (bReadRule.data ?? []).length === 0);

  const bReadEntry = await b.from('entries').select('*').eq('id', entryA.id);
  check('B cannot read A entry', (bReadEntry.data ?? []).length === 0);

  const bReadVice = await b.from('vices').select('*').eq('id', viceA.id);
  check('B cannot read A vice', (bReadVice.data ?? []).length === 0);

  const bReadAll = await b.from('entries').select('*');
  check(
    'B entries list excludes A rows',
    (bReadAll.data ?? []).every((e) => e.user_id === userBId),
  );

  // --- B must not WRITE A's rows -------------------------------------------
  const bUpd = await b
    .from('challenges')
    .update({ name: 'hijacked' })
    .eq('id', chA.id)
    .select('*');
  check('B cannot update A challenge', (bUpd.data ?? []).length === 0);

  const bDel = await b.from('challenges').delete().eq('id', chA.id).select('*');
  check('B cannot delete A challenge', (bDel.data ?? []).length === 0);

  const bInsEntry = await b
    .from('entries')
    .insert({ rule_id: ruleA.id, entry_date: '2026-07-08', completed: true })
    .select('*');
  check(
    'B cannot insert an entry against A rule',
    !!bInsEntry.error || (bInsEntry.data ?? []).length === 0,
  );

  // Confirm A still owns an unmodified challenge.
  const aReRead = await a.from('challenges').select('*').eq('id', chA.id).single();
  check(
    'A challenge intact after B write attempts',
    !aReRead.error && aReRead.data.name === 'A private challenge',
  );

  // --- Resets are read-only to clients (server-authoritative) --------------
  const bInsReset = await b
    .from('challenge_resets')
    .insert({ challenge_id: chA.id, reset_date: '2026-07-07' })
    .select('*');
  check(
    'Client cannot insert a challenge_reset',
    !!bInsReset.error || (bInsReset.data ?? []).length === 0,
  );
  const aInsReset = await a
    .from('challenge_resets')
    .insert({ challenge_id: chA.id, reset_date: '2026-07-07' })
    .select('*');
  check(
    'Even the owner cannot insert a reset from the client',
    !!aInsReset.error || (aInsReset.data ?? []).length === 0,
  );

  // --- Quotes + system templates are world-readable ------------------------
  const bQuotes = await b.from('quotes').select('*').limit(1);
  check('Quotes are world-readable', !bQuotes.error && (bQuotes.data ?? []).length >= 0);
  const bSysTpl = await b.from('templates').select('*').eq('is_system', true);
  check(
    'System templates are world-readable',
    !bSysTpl.error && (bSysTpl.data ?? []).length > 0,
    `${(bSysTpl.data ?? []).length} system templates`,
  );
  // A client must not be able to write a quote.
  const bWriteQuote = await b
    .from('quotes')
    .insert({ text: 'x', author: 'y', category: 'daily' })
    .select('*');
  check(
    'Client cannot insert a quote',
    !!bWriteQuote.error || (bWriteQuote.data ?? []).length === 0,
  );

  // --- Cleanup -------------------------------------------------------------
  await admin.auth.admin.deleteUser(userAId);
  await admin.auth.admin.deleteUser(userBId);

  console.log(`\n${failures === 0 ? 'ALL RLS CHECKS PASSED' : `${failures} RLS CHECK(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('RLS proof errored:', err.message);
  process.exit(1);
});
