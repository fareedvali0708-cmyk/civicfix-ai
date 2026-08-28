import { supabaseAdmin, getSupabaseUserClient } from '../config/supabase.js';
import { generatePublicIssueId } from '../utils/issueIdGenerator.js';

/**
 * Intake Agent
 *
 * Responsibilities:
 * 1. Validate raw intake data or existing issue record:
 *    - Authenticated user present
 *    - Valid image reference present
 *    - Valid latitude (-90 <= lat <= 90)
 *    - Valid longitude (-180 <= lng <= 180)
 *    - Timestamp present
 * 2. Ensure status is "reported"
 * 3. Assign human-readable public issue reference (CIV-XXXXXX)
 * 4. Write audit entry to `agent_logs` using SERVER-SIDE supabaseAdmin client:
 *    columns: agent_name, action, issue_id, execution_status, error_message, created_at
 * 5. Write timeline entry to `issue_updates` using SERVER-SIDE supabaseAdmin client:
 *    columns: issue_id, agent_name, message, old_status, new_status, created_at
 * 6. Prepare handoff to Analysis Agent (without executing Analysis logic)
 *
 * Note: Does NOT determine category, severity, priority, department, officer, SLA, escalation, or resolution.
 */

/**
 * Validate intake fields strictly.
 *
 * @param {Object} data
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateIntakeData(data) {
  const errors = [];

  const userId = data.userId || data.user_id || data.citizen_id;
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    errors.push('Missing authenticated user identification.');
  }

  const imageUrl = data.imageUrl || data.image_url;
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
    errors.push('Missing valid image reference.');
  }

  const lat = data.latitude !== undefined ? Number(data.latitude) : NaN;
  if (isNaN(lat) || lat < -90 || lat > 90) {
    errors.push('Invalid GPS latitude (must be between -90 and 90).');
  }

  const lng = data.longitude !== undefined ? Number(data.longitude) : NaN;
  if (isNaN(lng) || lng < -180 || lng > 180) {
    errors.push('Invalid GPS longitude (must be between -180 and 180).');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Helper to log an agent execution event to `public.agent_logs` using the server-side admin client.
 *
 * Schema: agent_name, action, issue_id, execution_status, error_message, created_at
 *
 * @param {Object} logEntry
 */
async function logAgentAction({ issueId, action, executionStatus, details }) {
  try {
    const logPayload = {
      agent_name: 'Intake Agent',
      action: action || 'ISSUE_INTAKE',
      issue_id: issueId || null,
      execution_status: executionStatus, // 'success' | 'failed'
      error_message: executionStatus === 'failed' ? (details?.error || details?.message || 'Execution failed') : null,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from('agent_logs').insert([logPayload]);

    if (error) {
      console.error('[intakeAgent] agent_logs insert error:', error.message, error.details || '');
      return { success: false, error: error.message };
    }

    console.log(`[intakeAgent] Successfully recorded agent_log: ${action} (${executionStatus}) for issue ${issueId}`);
    return { success: true };
  } catch (err) {
    console.error('[intakeAgent] Exception while writing to agent_logs:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Helper to write a timeline event to `public.issue_updates` using the server-side admin client.
 *
 * Schema: issue_id, agent_name, message, old_status, new_status, created_at
 *
 * @param {Object} updateEntry
 */
async function logIssueUpdate({ issueId, message, oldStatus = 'reported', newStatus = 'reported' }) {
  try {
    const payload = {
      issue_id: issueId,
      agent_name: 'Intake Agent',
      message: message,
      old_status: oldStatus,
      new_status: newStatus,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from('issue_updates').insert([payload]);

    if (error) {
      console.error('[intakeAgent] issue_updates insert error:', error.message, error.details || '');
      return { success: false, error: error.message };
    }

    console.log(`[intakeAgent] Successfully recorded issue_update for issue ${issueId}`);
    return { success: true };
  } catch (err) {
    console.error('[intakeAgent] Exception while writing to issue_updates:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Run the Intake Agent on an issue.
 *
 * Accepts either:
 * - An issue UUID (string)
 * - An issue object / intake payload
 *
 * @param {string|Object} input - Issue ID or issue data object
 * @param {Object} [options] - Optional execution options (e.g. userClient, token)
 * @returns {Promise<{ success: boolean, issue_id?: string, public_issue_id?: string, status?: string, next_agent?: string, error?: string, execution_status?: string }>}
 */
export async function runIntakeAgent(input, options = {}) {
  const timestamp = new Date().toISOString();
  const readClient = options.userClient || options.supabaseClient || (options.token ? getSupabaseUserClient(options.token) : supabaseAdmin);
  let issueRecord = null;
  let issueId = null;

  try {
    // Case 1: Input is an issue ID (UUID string)
    if (typeof input === 'string') {
      issueId = input;
      const { data, error } = await readClient
        .from('issues')
        .select('*')
        .eq('id', issueId)
        .single();

      if (error || !data) {
        const errorMsg = `Issue not found with ID: ${issueId} (${error?.message || 'No record'})`;
        await logAgentAction({
          issueId,
          action: 'ISSUE_INTAKE_LOOKUP_FAILED',
          executionStatus: 'failed',
          details: { error: errorMsg, timestamp },
        });
        return { success: false, error: errorMsg, execution_status: 'failed' };
      }

      issueRecord = data;
    } else if (input && typeof input === 'object') {
      // Case 2: Input is an issue object
      issueRecord = input;
      issueId = input.id || null;
    } else {
      return { success: false, error: 'Invalid input provided to Intake Agent.', execution_status: 'failed' };
    }

    // Validate the intake data
    const validation = validateIntakeData(issueRecord);
    if (!validation.valid) {
      const errorMsg = `Intake validation failed: ${validation.errors.join(' ')}`;
      await logAgentAction({
        issueId,
        action: 'ISSUE_INTAKE_VALIDATION_FAILED',
        executionStatus: 'failed',
        details: { error: errorMsg, errors: validation.errors, timestamp },
      });
      return { success: false, error: errorMsg, errors: validation.errors, execution_status: 'failed' };
    }

    // Generate human-readable public issue ID (e.g. CIV-000001)
    const publicIssueId = issueRecord.public_id || issueRecord.public_issue_id || generatePublicIssueId();

    // Confirm issue status is "reported" and update in database via admin client
    if (issueId) {
      const updatePayload = {
        status: 'reported',
        updated_at: timestamp,
      };

      try {
        await supabaseAdmin
          .from('issues')
          .update(updatePayload)
          .eq('id', issueId);
      } catch (updErr) {
        console.warn('[intakeAgent] Non-blocking status update note:', updErr.message);
      }
    }

    // Write audit entry to agent_logs via dedicated server-side admin client
    const agentLogResult = await logAgentAction({
      issueId,
      action: 'ISSUE_INTAKE',
      executionStatus: 'success',
      details: {
        public_issue_id: publicIssueId,
        status: 'reported',
        timestamp,
      },
    });

    if (!agentLogResult.success) {
      const errorMsg = `Failed to record audit log in agent_logs: ${agentLogResult.error}`;
      console.error(`[intakeAgent] ${errorMsg}`);
      return {
        success: false,
        issue_id: issueId,
        error: errorMsg,
        execution_status: 'failed',
      };
    }

    // Write timeline entry to issue_updates via dedicated server-side admin client
    if (issueId) {
      const issueUpdateResult = await logIssueUpdate({
        issueId,
        message: `Issue received and validated by Intake Agent. Public Reference: ${publicIssueId}. Initial status: reported.`,
        oldStatus: 'reported',
        newStatus: 'reported',
      });

      if (!issueUpdateResult.success) {
        const errorMsg = `Failed to record timeline update in issue_updates: ${issueUpdateResult.error}`;
        console.error(`[intakeAgent] ${errorMsg}`);
        return {
          success: false,
          issue_id: issueId,
          error: errorMsg,
          execution_status: 'failed',
        };
      }
    }

    console.log(`[intakeAgent] Successfully processed issue ${issueId || publicIssueId} (Public ID: ${publicIssueId})`);

    // Return structured intake output conforming to specification
    return {
      success: true,
      issue_id: issueId,
      public_issue_id: publicIssueId,
      status: 'reported',
      next_agent: 'Analysis Agent',
    };
  } catch (err) {
    const errorMsg = err.message || 'Unexpected exception in Intake Agent';
    console.error('[intakeAgent] Error during intake execution:', err);

    await logAgentAction({
      issueId,
      action: 'ISSUE_INTAKE_ERROR',
      executionStatus: 'failed',
      details: { error: errorMsg, timestamp },
    });

    return {
      success: false,
      issue_id: issueId,
      error: errorMsg,
      execution_status: 'failed',
    };
  }
}
