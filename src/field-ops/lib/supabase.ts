/**
 * Single browser Supabase client for the Field Operations app.
 * Uses the SAME Supabase project as the mobile app — only the browser-safe
 * anon key is exposed (Vite inlines VITE_* into the client bundle).
 * The service-role key must NEVER appear here.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (import.meta.env.DEV && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn(
    '[field-ops] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. ' +
      'Copy .env.example to .env and fill them in.',
  );
}

/**
 * Single client instance keyed on globalThis so HMR does not create multiple
 * GoTrueClients (mirrors the mobile app's getSupabase()).
 * Unlike the mobile app we keep the default Navigator LockManager behaviour:
 * in a browser it is supported and prevents concurrent-tab refresh races.
 */
function getSupabase(): SupabaseClient {
  const key = '__hapyjo_supabase';
  const g = globalThis as unknown as Record<string, SupabaseClient | undefined>;
  if (!g[key]) {
    g[key] = createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'hapyjo-auth',
        },
      },
    );
  }
  return g[key]!;
}

export const supabase = getSupabase();
