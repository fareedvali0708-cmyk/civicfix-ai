import { supabaseAdmin, getSupabaseUserClient } from '../config/supabase.js';

/**
 * Closure Agent
 *
 * Responsibilities:
 * 1. Record the resolution readiness and closure stage for an issue.
 * 2. Maintain data integrity: does not falsely claim physical-world resolution without verified citizen confirmation.
 * 3. Update existing resolution fields in `public.issues` (`resolution_note`, `updated_at`).
 * 4. Record audit entry in `public.agent_logs` (`agent_name: "Closure Agent"`, `action: "ISSUE_CLOSURE"`, `execution_status: "success"`).
 * 5. Record timeline event in `public.issue_updates` with honest phrasing ("Resolution reported; awaiting citizen confirmation.").
 * 6. Structured handoff to Feedback Agent (`next_agent: "Feedback Agent"`).
 * 7. Enforce idempotency to prevent duplicate closure events.
 */

/**
 * Helper to record an agent action in `public.agent_logs`.
 *
 * @param {Object} params
 */
async function logAgentAction({ issueId, action, executionStatus, input, output, errorMessage }) {
  try {
    const payload = {
      agent_name: 'Closure Agent',
      action: action || 'ISSUE_CLOSURE',
      issue_id: issueId || null,
      execution_status: executionStatus, // 'success' | 'failed'
      input: input || null,
      output: output || null,
      error_message: errorMessage || null,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from('agent_logs').insert([payload]);
    if (error) {
      console.error('[closureAgent] agent_logs insert error:', error.message);
    } else {
      console.log(`[closureAgent] Successfully recorded agent_log (${executionStatus}) for issue ${issueId}`);
    }
  } catch (err) {
    console.error('[closureAgent] Exception while writing to agent_logs:', err.message);
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
      agent_name: 'Closure Agent',
      message: message,
      old_status: oldStatus,
      new_status: newStatus,
      metadata: metadata,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from('issue_updates').insert([payload]);
    if (error) {
      console.error('[closureAgent] issue_updates insert error:', error.message);
    } else {
      console.log(`[closureAgent] Successfully recorded issue_update for issue ${issueId}`);
    }
  } catch (err) {
    console.error('[closureAgent] Exception while writing to issue_updates:', err.message);
  }
}

/**
 * Run the Closure Agent on an issue.
 *
 * @param {string|Object} input - Issue UUID or issue record
 * @param {Object} [options] - Execution options (analysis, assignment, monitoring, escalation, userClient, token)
 * @returns {Promise<{ success: boolean, issue_id: string, agent_name: string, resolution_state: string, next_agent: string|null, error?: string }>}
 */
export async function runClosureAgent(input, options = {}) {
  const issueId = typeof input === 'string' ? input : input?.id;
  const readClient = options.userClient || (options.token ? getSupabaseUserClient(options.token) : supabaseAdmin);

  if (!issueId) {
    return {
      success: false,
      issue_id: null,
      agent_name: 'Closure Agent',
      resolution_state: 'failed',
      next_agent: null,
      error: 'Missing issueId for Closure Agent.',
    };
  }

  console.log(`[closureAgent] Starting Closure Agent for issue: ${issueId}`);

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
          throw new Error(`Issue not found for closure: ${error?.message || adminErr?.message || issueId}`);
        }
        issueRecord = adminData;
      } else {
        issueRecord = data;
      }
    }

    // 2. Idempotency check: verify if successful closure was already logged
    try {
      const { data: existingLogs, error: logCheckErr } = await supabaseAdmin
        .from('agent_logs')
        .select('id, output, execution_status')
        .eq('issue_id', issueId)
        .eq('action', 'ISSUE_CLOSURE')
        .eq('execution_status', 'success')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!logCheckErr && Array.isArray(existingLogs) && existingLogs.length > 0) {
        const cached = existingLogs[0].output || {};
        console.log(`[closureAgent] Issue ${issueId} has already been processed by Closure Agent. Returning cached result.`);
        return {
          success: true,
          issue_id: issueId,
          agent_name: 'Closure Agent',
          resolution_state: cached.resolution_state || 'awaiting_citizen_confirmation',
          next_agent: 'Feedback Agent',
          already_processed: true,
        };
      }
    } catch (dupErr) {
      console.warn('[closureAgent] Non-blocking idempotency check notice:', dupErr.message);
    }

    const timestamp = new Date().toISOString();
    const currentStatus = issueRecord.status || 'assigned';
    const resolutionState = 'awaiting_citizen_confirmation';
    const resolutionNote = 'Resolution workflow recorded; awaiting citizen verification and feedback.';

    // 3. Update existing resolution fields in `public.issues`
    const updatePayload = {
      resolution_note: resolutionNote,
      updated_at: timestamp,
    };

    const { error: dbUpdateError } = await supabaseAdmin
      .from('issues')
      .update(updatePayload)
      .eq('id', issueId);

    if (dbUpdateError) {
      console.error(`[closureAgent] Failed to update issues table for issue ${issueId}:`, dbUpdateError.message);
    } else {
      console.log(`[closureAgent] Successfully recorded resolution note for issue ${issueId}`);
    }

    // 4. Record audit entry in `public.agent_logs`
    await logAgentAction({
      issueId,
      action: 'ISSUE_CLOSURE',
      executionStatus: 'success',
      input: {
        current_status: currentStatus,
        severity: issueRecord.severity,
        is_escalated: currentStatus === 'escalated',
      },
      output: {
        resolution_state: resolutionState,
        resolution_verified: false,
        next_agent: 'Feedback Agent',
      },
    });

    // 5. Record timeline update in `public.issue_updates`
    const timelineMessage = 'Closure Agent recorded the resolution stage. Citizen confirmation is pending.';

    await logIssueUpdate({
      issueId,
      message: timelineMessage,
      oldStatus: currentStatus,
      newStatus: currentStatus,
      metadata: {
        resolution_state: resolutionState,
        resolution_verified: false,
      },
    });

    // 6. Structured handoff to Feedback Agent
    console.log(`[closureAgent] Completed successfully. Next agent: Feedback Agent.`);
    return {
      success: true,
      issue_id: issueId,
      agent_name: 'Closure Agent',
      resolution_state: resolutionState,
      next_agent: 'Feedback Agent',
    };
  } catch (err) {
    const errorMsg = err.message || 'Unexpected exception during Closure Agent execution.';
    console.error(`[closureAgent] Closure failed for issue ${issueId}:`, errorMsg);

    await logAgentAction({
      issueId,
      action: 'ISSUE_CLOSURE_ERROR',
      executionStatus: 'failed',
      errorMessage: errorMsg,
    });

    return {
      success: false,
      issue_id: issueId,
      agent_name: 'Closure Agent',
      resolution_state: 'failed',
      error: errorMsg,
      next_agent: null,
    };
  }
}
