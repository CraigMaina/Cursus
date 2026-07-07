import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Orchestrator-owned Supabase client wrapper. The single place credentials are read.
 * Only the anon key and URL (public, VITE_-prefixed) live here. Service-role, VAPID
 * private, and Resend keys are edge-function secrets and MUST NOT appear client-side.
 *
 * The data-access layer (src/data) imports this; no component imports it directly.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (cached) return cached;
  if (!url || !anonKey) {
    throw new Error(
      'Supabase env missing. Copy .env.example to .env.local and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    );
  }
  cached = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return cached;
}

/** True when client credentials are present, so the UI can degrade gracefully. */
export const isSupabaseConfigured = Boolean(url && anonKey);
