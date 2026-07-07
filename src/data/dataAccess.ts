/**
 * Supabase implementation of the CursusDataAccess contract (src/lib/domain/dal.ts).
 *
 * Rules of this layer (ARCHITECTURE.md 3, architect primer):
 *  - The ONLY place @supabase/supabase-js is called on behalf of the app.
 *  - Every input is validated with an input zod schema before it leaves; every output is
 *    validated by a mapper (schema.parse) before it is returned.
 *  - Owner scoping is enforced by RLS (user_id = auth.uid()); callers never pass a userId.
 *  - Reset logic is server-authoritative: this layer can read resets but never writes them.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase/client';
import type { CursusDataAccess } from '@/lib/domain/dal';
import {
  newChallengeInput,
  newRelapseInput,
  newRuleInput,
  newViceInput,
  upsertEntryInput,
  type Challenge,
  type ChallengeReset,
  type Entry,
  type NewChallengeInput,
  type NewRelapseInput,
  type NewViceInput,
  type NotificationPrefs,
  type Profile,
  type Quote,
  type QuoteCategory,
  type Relapse,
  type Rule,
  type Template,
  type UpsertEntryInput,
  type Vice,
} from '@/lib/domain/schemas';
import {
  challengePatchToRow,
  challengeToRow,
  entryToRow,
  relapseToRow,
  ruleToRow,
  toChallenge,
  toChallengeReset,
  toEntry,
  toNotificationPrefs,
  toProfile,
  toQuote,
  toRelapse,
  toRule,
  toTemplate,
  toVice,
  vicePatchToRow,
  viceToRow,
} from './mappers';

const PHOTO_BUCKET = 'progress-photos';
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

/** Throw the PostgREST/Storage error if present, else return the data. */
function unwrap<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

function extFromMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/heic':
      return 'heic';
    default:
      return 'bin';
  }
}

export class SupabaseDataAccess implements CursusDataAccess {
  // Lazy: never construct the client at import time so the module loads even before env
  // is present (build, tests). getSupabase() is memoized upstream.
  private get sb(): SupabaseClient {
    return getSupabase();
  }

  private async requireUserId(): Promise<string> {
    const { data, error } = await this.sb.auth.getSession();
    if (error) throw new Error(error.message);
    const id = data.session?.user.id;
    if (!id) throw new Error('Not authenticated');
    return id;
  }

  // --- Auth / profile -------------------------------------------------------
  async getSession(): Promise<{ userId: string } | null> {
    const { data, error } = await this.sb.auth.getSession();
    if (error) throw new Error(error.message);
    return data.session ? { userId: data.session.user.id } : null;
  }

  async signInWithPassword(email: string, password: string): Promise<void> {
    const { error } = await this.sb.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }

  async signUpWithPassword(email: string, password: string): Promise<void> {
    const { error } = await this.sb.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
  }

  async signInWithGoogle(): Promise<void> {
    const redirectTo =
      typeof window !== 'undefined' ? window.location.origin : undefined;
    const { error } = await this.sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw new Error(error.message);
  }

  async signOut(): Promise<void> {
    const { error } = await this.sb.auth.signOut();
    if (error) throw new Error(error.message);
  }

  async getProfile(): Promise<Profile> {
    const row = unwrap(await this.sb.from('profiles').select('*').single());
    return toProfile(row as Record<string, unknown>);
  }

  async updateProfile(
    patch: Partial<Omit<Profile, 'id' | 'createdAt'>>,
  ): Promise<Profile> {
    const id = await this.requireUserId();
    const row: Record<string, unknown> = {};
    if (patch.displayName !== undefined) row.display_name = patch.displayName;
    if (patch.timezone !== undefined) row.timezone = patch.timezone;
    if (patch.eveningThresholdLocal !== undefined)
      row.evening_threshold_local = patch.eveningThresholdLocal;
    const updated = unwrap(
      await this.sb.from('profiles').update(row).eq('id', id).select('*').single(),
    );
    return toProfile(updated as Record<string, unknown>);
  }

  // --- Templates ------------------------------------------------------------
  async listTemplates(): Promise<Template[]> {
    // RLS returns system templates + this user's own. Ordering: system first, then name.
    const rows = unwrap(
      await this.sb
        .from('templates')
        .select('*')
        .order('is_system', { ascending: false })
        .order('name', { ascending: true }),
    );
    return (rows as Record<string, unknown>[]).map(toTemplate);
  }

  async saveChallengeAsTemplate(challengeId: string): Promise<Template> {
    const { challenge, rules } = await this.getChallenge(challengeId);
    const definition = {
      rules: rules.map((r) => {
        const { id: _id, challengeId: _cid, ...blueprint } = r;
        void _id;
        void _cid;
        return blueprint;
      }),
    };
    const row = unwrap(
      await this.sb
        .from('templates')
        .insert({
          name: challenge.name,
          description: challenge.description,
          duration_days: challenge.durationDays,
          strictness: challenge.strictness,
          is_system: false,
          definition,
        })
        .select('*')
        .single(),
    );
    return toTemplate(row as Record<string, unknown>);
  }

  // --- Challenges & rules ---------------------------------------------------
  async listChallenges(opts?: { includeArchived?: boolean }): Promise<Challenge[]> {
    let query = this.sb.from('challenges').select('*');
    if (!opts?.includeArchived) query = query.eq('is_archived', false);
    const rows = unwrap(await query.order('created_at', { ascending: false }));
    return (rows as Record<string, unknown>[]).map(toChallenge);
  }

  async getChallenge(
    challengeId: string,
  ): Promise<{ challenge: Challenge; rules: Rule[] }> {
    const challengeRow = unwrap(
      await this.sb.from('challenges').select('*').eq('id', challengeId).single(),
    );
    const ruleRows = unwrap(
      await this.sb
        .from('rules')
        .select('*')
        .eq('challenge_id', challengeId)
        .order('sort_order', { ascending: true }),
    );
    return {
      challenge: toChallenge(challengeRow as Record<string, unknown>),
      rules: (ruleRows as Record<string, unknown>[]).map(toRule),
    };
  }

  async createChallenge(
    input: NewChallengeInput,
    rules: Omit<Rule, 'id' | 'challengeId'>[],
  ): Promise<Challenge> {
    const parsed = newChallengeInput.parse(input);
    const challengeRow = unwrap(
      await this.sb.from('challenges').insert(challengeToRow(parsed)).select('*').single(),
    );
    const challenge = toChallenge(challengeRow as Record<string, unknown>);
    if (rules.length > 0) {
      const ruleRows = rules.map((r) => ruleToRow(challenge.id, newRuleInput.parse(r)));
      unwrap(await this.sb.from('rules').insert(ruleRows).select('id'));
    }
    return challenge;
  }

  async startFromTemplate(templateId: string, startDate: string): Promise<Challenge> {
    const tplRow = unwrap(
      await this.sb.from('templates').select('*').eq('id', templateId).single(),
    );
    const template = toTemplate(tplRow as Record<string, unknown>);
    return this.createChallenge(
      {
        name: template.name,
        description: template.description,
        durationDays: template.durationDays,
        startDate,
        strictness: template.strictness,
      },
      template.definition.rules,
    );
  }

  async updateChallenge(
    challengeId: string,
    patch: Partial<NewChallengeInput>,
  ): Promise<Challenge> {
    const row = unwrap(
      await this.sb
        .from('challenges')
        .update(challengePatchToRow(patch))
        .eq('id', challengeId)
        .select('*')
        .single(),
    );
    return toChallenge(row as Record<string, unknown>);
  }

  async archiveChallenge(challengeId: string): Promise<void> {
    unwrap(
      await this.sb
        .from('challenges')
        .update({ is_archived: true })
        .eq('id', challengeId)
        .select('id'),
    );
  }

  async replaceRules(
    challengeId: string,
    rules: Omit<Rule, 'id' | 'challengeId'>[],
  ): Promise<Rule[]> {
    unwrap(await this.sb.from('rules').delete().eq('challenge_id', challengeId).select('id'));
    if (rules.length === 0) return [];
    const ruleRows = rules.map((r) => ruleToRow(challengeId, newRuleInput.parse(r)));
    const inserted = unwrap(await this.sb.from('rules').insert(ruleRows).select('*'));
    return (inserted as Record<string, unknown>[]).map(toRule);
  }

  // --- Entries --------------------------------------------------------------
  async listEntries(
    challengeId: string,
    range: { from: string; to: string },
  ): Promise<Entry[]> {
    // entries has no challenge_id; resolve the challenge's rule ids first, then filter.
    const ruleRows = unwrap(
      await this.sb.from('rules').select('id').eq('challenge_id', challengeId),
    );
    const ruleIds = (ruleRows as { id: string }[]).map((r) => r.id);
    if (ruleIds.length === 0) return [];
    const rows = unwrap(
      await this.sb
        .from('entries')
        .select('*')
        .in('rule_id', ruleIds)
        .gte('entry_date', range.from)
        .lte('entry_date', range.to)
        .order('entry_date', { ascending: true }),
    );
    return (rows as Record<string, unknown>[]).map(toEntry);
  }

  async upsertEntry(input: UpsertEntryInput): Promise<Entry> {
    const parsed = upsertEntryInput.parse(input);
    const row = unwrap(
      await this.sb
        .from('entries')
        .upsert(entryToRow(parsed), { onConflict: 'rule_id,entry_date' })
        .select('*')
        .single(),
    );
    return toEntry(row as Record<string, unknown>);
  }

  // --- Strict-mode resets (read-only from the client) -----------------------
  async listResets(challengeId: string): Promise<ChallengeReset[]> {
    const rows = unwrap(
      await this.sb
        .from('challenge_resets')
        .select('*')
        .eq('challenge_id', challengeId)
        .order('reset_date', { ascending: true }),
    );
    return (rows as Record<string, unknown>[]).map(toChallengeReset);
  }

  async evaluateResets(
    challengeId: string,
    _throughDate: string,
  ): Promise<ChallengeReset[]> {
    // Phase 1: reset computation is server-side and lands in Phase 2. Until then this
    // returns the existing (server-written) resets; the client never fabricates one.
    void _throughDate;
    return this.listResets(challengeId);
  }

  // --- Vices ----------------------------------------------------------------
  async listVices(opts?: { includeArchived?: boolean }): Promise<Vice[]> {
    let query = this.sb.from('vices').select('*');
    if (!opts?.includeArchived) query = query.eq('is_archived', false);
    const rows = unwrap(await query.order('quit_date', { ascending: false }));
    return (rows as Record<string, unknown>[]).map(toVice);
  }

  async createVice(input: NewViceInput): Promise<Vice> {
    const parsed = newViceInput.parse(input);
    const row = unwrap(
      await this.sb.from('vices').insert(viceToRow(parsed)).select('*').single(),
    );
    return toVice(row as Record<string, unknown>);
  }

  async updateVice(viceId: string, patch: Partial<NewViceInput>): Promise<Vice> {
    const row = unwrap(
      await this.sb
        .from('vices')
        .update(vicePatchToRow(patch))
        .eq('id', viceId)
        .select('*')
        .single(),
    );
    return toVice(row as Record<string, unknown>);
  }

  async archiveVice(viceId: string): Promise<void> {
    unwrap(
      await this.sb.from('vices').update({ is_archived: true }).eq('id', viceId).select('id'),
    );
  }

  async listRelapses(viceId: string): Promise<Relapse[]> {
    const rows = unwrap(
      await this.sb
        .from('relapses')
        .select('*')
        .eq('vice_id', viceId)
        .order('relapse_date', { ascending: false }),
    );
    return (rows as Record<string, unknown>[]).map(toRelapse);
  }

  async logRelapse(input: NewRelapseInput): Promise<Relapse> {
    const parsed = newRelapseInput.parse(input);
    const row = unwrap(
      await this.sb.from('relapses').insert(relapseToRow(parsed)).select('*').single(),
    );
    return toRelapse(row as Record<string, unknown>);
  }

  // --- Quotes (world-readable) ----------------------------------------------
  async getRewardQuote(
    category: QuoteCategory,
    excludeIds: string[] = [],
  ): Promise<Quote> {
    const rows = unwrap(
      await this.sb.from('quotes').select('*').eq('category', category),
    ) as Record<string, unknown>[];
    const pool = rows.filter((r) => !excludeIds.includes(String(r.id)));
    const candidates = pool.length > 0 ? pool : rows;
    if (candidates.length === 0) {
      throw new Error(`No quotes seeded for category "${category}"`);
    }
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    return toQuote(pick);
  }

  // --- Notifications --------------------------------------------------------
  async getNotificationPrefs(): Promise<NotificationPrefs> {
    const existing = unwrap(
      await this.sb.from('notification_prefs').select('*').maybeSingle(),
    );
    if (existing) return toNotificationPrefs(existing as Record<string, unknown>);
    // First read: create the row with defaults (user_id defaults to auth.uid()).
    const created = unwrap(
      await this.sb
        .from('notification_prefs')
        .insert({ push_enabled: true, email_enabled: false })
        .select('*')
        .single(),
    );
    return toNotificationPrefs(created as Record<string, unknown>);
  }

  async updateNotificationPrefs(
    patch: Partial<Omit<NotificationPrefs, 'userId'>>,
  ): Promise<NotificationPrefs> {
    const userId = await this.requireUserId();
    const row: Record<string, unknown> = { user_id: userId };
    if (patch.pushEnabled !== undefined) row.push_enabled = patch.pushEnabled;
    if (patch.emailEnabled !== undefined) row.email_enabled = patch.emailEnabled;
    if (patch.quietStartLocal !== undefined) row.quiet_start_local = patch.quietStartLocal;
    if (patch.quietEndLocal !== undefined) row.quiet_end_local = patch.quietEndLocal;
    const updated = unwrap(
      await this.sb
        .from('notification_prefs')
        .upsert(row, { onConflict: 'user_id' })
        .select('*')
        .single(),
    );
    return toNotificationPrefs(updated as Record<string, unknown>);
  }

  async savePushSubscription(sub: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userAgent?: string;
  }): Promise<void> {
    unwrap(
      await this.sb
        .from('push_subscriptions')
        .upsert(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
            user_agent: sub.userAgent ?? null,
          },
          { onConflict: 'endpoint' },
        )
        .select('id'),
    );
  }

  async deletePushSubscription(endpoint: string): Promise<void> {
    unwrap(
      await this.sb
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint)
        .select('id'),
    );
  }

  // --- Photos ---------------------------------------------------------------
  async uploadProgressPhoto(entryId: string, file: Blob): Promise<{ path: string }> {
    const userId = await this.requireUserId();
    const ext = extFromMime(file.type || '');
    // Per-user path prefix is what the storage RLS policy checks: {user_id}/...
    const path = `${userId}/${entryId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await this.sb.storage
      .from(PHOTO_BUCKET)
      .upload(path, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });
    if (error) throw new Error(error.message);
    return { path };
  }

  async getSignedPhotoUrl(path: string): Promise<string> {
    const { data, error } = await this.sb.storage
      .from(PHOTO_BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
    if (error) throw new Error(error.message);
    return data.signedUrl;
  }

  // --- Export ---------------------------------------------------------------
  async exportAllData(): Promise<unknown> {
    const profile = await this.getProfile().catch(() => null);
    const challenges = unwrap(await this.sb.from('challenges').select('*'));
    const rules = unwrap(await this.sb.from('rules').select('*'));
    const entries = unwrap(await this.sb.from('entries').select('*'));
    const resets = unwrap(await this.sb.from('challenge_resets').select('*'));
    const vices = unwrap(await this.sb.from('vices').select('*'));
    const relapses = unwrap(await this.sb.from('relapses').select('*'));
    const templates = unwrap(
      await this.sb.from('templates').select('*').eq('is_system', false),
    );
    const notificationPrefs = unwrap(
      await this.sb.from('notification_prefs').select('*'),
    );
    const asRows = (v: unknown) => v as Record<string, unknown>[];
    return {
      exportedAt: new Date().toISOString(),
      profile,
      challenges: asRows(challenges).map(toChallenge),
      rules: asRows(rules).map(toRule),
      entries: asRows(entries).map(toEntry),
      resets: asRows(resets).map(toChallengeReset),
      vices: asRows(vices).map(toVice),
      relapses: asRows(relapses).map(toRelapse),
      templates: asRows(templates).map(toTemplate),
      notificationPrefs: asRows(notificationPrefs).map(toNotificationPrefs),
    };
  }
}
