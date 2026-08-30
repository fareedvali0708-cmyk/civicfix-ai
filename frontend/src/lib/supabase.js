import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail fast with a clear message rather than silently redirecting to "placeholder"
if (!supabaseUrl) {
  throw new Error(
    '[supabase] Missing required environment variable: VITE_SUPABASE_URL\n' +
    'Copy frontend/.env.example to frontend/.env and set VITE_SUPABASE_URL.'
  );
}
if (!supabaseAnonKey) {
  throw new Error(
    '[supabase] Missing required environment variable: VITE_SUPABASE_ANON_KEY\n' +
    'Copy frontend/.env.example to frontend/.env and set VITE_SUPABASE_ANON_KEY.'
  );
}

/**
 * Public Supabase client using the anon key.
 * Row Level Security (RLS) policies apply to all requests made with this client.
 * Never import or use the service role key on the frontend.
 */
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});

export default supabase;
