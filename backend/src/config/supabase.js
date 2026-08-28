import { createClient } from '@supabase/supabase-js';
import config from './env.js';

if (!config.supabase.url) {
  console.warn(
    '[supabase] WARNING: Supabase URL is not configured in .env'
  );
}

if (!config.supabase.serviceRoleKey) {
  console.warn(
    '[supabase] WARNING: SUPABASE_SERVICE_ROLE_KEY is not configured. Server-side agent operations will fail if service role is required.'
  );
}

/**
 * Dedicated SERVER-SIDE Supabase Admin Client.
 *
 * Initialized with SUPABASE_SERVICE_ROLE_KEY to bypass Row Level Security (RLS)
 * for internal backend agent operations:
 * - Writing audit logs to `public.agent_logs`
 * - Writing timeline updates to `public.issue_updates`
 * - Internal issue status updates
 *
 * This client is NEVER exposed to the frontend.
 */
export const supabaseAdmin = createClient(
  config.supabase.url || 'http://placeholder',
  config.supabase.serviceRoleKey || 'placeholder',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Helper to get the server-side admin client.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function getSupabaseAdminClient() {
  return supabaseAdmin;
}

/**
 * Citizen-facing Supabase Client scoped to the user's JWT token.
 *
 * Uses the public anon key + the citizen's Bearer JWT so that Row Level Security (RLS)
 * is respected for user-context queries (e.g. verifying issue ownership).
 *
 * @param {string|null} token - Citizen JWT bearer token
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function getSupabaseUserClient(token = null) {
  const cleanToken = token?.startsWith('Bearer ') ? token.slice(7) : token;
  const key = config.supabase.anonKey || 'placeholder';

  return createClient(
    config.supabase.url || 'http://placeholder',
    key,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      ...(cleanToken
        ? {
            global: {
              headers: {
                Authorization: `Bearer ${cleanToken}`,
              },
            },
          }
        : {}),
    }
  );
}

// Alias for backwards-compatibility
export const getSupabaseClient = getSupabaseUserClient;

export default supabaseAdmin;
