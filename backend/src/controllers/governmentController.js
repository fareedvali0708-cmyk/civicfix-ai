import { supabaseAdmin, getSupabaseUserClient } from '../config/supabase.js';
import { calculateSlaStatus } from '../agents/monitoringAgent.js';

const BUCKET_NAME = 'issue-images';

/**
 * Extract storage object path from image_url.
 *
 * @param {string} imageUrl
 * @returns {string|null}
 */
function extractStoragePath(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return null;

  const bucketMarker = `/${BUCKET_NAME}/`;
  const markerIndex = imageUrl.indexOf(bucketMarker);
  if (markerIndex !== -1) {
    const path = imageUrl.slice(markerIndex + bucketMarker.length);
    return path.split('?')[0] || null;
  }

  if (!imageUrl.startsWith('http')) {
    return imageUrl.split('?')[0] || null;
  }

  return null;
}

/**
 * Generate a signed URL for private storage image.
 *
 * @param {string} imageUrl
 * @returns {Promise<string|null>}
 */
async function generateSignedUrl(imageUrl) {
  const path = extractStoragePath(imageUrl);
  if (!path) return imageUrl || null;

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, 3600); // 1-hour validity

    if (error || !data?.signedUrl) {
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    console.warn('[governmentController] Error generating signed URL:', err.message);
    return null;
  }
}

/**
 * Authenticate incoming request using user JWT.
 *
 * @param {Object} req
 * @returns {Promise<{ user: Object, token: string }>}
 */
async function authenticateRequest(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (authHeader || null);

  if (!token) {
    throw new Error('Authentication required. No session token provided.');
  }

  const userClient = getSupabaseUserClient(token);
  const { data: authData, error: authError } = await userClient.auth.getUser(token);

  if (authError || !authData?.user?.id) {
    throw new Error('Invalid or expired authentication session.');
  }

  return { user: authData.user, token, userClient };
}

/**
 * GET /api/government/overview
 *
 * Returns real overview statistics, issue queue, department metadata, and escalations.
 */
export async function getOverview(req, res, next) {
  try {
    const { userClient } = await authenticateRequest(req);

    // 1. Fetch real issues with userClient / adminClient fallback
    let issues = [];
    try {
      const { data: userData, error: userErr } = await userClient
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (!userErr && Array.isArray(userData)) {
        issues = userData;
      } else {
        const { data: adminData } = await supabaseAdmin
          .from('issues')
          .select('*')
          .order('created_at', { ascending: false });
        if (Array.isArray(adminData)) issues = adminData;
      }
    } catch (e) {
      console.warn('[governmentController] issues query notice:', e.message);
    }

    // 2. Fetch departments (handle permission / empty gracefully)
    let departments = [];
    try {
      const { data: depts, error: deptsErr } = await supabaseAdmin.from('departments').select('*');
      if (!deptsErr && Array.isArray(depts)) {
        departments = depts;
      } else {
        const { data: userDepts } = await userClient.from('departments').select('*');
        if (Array.isArray(userDepts)) departments = userDepts;
      }
    } catch (e) {
      console.warn('[governmentController] departments query notice:', e.message);
    }

    // 3. Fetch officers
    let officers = [];
    try {
      const { data: offs, error: offsErr } = await supabaseAdmin.from('officers').select('*');
      if (!offsErr && Array.isArray(offs)) {
        officers = offs;
      } else {
        const { data: userOffs } = await userClient.from('officers').select('*');
        if (Array.isArray(userOffs)) officers = userOffs;
      }
    } catch (e) {
      console.warn('[governmentController] officers query notice:', e.message);
    }

    // 4. Fetch escalations
    let escalations = [];
    try {
      const { data: escs, error: escsErr } = await supabaseAdmin
        .from('escalations')
        .select('*')
        .order('created_at', { ascending: false });
      if (!escsErr && Array.isArray(escs)) {
        escalations = escs;
      } else {
        const { data: userEscs } = await userClient.from('escalations').select('*').order('created_at', { ascending: false });
        if (Array.isArray(userEscs)) escalations = userEscs;
      }
    } catch (e) {
      console.warn('[governmentController] escalations query notice:', e.message);
    }

    // 5. Fetch recent agent logs
    let recentLogs = [];
    try {
      const { data: logs, error: logsErr } = await supabaseAdmin
        .from('agent_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (!logsErr && Array.isArray(logs)) {
        recentLogs = logs;
      } else {
        const { data: userLogs } = await userClient.from('agent_logs').select('*').order('created_at', { ascending: false }).limit(20);
        if (Array.isArray(userLogs)) recentLogs = userLogs;
      }
    } catch (e) {
      console.warn('[governmentController] agent_logs query notice:', e.message);
    }

    // Create lookup maps
    const deptMap = new Map(departments.map((d) => [d.id, d.name]));
    const officerMap = new Map(officers.map((o) => [o.id, o.officer_name]));
    const escalationIssueIds = new Set(escalations.map((e) => e.issue_id));

    // 6. Enrich issues with real relations and deterministic SLA calculations
    const enrichedIssues = await Promise.all(
      issues.map(async (issue) => {
        const slaCalc = calculateSlaStatus(issue.severity, issue.created_at);
        const signedPhotoUrl = issue.image_url ? await generateSignedUrl(issue.image_url) : null;
        const isEscalated = issue.status === 'escalated' || escalationIssueIds.has(issue.id);

        return {
          ...issue,
          department_name: deptMap.get(issue.department_id) || (issue.category ? issue.category.replace(/_/g, ' ') : 'Unassigned'),
          assigned_officer_name: officerMap.get(issue.assigned_officer_id) || null,
          sla_hours: issue.sla_hours || slaCalc.slaHours,
          sla_deadline: issue.sla_deadline || slaCalc.deadline.toISOString(),
          sla_status: slaCalc.slaStatus,
          remaining_hours: slaCalc.remainingHours,
          signed_image_url: signedPhotoUrl,
          is_escalated: isEscalated,
        };
      })
    );

    // 7. Calculate real summary metrics
    const totalIssues = enrichedIssues.length;
    const activeIssues = enrichedIssues.filter((i) => i.status !== 'resolved' && i.status !== 'closed').length;
    const criticalIssues = enrichedIssues.filter((i) => String(i.severity).toLowerCase() === 'critical').length;
    const slaRiskIssues = enrichedIssues.filter((i) => i.sla_status === 'at_risk' || i.sla_status === 'breached').length;
    const resolvedIssues = enrichedIssues.filter((i) => i.status === 'resolved' || i.status === 'closed').length;
    const totalEscalations = escalations.length || enrichedIssues.filter((i) => i.is_escalated).length;

    return res.status(200).json({
      success: true,
      stats: {
        totalIssues,
        activeIssues,
        criticalIssues,
        slaRiskIssues,
        resolvedIssues,
        totalEscalations,
      },
      issues: enrichedIssues,
      departments,
      officers,
      escalations,
      recentLogs,
    });
  } catch (err) {
    console.error('[governmentController] Error in getOverview:', err.message);
    return res.status(err.message.includes('Authentication') ? 401 : 500).json({
      success: false,
      error: err.message || 'Failed to load government overview.',
    });
  }
}

/**
 * GET /api/government/issues/:id
 *
 * Returns detailed view for a single issue including timeline, logs, and escalations.
 */
export async function getIssueDetail(req, res, next) {
  try {
    const { userClient } = await authenticateRequest(req);
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, error: 'Issue ID is required.' });
    }

    // 1. Fetch issue
    let issue = null;
    try {
      const { data: userData, error: userErr } = await userClient
        .from('issues')
        .select('*')
        .eq('id', id)
        .single();

      if (!userErr && userData) {
        issue = userData;
      } else {
        const { data: adminData } = await supabaseAdmin
          .from('issues')
          .select('*')
          .eq('id', id)
          .single();
        if (adminData) issue = adminData;
      }
    } catch (e) {
      console.warn('[governmentController] issue fetch notice:', e.message);
    }

    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found.' });
    }

    // 2. Fetch timeline updates
    let updates = [];
    try {
      const { data: userTimeline, error: timelineErr } = await userClient
        .from('issue_updates')
        .select('*')
        .eq('issue_id', id)
        .order('created_at', { ascending: true });
      if (!timelineErr && Array.isArray(userTimeline)) {
        updates = userTimeline;
      } else {
        const { data: adminTimeline } = await supabaseAdmin
          .from('issue_updates')
          .select('*')
          .eq('issue_id', id)
          .order('created_at', { ascending: true });
        if (Array.isArray(adminTimeline)) updates = adminTimeline;
      }
    } catch (e) {
      console.warn('[governmentController] issue_updates query notice:', e.message);
    }

    // 3. Fetch agent logs for this issue
    let agentLogs = [];
    try {
      const { data: userLogs, error: userLogsErr } = await userClient
        .from('agent_logs')
        .select('*')
        .eq('issue_id', id)
        .order('created_at', { ascending: true });
      if (!userLogsErr && Array.isArray(userLogs)) {
        agentLogs = userLogs;
      } else {
        const { data: adminLogs } = await supabaseAdmin
          .from('agent_logs')
          .select('*')
          .eq('issue_id', id)
          .order('created_at', { ascending: true });
        if (Array.isArray(adminLogs)) agentLogs = adminLogs;
      }
    } catch (e) {
      console.warn('[governmentController] agent_logs query notice:', e.message);
    }

    // 4. Fetch escalation record
    let escalation = null;
    try {
      const { data: userEscs, error: userEscErr } = await userClient
        .from('escalations')
        .select('*')
        .eq('issue_id', id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (!userEscErr && Array.isArray(userEscs) && userEscs.length > 0) {
        escalation = userEscs[0];
      } else {
        const { data: adminEscs } = await supabaseAdmin
          .from('escalations')
          .select('*')
          .eq('issue_id', id)
          .order('created_at', { ascending: false })
          .limit(1);
        if (Array.isArray(adminEscs) && adminEscs.length > 0) escalation = adminEscs[0];
      }
    } catch (e) {
      console.warn('[governmentController] escalations query notice:', e.message);
    }

    // 5. Enrich with SLA & Signed photo URL
    const slaCalc = calculateSlaStatus(issue.severity, issue.created_at);
    const signedPhotoUrl = issue.image_url ? await generateSignedUrl(issue.image_url) : null;

    // Fetch department & officer names if IDs present
    let departmentName = issue.category ? issue.category.replace(/_/g, ' ') : 'Unassigned';
    if (issue.department_id) {
      const { data: dept } = await supabaseAdmin.from('departments').select('name').eq('id', issue.department_id).single();
      if (dept?.name) departmentName = dept.name;
    }

    let officerName = null;
    if (issue.assigned_officer_id) {
      const { data: off } = await supabaseAdmin.from('officers').select('officer_name').eq('id', issue.assigned_officer_id).single();
      if (off?.officer_name) officerName = off.officer_name;
    }

    return res.status(200).json({
      success: true,
      issue: {
        ...issue,
        department_name: departmentName,
        assigned_officer_name: officerName,
        sla_hours: issue.sla_hours || slaCalc.slaHours,
        sla_deadline: issue.sla_deadline || slaCalc.deadline.toISOString(),
        sla_status: slaCalc.slaStatus,
        remaining_hours: slaCalc.remainingHours,
        signed_image_url: signedPhotoUrl,
      },
      updates,
      agentLogs,
      escalation,
    });
  } catch (err) {
    console.error('[governmentController] Error in getIssueDetail:', err.message);
    return res.status(err.message.includes('Authentication') ? 401 : 500).json({
      success: false,
      error: err.message || 'Failed to load issue details.',
    });
  }
}
