import { getSupabaseUserClient, supabaseAdmin } from '../config/supabase.js';
import { orchestrate } from '../orchestrator/orchestrator.js';

/**
 * Controller for issue intake and agent triggers.
 *
 * Security:
 * - Validates the Supabase JWT from the Authorization header using the citizen-facing client
 * - Verifies the issue belongs to the authenticated citizen
 * - Uses server-side supabaseAdmin for internal agent logging & duplicate check
 */

/**
 * POST /api/issues/intake
 * POST /api/issues/:id/intake
 *
 * Triggers the Intake Agent and begins orchestration for a civic issue.
 * Requires a valid Supabase session JWT in the Authorization header.
 */
export async function processIntake(req, res, next) {
  try {
    console.log(`[issuesController] Incoming intake request for route: ${req.originalUrl || req.url}`);

    // 1. Extract Bearer token
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (authHeader || null);

    if (!token) {
      console.warn('[issuesController] Missing Authorization header / Bearer token.');
      return res.status(401).json({
        success: false,
        error: 'Authentication required. No valid session token provided.',
      });
    }

    // Citizen-scoped client that respects RLS with the user's JWT
    const userClient = getSupabaseUserClient(token);

    // 2. Verify auth with Supabase Auth server
    const { data: authData, error: authError } = await userClient.auth.getUser(token);

    if (authError || !authData?.user?.id) {
      console.error('[issuesController] JWT verification failed:', authError?.message);
      return res.status(401).json({
        success: false,
        error: 'Authentication failed. Your session may have expired — please sign in again.',
      });
    }

    const userId = authData.user.id;
    console.log(`[issuesController] Authenticated user: ${userId}`);

    // 3. Resolve the issue ID (from URL param or body)
    const issueId = req.params.id || req.body.issueId || req.body.issue?.id;

    if (!issueId || typeof issueId !== 'string' || !issueId.trim()) {
      console.warn('[issuesController] Missing issueId in request.');
      return res.status(400).json({
        success: false,
        error: 'Missing issueId. Provide it as a URL parameter or in the request body.',
      });
    }

    // 4. Verify issue existence and ownership
    let issueRecord = null;
    const { data: dbIssue, error: issueFetchError } = await userClient
      .from('issues')
      .select('*')
      .eq('id', issueId)
      .single();

    if (issueFetchError || !dbIssue) {
      // Fallback query with admin client in case of strict select policies
      const { data: adminIssue, error: adminFetchError } = await supabaseAdmin
        .from('issues')
        .select('*')
        .eq('id', issueId)
        .single();

      if (adminFetchError || !adminIssue) {
        if (req.body.issue && (req.body.issue.id === issueId || req.body.issue.citizen_id === userId || req.body.issue.user_id === userId)) {
          issueRecord = req.body.issue;
        } else {
          console.error(`[issuesController] Issue lookup failed for ${issueId}:`, issueFetchError?.message || adminFetchError?.message);
          return res.status(404).json({
            success: false,
            error: 'Issue not found or has been removed.',
          });
        }
      } else {
        issueRecord = adminIssue;
      }
    } else {
      issueRecord = dbIssue;
    }

    const ownerId = issueRecord.citizen_id || issueRecord.user_id;
    if (ownerId && ownerId !== userId) {
      console.warn(`[issuesController] Issue ownership mismatch for issue ${issueId}: owner ${ownerId} !== requester ${userId}`);
      return res.status(403).json({
        success: false,
        error: 'You are not authorised to process this issue.',
      });
    }

    console.log(`[issuesController] Verified issue ${issueId} belongs to user ${userId}`);

    // 5. Duplicate processing guard using server-side admin client
    let alreadyProcessed = false;

    try {
      const { data: logEntries, error: logCheckError } = await supabaseAdmin
        .from('agent_logs')
        .select('id, action, execution_status')
        .eq('issue_id', issueId)
        .eq('action', 'ISSUE_INTAKE')
        .eq('execution_status', 'success')
        .limit(1);

      if (!logCheckError && Array.isArray(logEntries) && logEntries.length > 0) {
        alreadyProcessed = true;
      }
    } catch (dupCheckErr) {
      console.warn('[issuesController] Non-blocking duplicate check note:', dupCheckErr.message);
    }

    if (alreadyProcessed) {
      console.log(`[issuesController] Intake already processed for issue ${issueId} — returning cached result.`);
      return res.status(200).json({
        success: true,
        issue_id: issueId,
        public_issue_id: issueRecord.public_id || issueRecord.public_issue_id || null,
        status: 'reported',
        next_agent: 'Analysis Agent',
        already_processed: true,
      });
    }

    // 6. Run orchestration (Intake Agent → Analysis Agent stub)
    const result = await orchestrate(issueRecord, { userClient, adminClient: supabaseAdmin, token, userId });

    if (!result.success) {
      console.error('[issuesController] Orchestration failed:', result.error);
      return res.status(422).json({
        success: false,
        error: result.error || 'Intake Agent processing failed.',
      });
    }

    console.log(`[issuesController] Intake successfully completed for issue ${issueId} (Public ID: ${result.public_issue_id})`);

    return res.status(200).json({
      success: true,
      issue_id: result.issue_id || issueId,
      public_issue_id: result.public_issue_id || null,
      status: result.status || 'assigned',
      category: result.category || null,
      severity: result.severity || null,
      confidence: result.confidence || null,
      recommended_department: result.recommended_department || null,
      department_name: result.department_name || null,
      officer_name: result.officer_name || null,
      sla_hours: result.sla_hours || null,
      sla_status: result.sla_status || null,
      sla_deadline: result.sla_deadline || null,
      escalated: result.escalated || false,
      escalation_reason: result.escalation_reason || null,
      resolution_state: result.resolution_state || null,
      next_agent: result.next_agent || 'Feedback Agent',
    });
  } catch (err) {
    console.error('[issuesController] Unhandled error during intake processing:', err);
    next(err);
  }
}
