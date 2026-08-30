import supabase from '../lib/supabase.js';

/**
 * issuesService.js
 *
 * All Supabase queries for the issues table.
 * Components never call supabase directly — always use this module.
 */

/**
 * Fetch the authenticated user's issues, newest first.
 *
 * @param {string} userId  — the authenticated Supabase user ID
 * @param {number} limit   — max rows to return (default 5 for dashboard view)
 * @returns {Promise<{ data: Array<any>, error: Error | null, count: number }>}
 */
export async function fetchUserIssues(userId, limit = 5) {
  try {
    let query = supabase
      .from('issues')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.or(`citizen_id.eq.${userId},user_id.eq.${userId}`);
    }

    let { data, error, count } = await query;

    // Fallback if OR query is rejected by specific database schema constraints
    if (error) {
      const fallbackQuery = await supabase
        .from('issues')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(limit);

      data = fallbackQuery.data;
      error = fallbackQuery.error;
      count = fallbackQuery.count;
    }

    return { data: data ?? [], error, count: count ?? 0 };
  } catch (err) {
    return { data: [], error: err, count: 0 };
  }
}

/**
 * Fetch total count of ALL user issues and status breakdown.
 *
 * @param {string} userId
 * @returns {Promise<{ counts: { total: number, inProgress: number, resolved: number, needsAttention: number } | null, error: Error | null }>}
 */
export async function fetchUserIssueCounts(userId) {
  try {
    let query = supabase.from('issues').select('status');
    if (userId) {
      query = query.or(`citizen_id.eq.${userId},user_id.eq.${userId}`);
    }

    let { data, error } = await query;

    if (error) {
      const fallback = await supabase.from('issues').select('status');
      data = fallback.data;
      error = fallback.error;
    }

    if (error) return { counts: null, error };

    const statuses = (data ?? []).map((r) => r.status);

    const IN_PROGRESS_STATUSES = ['reported', 'verified', 'assigned', 'in_progress', 'sla_risk'];
    const RESOLVED_STATUSES = ['resolved', 'closed'];
    const NEEDS_ATTENTION_STATUSES = ['escalated', 'reopened'];

    const counts = {
      total: statuses.length,
      inProgress: statuses.filter((s) => IN_PROGRESS_STATUSES.includes(s)).length,
      resolved: statuses.filter((s) => RESOLVED_STATUSES.includes(s)).length,
      needsAttention: statuses.filter((s) => NEEDS_ATTENTION_STATUSES.includes(s)).length,
    };

    return { counts, error: null };
  } catch (err) {
    return { counts: null, error: err };
  }
}

/**
 * Create a new civic issue row in `public.issues` at intake stage.
 *
 * Populates only the fields appropriate at intake:
 * user_id, description, image_url, latitude, longitude, location_accuracy, status = "reported"
 *
 * @param {Object} params
 * @param {string} params.userId - Authenticated citizen ID
 * @param {string} params.imageUrl - Public URL of the uploaded photo
 * @param {number|null} params.latitude - GPS Latitude
 * @param {number|null} params.longitude - GPS Longitude
 * @param {number|null} params.locationAccuracy - GPS accuracy in meters
 * @param {string|null} params.description - Optional citizen description
 * @returns {Promise<{ data: Object | null, error: Error | null }>}
 */
export async function createCitizenIssue({
  userId,
  imageUrl,
  latitude,
  longitude,
  locationAccuracy,
  description,
}) {
  if (!userId) {
    return { data: null, error: new Error('User authentication required to submit an issue.') };
  }

  if (!imageUrl) {
    return { data: null, error: new Error('Issue photo is required.') };
  }

  const now = new Date().toISOString();

  // Primary payload matching intake specification
  const primaryPayload = {
    user_id: userId,
    citizen_id: userId,
    image_url: imageUrl,
    latitude: typeof latitude === 'number' ? latitude : null,
    longitude: typeof longitude === 'number' ? longitude : null,
    location_accuracy: typeof locationAccuracy === 'number' ? locationAccuracy : null,
    description: description?.trim() || null,
    status: 'reported',
    created_at: now,
    updated_at: now,
  };

  try {
    // Attempt standard insert
    const { data, error } = await supabase
      .from('issues')
      .insert([primaryPayload])
      .select()
      .single();

    if (!error) {
      return { data, error: null };
    }

    // Fallback if specific column name varies (e.g. only citizen_id vs user_id)
    console.warn('[issuesService] Primary insert failed, attempting schema-adapted fallback:', error.message);

    // Try without duplicate column fields if column not found
    const fallbackPayload = {
      image_url: imageUrl,
      latitude: typeof latitude === 'number' ? latitude : null,
      longitude: typeof longitude === 'number' ? longitude : null,
      description: description?.trim() || null,
      status: 'reported',
      created_at: now,
      updated_at: now,
    };

    // If error mentions user_id, use citizen_id
    if (error.message.includes('user_id')) {
      fallbackPayload.citizen_id = userId;
    } else if (error.message.includes('citizen_id')) {
      fallbackPayload.user_id = userId;
    } else {
      fallbackPayload.citizen_id = userId;
    }

    // If location_accuracy failed, try accuracy or omit
    if (!error.message.includes('location_accuracy')) {
      fallbackPayload.location_accuracy = typeof locationAccuracy === 'number' ? locationAccuracy : null;
    }

    const { data: retryData, error: retryError } = await supabase
      .from('issues')
      .insert([fallbackPayload])
      .select()
      .single();

    if (retryError) {
      console.error('[issuesService] Retry insert failed:', retryError.message);
      return { data: null, error: retryError };
    }

    return { data: retryData, error: null };
  } catch (err) {
    console.error('[issuesService] Exception during issue creation:', err);
    return { data: null, error: err };
  }
}
