import supabase from '../lib/supabase.js';

/**
 * authService.js
 *
 * All Supabase Auth interactions are isolated here.
 * Components and context import from this module — never call supabase.auth directly.
 */

/**
 * Initiate Google OAuth sign-in with portal designation.
 * Redirects the browser to Google; Supabase then redirects back to /auth/callback.
 *
 * @param {'citizen'|'government'} [portal='citizen']
 */
export async function signInWithGoogle(portal = 'citizen') {
  sessionStorage.setItem('auth_portal', portal);
  const redirectTo = `${window.location.origin}/auth/callback?portal=${portal}`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;
}

/**
 * Sign the current user out.
 */
export async function signOut() {
  sessionStorage.removeItem('auth_portal');
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Retrieve the current session (null if not authenticated).
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Fetch profile record for the given user ID to obtain stored role.
 *
 * @param {string} userId
 * @returns {Promise<{ id: string, role: string, full_name?: string }|null>}
 */
export async function fetchUserProfile(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn('[authService] Profile fetch notice:', err.message);
  }
  return null;
}

/**
 * Subscribe to auth state changes.
 * Returns the unsubscribe function — call it in a useEffect cleanup.
 */
export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return data.subscription.unsubscribe;
}
