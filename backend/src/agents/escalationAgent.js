import { supabaseAdmin, getSupabaseUserClient } from '../config/supabase.js';

/**
 * Escalation Agent
 *
 * Responsibilities:
 * 1. Evaluate deterministic escalation criteria:
 *    - Condition A: Monitoring Agent reported `sla_status === 'breached'`
 *    - Condition B: Issue severity is `'critical'`
 *    - Condition C: Existing SLA deadline has passed (`now > sla_deadline`)
 * 2. If NO escalation condition is met:
 *    - Return clean non-escalated result without inserting database rows or fake timeline events.
 *    - next_agent = "Closure Agent".
 * 3. If escalation IS required:
 *    - Insert record into `public.escalations` (issue_id, reason, previous_level, new_level, escalated_to_officer_id, escalated_at, created_at).
 *    - Update `public.issues` (status: 'escalated', updated_at).
 *    - Insert audit record into `public.agent_logs` (agent_name: 'Escalation Agent', action: 'ISSUE_ESCALATION', execution_status: 'success').
 *    - Insert timeline event into `public.issue_updates`.
 *    - Return next_agent = "Closure Agent".
 * 4. Maintain idempotency to prevent duplicate escalation events on retries.
 */

/**
 * Check whether an issue meets any deterministic escalation condition.
 *
 * @param {Object} issueRecord
 * @param {Object} [monitoringData]
 * @returns {{ shouldEscalate: boolean, reason: string }}
 */
export function checkEscalationCondition(issueRecord, monitoringData = {}) {
  const severity = String(issueRecord?.severity || monitoringData?.severity || '').toLowerCase();
  const slaStatus = String(monitoringData?.sla_status || '').toLowerCase();

  // Condition A: Monitoring Agent detected a breached SLA
  if (slaStatus === 'breached') {
    return {
      shouldEscalate: true,
      reason: 'SLA resolution deadline breached. Escalated for urgent municipal resolution.',
    };
  }

  // Condition B: Critical severity civic issue
  if (severity === 'critical') {
    return {
      shouldEscalate: true,
      reason: 'Critical severity civic hazard requiring immediate senior departmental intervention.',
    };
  }

  // Condition C: SLA deadline in database has expired
  if (issueRecord?.sla_deadline) {
    const deadlineTime = new Date(issueRecord.sla_deadline).getTime();
    if (!isNaN(deadlineTime) && Date.now() > deadlineTime) {
      return {
        shouldEscalate: true,
        reason: 'Target SLA resolution deadline exceeded. Escalated for priority handling.',
      };
    }
  }

  return {
    shouldEscalate: false,
    reason: 'No escalation condition met; issue is proceeding within normal operational parameters.',
  };
}

/**
 * Helper to record an agent action in `public.agent_logs`.
 *
 * @param {Object} params
 */
async function logAgentAction({ issueId, action, executionStatus, input, output, errorMessage }) {
  try {
    const payload = {
      agent_name: 'Escalation Agent',
      action: action || 'ISSUE_ESCALATION',
      issue_id: issueId || null,
      execution_status: executionStatus, // 'success' | 'failed'
      input: input || null,
      output: output || null,
      error_message: errorMessage || null,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from('agent_logs').insert([payload]);
    if (error) {
      console.error('[escalationAgent] agent_logs insert error:', error.message);
    } else {
      console.log(`[escalationAgent] Successfully recorded agent_log (${executionStatus}) for issue ${issueId}`);
    }
  } catch (err) {
    console.error('[escalationAgent] Exception while writing to agent_logs:', err.message);
  }
}

/**
 * Helper to write a timeline event to `public.issue_updates`.
 *
 * @param {Object} params
 */
async function logIssueUpdate({ issueId, message, oldStatus, newStatus, metadata = null }) {
  try {
    const payload = {
      issue_id: issueId,
      agent_name: 'Escalation Agent',
      message: message,
      old_status: oldStatus,
      new_status: newStatus,
      metadata: metadata,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from('issue_updates').insert([payload]);
    if (error) {
      console.error('[escalationAgent] issue_updates insert error:', error.message);
    } else {
      console.log(`[escalationAgent] Successfully recorded issue_update for issue ${issueId}`);
    }
  } catch (err) {
    console.error('[escalationAgent] Exception while writing to issue_updates:', err.message);
  }
}

/**
 * Run the Escalation Agent on an issue.
 *
 * @param {string|Object} input - Issue UUID or issue record
 * @param {Object} [options] - Execution options (monitoring data, analysis, userClient, token, forceReason)
 * @returns {Promise<{ success: boolean, issue_id: string, agent_name: string, escalated: boolean, reason: string, next_agent: string|null, error?: string }>}
 */
export async function runEscalationAgent(input, options = {}) {
  const issueId = typeof input === 'string' ? input : input?.id;
  const readClient = options.userClient || (options.token ? getSupabaseUserClient(options.token) : supabaseAdmin);

  if (!issueId) {
    return {
      success: false,
      issue_id: null,
      agent_name: 'Escalation Agent',
      escalated: false,
      reason: 'Missing issueId for Escalation Agent.',
      next_agent: null,
      error: 'Missing issueId for Escalation Agent.',
    };
  }

  console.log(`[escalationAgent] Evaluating Escalation Agent for issue: ${issueId}`);

  try {
    // 1. Fetch current issue record from database
    let issueRecord = null;
    if (typeof input === 'object' && input !== null && input.status) {
      issueRecord = input;
    } else {
      const { data, error } = await readClient
        .from('issues')
        .select('*')
        .eq('id', issueId)
        .single();

      if (error || !data) {
        const { data: adminData, error: adminErr } = await supabaseAdmin
          .from('issues')
          .select('*')
          .eq('id', issueId)
          .single();

        if (adminErr || !adminData) {
          throw new Error(`Issue not found for escalation check: ${error?.message || adminErr?.message || issueId}`);
        }
        issueRecord = adminData;
      } else {
        issueRecord = data;
      }
    }

    // 2. Evaluate escalation condition
    const monitoringData = options.monitoring || {};
    const { shouldEscalate, reason } = options.forceReason
      ? { shouldEscalate: true, reason: options.forceReason }
      : checkEscalationCondition(issueRecord, monitoringData);

    // 3. If NO escalation condition exists: return clean non-escalation result
    if (!shouldEscalate) {
      console.log(`[escalationAgent] No escalation condition met for issue ${issueId}. Normal flow continues.`);
      return {
        success: true,
        issue_id: issueId,
        agent_name: 'Escalation Agent',
        escalated: false,
        reason: reason,
        next_agent: 'Closure Agent',
      };
    }

    console.log(`[escalationAgent] Escalation triggered for issue ${issueId}. Reason: "${reason}"`);

    // 4. Idempotency check: verify if an escalation record already exists for this issue
    try {
      const { data: existingEscalations, error: escCheckErr } = await supabaseAdmin
        .from('escalations')
        .select('id, reason, created_at')
        .eq('issue_id', issueId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!escCheckErr && Array.isArray(existingEscalations) && existingEscalations.length > 0) {
        console.log(`[escalationAgent] Issue ${issueId} has already been escalated. Returning existing escalation.`);
        return {
          success: true,
          issue_id: issueId,
          agent_name: 'Escalation Agent',
          escalated: true,
          reason: existingEscalations[0].reason || reason,
          next_agent: 'Closure Agent',
          already_processed: true,
        };
      }
    } catch (dupErr) {
      console.warn('[escalationAgent] Non-blocking idempotency check notice:', dupErr.message);
    }

    const timestamp = new Date().toISOString();
    const previousStatus = issueRecord.status || 'assigned';
    const newStatus = 'escalated';

    // 5. Create escalation record in `public.escalations` using existing columns
    const escalationPayload = {
      issue_id: issueId,
      reason: reason,
      previous_level: previousStatus,
      new_level: newStatus,
      escalated_to_officer_id: issueRecord.assigned_officer_id || null,
      escalated_at: timestamp,
      created_at: timestamp,
    };

    const { error: escInsertErr } = await supabaseAdmin
      .from('escalations')
      .insert([escalationPayload]);

    if (escInsertErr) {
      console.error('[escalationAgent] Failed to insert into public.escalations:', escInsertErr.message);
    } else {
      console.log(`[escalationAgent] Successfully recorded escalation in public.escalations for issue ${issueId}`);
    }

    // 6. Update `public.issues` status to 'escalated'
    const { error: dbUpdateError } = await supabaseAdmin
      .from('issues')
      .update({
        status: newStatus,
        updated_at: timestamp,
      })
      .eq('id', issueId);

    if (dbUpdateError) {
      console.error(`[escalationAgent] Failed to update status in public.issues for issue ${issueId}:`, dbUpdateError.message);
    } else {
      console.log(`[escalationAgent] Successfully transitioned issue ${issueId} status to "${newStatus}"`);
    }

    // 7. Record audit log in `public.agent_logs`
    await logAgentAction({
      issueId,
      action: 'ISSUE_ESCALATION',
      executionStatus: 'success',
      input: {
        reason,
        severity: issueRecord.severity,
        sla_status: monitoringData.sla_status || null,
        sla_deadline: issueRecord.sla_deadline || null,
        previous_status: previousStatus,
      },
      output: {
        escalated: true,
        reason,
        new_status: newStatus,
        escalated_to_officer_id: issueRecord.assigned_officer_id || null,
      },
    });

    // 8. Record timeline update in `public.issue_updates`
    const timelineMessage = `Escalation Agent escalated this issue to senior departmental oversight. Reason: ${reason}`;

    await logIssueUpdate({
      issueId,
      message: timelineMessage,
      oldStatus: previousStatus,
      newStatus: newStatus,
      metadata: {
        reason,
        previous_status: previousStatus,
        new_status: newStatus,
        escalated_to_officer_id: issueRecord.assigned_officer_id || null,
      },
    });

    // 9. Structured handoff to Closure Agent
    console.log(`[escalationAgent] Escalation processing completed. Next agent: Closure Agent.`);
    return {
      success: true,
      issue_id: issueId,
      agent_name: 'Escalation Agent',
      escalated: true,
      reason: reason,
      next_agent: 'Closure Agent',
    };
  } catch (err) {
    const errorMsg = err.message || 'Unexpected exception during Escalation Agent execution.';
    console.error(`[escalationAgent] Escalation failed for issue ${issueId}:`, errorMsg);

    await logAgentAction({
      issueId,
      action: 'ISSUE_ESCALATION_ERROR',
      executionStatus: 'failed',
      errorMessage: errorMsg,
    });

    return {
      success: false,
      issue_id: issueId,
      agent_name: 'Escalation Agent',
      escalated: false,
      error: errorMsg,
      next_agent: null,
    };
  }
}
