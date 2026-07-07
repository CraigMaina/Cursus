/**
 * Two-user RLS proof (PRD 10 policy pattern, PRD 11 acceptance).
 *
 * Proves, against a LIVE Supabase project, that:
 *   - user A cannot READ user B's challenges / rules / entries / vices / relapses;
 *   - user A cannot WRITE (insert/update/delete) into user B's rows;
 *   - quotes and system templates are world-readable by both users;
 *   - the private photo bucket does not leak another user's per-user path prefix.
 *
 * There is no live DB on the build machine yet, so this suite SKIPS unless the
 * required env vars are present. When they are, it runs for real. See
 * test/rls/README.md for how to provision the two users and run it.
 *
 * Required env (set in the shell or a .env consumed by your runner):
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY        (used only for cleanup + to confirm rows survive)
 *   RLS_USER_A_EMAIL, RLS_USER_A_PASSWORD
 *   RLS_USER_B_EMAIL, RLS_USER_B_PASSWORD
 *
 * The two users must already exist and be confirmed. This test creates rows as A,
 * asserts B is walled off, then deletes what it created via the service role.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  RLS_USER_A_EMAIL,
  RLS_USER_A_PASSWORD,
  RLS_USER_B_EMAIL,
  RLS_USER_B_PASSWORD,
} = process.env;

const hasEnv = Boolean(
  SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_SERVICE_ROLE_KEY &&
    RLS_USER_A_EMAIL &&
    RLS_USER_A_PASSWORD &&
    RLS_USER_B_EMAIL &&
    RLS_USER_B_PASSWORD,
);

if (!hasEnv) {
  // Visible breadcrumb so a skipped run is not mistaken for a passing RLS proof.
  // eslint-disable-next-line no-console
  console.warn(
    '[rls.two-user] SKIPPED: set SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ' +
      'RLS_USER_A_EMAIL/PASSWORD, RLS_USER_B_EMAIL/PASSWORD to run the live RLS proof. ' +
      'See test/rls/README.md.',
  );
}

const TODAY = new Date().toISOString().slice(0, 10);

describe.skipIf(!hasEnv)('two-user RLS isolation (live Supabase)', () => {
  let admin: SupabaseClient;
  let a: SupabaseClient;
  let b: SupabaseClient;
  let aId: string;
  let bId: string;

  // Ids of rows created as user A, torn down at the end via the service role.
  const created = {
    challengeId: '',
    ruleId: '',
    entryId: '',
    viceId: '',
    relapseId: '',
  };

  const authed = async (email: string, password: string) => {
    const client = createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
    return { client, userId: data.user!.id };
  };

  beforeAll(async () => {
    admin = createClient(SUPABASE_URL as string, SUPABASE_SERVICE_ROLE_KEY as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const A = await authed(RLS_USER_A_EMAIL as string, RLS_USER_A_PASSWORD as string);
    const B = await authed(RLS_USER_B_EMAIL as string, RLS_USER_B_PASSWORD as string);
    a = A.client;
    b = B.client;
    aId = A.userId;
    bId = B.userId;
    expect(aId).not.toEqual(bId);

    // Seed A's private data AS A, so the owner-only WITH CHECK passes.
    const ch = await a
      .from('challenges')
      .insert({ user_id: aId, name: 'A private challenge', duration_days: 75, start_date: TODAY, strictness: 'strict' })
      .select()
      .single();
    expect(ch.error, `A should be able to create its own challenge: ${ch.error?.message}`).toBeNull();
    created.challengeId = ch.data!.id;

    const rule = await a
      .from('rules')
      .insert({ challenge_id: created.challengeId, name: 'Water', icon_slot: 'water', type: 'quantity', target_value: 3.7, unit: 'L', frequency: 'daily', is_required: true, sort_order: 0 })
      .select()
      .single();
    expect(rule.error, `A should create its own rule: ${rule.error?.message}`).toBeNull();
    created.ruleId = rule.data!.id;

    const entry = await a
      .from('entries')
      .insert({ user_id: aId, rule_id: created.ruleId, entry_date: TODAY, completed: true, value: 3.7 })
      .select()
      .single();
    expect(entry.error, `A should create its own entry: ${entry.error?.message}`).toBeNull();
    created.entryId = entry.data!.id;

    const vice = await a
      .from('vices')
      .insert({ user_id: aId, name: 'A private vice', quit_date: TODAY })
      .select()
      .single();
    expect(vice.error, `A should create its own vice: ${vice.error?.message}`).toBeNull();
    created.viceId = vice.data!.id;

    const relapse = await a
      .from('relapses')
      .insert({ vice_id: created.viceId, relapse_date: TODAY, note: 'seed' })
      .select()
      .single();
    expect(relapse.error, `A should create its own relapse: ${relapse.error?.message}`).toBeNull();
    created.relapseId = relapse.data!.id;
  });

  afterAll(async () => {
    if (!admin) return;
    // Order respects FKs: relapse -> vice, entry -> rule -> challenge.
    await admin.from('relapses').delete().eq('id', created.relapseId);
    await admin.from('entries').delete().eq('id', created.entryId);
    await admin.from('rules').delete().eq('id', created.ruleId);
    await admin.from('vices').delete().eq('id', created.viceId);
    await admin.from('challenges').delete().eq('id', created.challengeId);
  });

  // ---- READ isolation: B sees none of A's rows -----------------------------

  it("B cannot read A's challenge", async () => {
    const { data, error } = await b.from('challenges').select('*').eq('id', created.challengeId);
    expect(error).toBeNull(); // RLS filters silently, it does not error on SELECT
    expect(data).toEqual([]);
  });

  it("B cannot read A's rule", async () => {
    const { data } = await b.from('rules').select('*').eq('id', created.ruleId);
    expect(data).toEqual([]);
  });

  it("B cannot read A's entry", async () => {
    const { data } = await b.from('entries').select('*').eq('id', created.entryId);
    expect(data).toEqual([]);
  });

  it("B cannot read A's vice", async () => {
    const { data } = await b.from('vices').select('*').eq('id', created.viceId);
    expect(data).toEqual([]);
  });

  it("B cannot read A's relapse", async () => {
    const { data } = await b.from('relapses').select('*').eq('id', created.relapseId);
    expect(data).toEqual([]);
  });

  // ---- WRITE isolation: B cannot mutate A's rows or insert as A ------------

  it("B cannot UPDATE A's challenge (0 rows affected, value unchanged)", async () => {
    const { data } = await b
      .from('challenges')
      .update({ name: 'HACKED BY B' })
      .eq('id', created.challengeId)
      .select();
    expect(data).toEqual([]); // no visible row to update under RLS

    // Confirm via service role that the row is untouched.
    const check = await admin.from('challenges').select('name').eq('id', created.challengeId).single();
    expect(check.data!.name).toBe('A private challenge');
  });

  it("B cannot DELETE A's challenge", async () => {
    const { data } = await b.from('challenges').delete().eq('id', created.challengeId).select();
    expect(data).toEqual([]);
    const check = await admin.from('challenges').select('id').eq('id', created.challengeId);
    expect(check.data).toHaveLength(1); // still there
  });

  it("B cannot INSERT an entry owned by A (WITH CHECK violation)", async () => {
    const { data, error } = await b
      .from('entries')
      .insert({ user_id: aId, rule_id: created.ruleId, entry_date: TODAY, completed: false })
      .select();
    expect(error, 'inserting a row owned by A must be rejected').not.toBeNull();
    expect(data).toBeNull();
  });

  it("B cannot INSERT a vice owned by A", async () => {
    const { error } = await b
      .from('vices')
      .insert({ user_id: aId, name: 'injected', quit_date: TODAY })
      .select();
    expect(error).not.toBeNull();
  });

  // ---- Shared read surface: quotes + system templates ----------------------

  it('quotes are world-readable and identical for both users', async () => {
    const ra = await a.from('quotes').select('id', { count: 'exact', head: true });
    const rb = await b.from('quotes').select('id', { count: 'exact', head: true });
    expect(ra.error).toBeNull();
    expect(rb.error).toBeNull();
    expect(rb.count).toBe(ra.count);
  });

  it('system templates are world-readable by both users', async () => {
    const ra = await a.from('templates').select('id', { count: 'exact', head: true }).is('user_id', null);
    const rb = await b.from('templates').select('id', { count: 'exact', head: true }).is('user_id', null);
    expect(ra.error).toBeNull();
    expect(rb.error).toBeNull();
    expect(rb.count).toBe(ra.count);
    expect((rb.count ?? 0)).toBeGreaterThan(0); // the six system templates should exist
  });

  it('neither user may INSERT into quotes (service-role locked)', async () => {
    const { error } = await a
      .from('quotes')
      .insert({ text: 'forged', author: 'nobody', category: 'daily' })
      .select();
    expect(error, 'anon/authed users must not be able to write quotes').not.toBeNull();
  });

  // ---- Storage: private photo bucket does not leak A's prefix --------------

  it("B cannot list A's photo path prefix in the private bucket", async () => {
    // Convention (PRD 10): photos live under a per-user prefix `${userId}/...`.
    const bucket = process.env.PHOTO_BUCKET ?? 'photos';
    const { data, error } = await b.storage.from(bucket).list(aId, { limit: 100 });
    // Either the policy errors, or it returns an empty listing. A non-empty list of
    // A's objects visible to B would be a leak.
    if (error) {
      expect(error).not.toBeNull();
    } else {
      expect(data ?? []).toEqual([]);
    }
  });
});
