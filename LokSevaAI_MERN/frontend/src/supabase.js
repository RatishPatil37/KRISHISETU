import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Guard: fail fast in development if env vars are missing
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    '[KrishiSetu] Supabase credentials are missing. ' +
    'Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY to frontend/.env'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storageKey: 'krishisetu-auth',   // unique storage key — avoids conflicts with other Supabase apps
    autoRefreshToken: true,          // silently refresh the JWT before it expires
    persistSession: true,            // keep the session across page reloads
    detectSessionInUrl: true,        // automatically parse the OAuth hash callback
  },
});