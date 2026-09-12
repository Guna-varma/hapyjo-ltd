/// <reference types="vite/client" />

/**
 * Browser-safe environment variables the Field Operations app reads.
 *
 * Only values that are safe to ship inside the client bundle belong here — Vite
 * inlines every VITE_* variable into the built JavaScript. The Supabase anon key
 * is designed to be public and is governed by Row Level Security; the service-role
 * key must never appear in a VITE_* variable.
 */
interface ImportMetaEnv {
  /** Supabase project URL, e.g. https://dobfzbdwyimicxzcssiw.supabase.co */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon (publishable) key. RLS enforces access; this is not a secret. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
