import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Guard: Log warning instead of throwing error to prevent build-time crashes
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[KrishiSetu] Warning: Supabase credentials are missing. ' +
    'Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your environment.'
  );
}

// Use placeholders if keys are missing to prevent initialization crash during compile time
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co', 
  SUPABASE_ANON_KEY || 'placeholder', 
  {
    auth: {
      storageKey: 'krishisetu-auth',   // unique storage key — avoids conflicts with other Supabase apps
      autoRefreshToken: true,          // silently refresh the JWT before it expires
      persistSession: true,            // keep the session across page reloads
      detectSessionInUrl: true,        // automatically parse the OAuth hash callback
    },
  }
);