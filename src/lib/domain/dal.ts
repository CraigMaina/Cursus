import type {
  Challenge,
  ChallengeReset,
  Entry,
  NewChallengeInput,
  NewRelapseInput,
  NewViceInput,
  NotificationPrefs,
  Profile,
  Quote,
  QuoteCategory,
  Relapse,
  Rule,
  Template,
  UpsertEntryInput,
  Vice,
} from './schemas';

/**
 * Data-access layer contract (CLAUDE.md section 6 — the hard dependency boundary).
 *
 * The Architect implements this in src/data against Supabase, validating every I/O
 * with the zod schemas in ./schemas. The Frontend consumes ONLY this interface —
 * never the Supabase client directly, never raw SQL. This interface is the seam
 * that lets UI and backend be built in parallel worktrees.
 *
 * All methods are owner-scoped: the implementation relies on RLS (`user_id =
 * auth.uid()`) so callers never pass a userId; the session identifies the owner.
 * Methods reject (throw) on validation or auth failure; they never return partial
 * unvalidated rows.
 */
export interface CursusDataAccess {
  // --- Auth / profile -----------------------------------------------------
  getSession(): Promise<{ userId: string } | null>;
  signInWithPassword(email: string, password: string): Promise<void>;
  signUpWithPassword(email: string, password: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
  getProfile(): Promise<Profile>;
  updateProfile(patch: Partial<Omit<Profile, 'id' | 'createdAt'>>): Promise<Profile>;

  // --- Templates ----------------------------------------------------------
  listTemplates(): Promise<Template[]>; // system templates + this user's saved ones
  saveChallengeAsTemplate(challengeId: string): Promise<Template>;

  // --- Challenges & rules -------------------------------------------------
  listChallenges(opts?: { includeArchived?: boolean }): Promise<Challenge[]>;
  getChallenge(challengeId: string): Promise<{ challenge: Challenge; rules: Rule[] }>;
  createChallenge(input: NewChallengeInput, rules: Omit<Rule, 'id' | 'challengeId'>[]): Promise<Challenge>;
  startFromTemplate(templateId: string, startDate: string): Promise<Challenge>;
  updateChallenge(challengeId: string, patch: Partial<NewChallengeInput>): Promise<Challenge>;
  archiveChallenge(challengeId: string): Promise<void>;
  replaceRules(challengeId: string, rules: Omit<Rule, 'id' | 'challengeId'>[]): Promise<Rule[]>;

  // --- Entries (the Today view + calendar backfill) -----------------------
  listEntries(challengeId: string, range: { from: string; to: string }): Promise<Entry[]>;
  upsertEntry(input: UpsertEntryInput): Promise<Entry>; // keyed by (ruleId, entryDate)

  // --- Strict-mode resets (server-authoritative; read-only from client) ----
  listResets(challengeId: string): Promise<ChallengeReset[]>;
  /** Ask the server to (re)evaluate strict resets for a challenge up to `throughDate`.
   *  Authoritative reset logic lives server-side; this only triggers/returns it. */
  evaluateResets(challengeId: string, throughDate: string): Promise<ChallengeReset[]>;

  // --- Vices --------------------------------------------------------------
  listVices(opts?: { includeArchived?: boolean }): Promise<Vice[]>;
  createVice(input: NewViceInput): Promise<Vice>;
  updateVice(viceId: string, patch: Partial<NewViceInput>): Promise<Vice>;
  archiveVice(viceId: string): Promise<void>;
  listRelapses(viceId: string): Promise<Relapse[]>;
  logRelapse(input: NewRelapseInput): Promise<Relapse>;

  // --- Quotes (world-readable) --------------------------------------------
  getRewardQuote(category: QuoteCategory, excludeIds?: string[]): Promise<Quote>;

  // --- Notifications ------------------------------------------------------
  getNotificationPrefs(): Promise<NotificationPrefs>;
  updateNotificationPrefs(patch: Partial<Omit<NotificationPrefs, 'userId'>>): Promise<NotificationPrefs>;
  savePushSubscription(sub: { endpoint: string; keys: { p256dh: string; auth: string }; userAgent?: string }): Promise<void>;
  deletePushSubscription(endpoint: string): Promise<void>;

  // --- Photos -------------------------------------------------------------
  uploadProgressPhoto(entryId: string, file: Blob): Promise<{ path: string }>;
  getSignedPhotoUrl(path: string): Promise<string>;

  // --- Export -------------------------------------------------------------
  exportAllData(): Promise<unknown>; // full JSON export (PRD 4.1 #10)
}
