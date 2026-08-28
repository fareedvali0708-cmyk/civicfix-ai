import supabase from '../lib/supabase.js';

/**
 * issueDetailsService.js
 *
 * Fetches a single issue and its timeline updates for the
 * Citizen Issue Details / Tracking page (/issues/:id).
 *
 * All queries use the anon key — RLS enforces row-level ownership.
 * An additional userId filter is applied in JS as a defence-in-depth guard
 * in case RLS is misconfigured.
 */

const BUCKET_NAME = 'issue-images';

/**
 * Extract the storage object path from any image_url format.
 *
 * Handles two formats that may appear in existing rows:
 *   1. Full Supabase URL: https://<project>.supabase.co/storage/v1/object/public/issue-images/<path>
 *   2. Bare object path: <userId>/<filename>  (no leading slash)
 *
 * Returns the bare path (e.g. "abc-123/timestamp_photo.jpg") or null.
 *
 * @param {string} imageUrl - Value stored in issues.image_url
 * @returns {string|null}
 */
function extractStoragePath(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return null;

  // Pattern 1: full Supabase storage URL containing the bucket name
  // e.g. .../object/public/issue-images/<userId>/file.jpg
  //      .../object/sign/issue-images/<userId>/file.jpg
  const bucketMarker = `/${BUCKET_NAME}/`;
  const markerIndex = imageUrl.indexOf(bucketMarker);
  if (markerIndex !== -1) {
    const path = imageUrl.slice(markerIndex + bucketMarker.length);
    // Strip any query string (e.g. signed URL tokens)
    return path.split('?')[0] || null;
  }

  // Pattern 2: already a bare path (no protocol / host)
  if (!imageUrl.startsWith('http')) {
    return imageUrl.split('?')[0] || null;
  }

  return null;
}

/**
 * Generate a short-lived signed URL for a private issue-images object.
 *
 * The signed URL is valid for 3600 seconds (1 hour).
 * Ownership is guaranteed by the caller already having verified the issue
 * belongs to the authenticated user before this function is called.
 *
 * @param {string} imageUrl - Value stored in issues.image_url
 * @returns {Promise<string|null>} Signed URL, or null on failure
 */
export async function getSignedImageUrl(imageUrl) {
  const path = extractStoragePath(imageUrl);

  if (!path) {
    console.warn('[issueDetailsService] Could not extract storage path from image_url:', imageUrl);
    return null;
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, 3600); // 1-hour expiry

    if (error || !data?.signedUrl) {
      console.warn('[issueDetailsService] createSignedUrl failed:', error?.message);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.warn('[issueDetailsService] Unexpected error generating signed URL:', err.message);
    return null;
  }
}

/**
 * Fetch a single issue by UUID, scoped to the authenticated user.
 *
 * The query uses two ownership column names (citizen_id and user_id) so it
 * works regardless of which one the schema uses as the primary owner column.
 *
 * @param {string} issueId  - UUID of the requested issue
 * @param {string} userId   - Authenticated Supabase user ID
 * @returns {Promise<{ data: Object|null, error: string|null, notFound: boolean, forbidden: boolean }>}
 */
export async function fetchIssueById(issueId, userId) {
  if (!issueId || !userId) {
    return { data: null, error: 'Missing issue ID or user session.', notFound: false, forbidden: false };
  }

  try {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('id', issueId)
      .single();

    if (error) {
      // PostgREST returns PGRST116 when no rows match — treat as not found
      if (error.code === 'PGRST116' || error.message?.includes('JSON object requested')) {
        return { data: null, error: null, notFound: true, forbidden: false };
      }
      return { data: null, error: error.message || 'Failed to load issue.', notFound: false, forbidden: false };
    }

    if (!data) {
      return { data: null, error: null, notFound: true, forbidden: false };
    }

    // Defence-in-depth: verify ownership even if RLS already filtered
    const ownerId = data.citizen_id || data.user_id;
    if (ownerId && ownerId !== userId) {
      return { data: null, error: null, notFound: false, forbidden: true };
    }

    return { data, error: null, notFound: false, forbidden: false };
  } catch (err) {
    return {
      data: null,
      error: err.message || 'An unexpected error occurred while loading the issue.',
      notFound: false,
      forbidden: false,
    };
  }
}

/**
 * Fetch timeline updates for an issue, ordered oldest → newest.
 *
 * @param {string} issueId - UUID of the issue
 * @returns {Promise<{ data: Array, error: string|null }>}
 */
export async function fetchIssueUpdates(issueId) {
  if (!issueId) return { data: [], error: null };

  try {
    const { data, error } = await supabase
      .from('issue_updates')
      .select('*')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[issueDetailsService] issue_updates fetch error:', error.message);
      return { data: [], error: error.message };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: [], error: err.message || 'Failed to load timeline.' };
  }
}
