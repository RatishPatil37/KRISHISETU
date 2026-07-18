// ── Supabase configuration ──────────────────────────────────
// Keys are loaded from .env to avoid hardcoding credentials in source code.
// In your .env file, set: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
