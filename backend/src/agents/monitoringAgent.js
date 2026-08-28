import { supabaseAdmin, getSupabaseUserClient } from '../config/supabase.js';

/**
 * Monitoring Agent
 *
 * Responsibilities:
 * 1. Read issue severity and creation timestamp to compute the deterministic SLA resolution window:
 *    - critical: 6 hours
 *    - high: 24 hours
 *    - medium: 48 hours
 *    - low: 72 hours
 * 2. Calculate SLA deadline = created_at + SLA window.
 * 3. Evaluate SLA state:
 *    - on_track: > 25% of SLA window remains
 *    - at_risk: 0% - 25% of SLA window remains
 *    - breached: deadline has passed (remaining <= 0)
 * 4. Update existing SLA fields in `public.issues` (`sla_hours`, `sla_deadline`, `updated_at`).
 * 5. Record audit entry in `public.agent_logs` (`agent_name: "Monitoring Agent"`, `action: "ISSUE_MONITORING"`, `execution_status: "success"`).
 * 6. Record timeline update in `public.issue_updates`.
 * 7. Determine handoff:
 *    - on_track / at_risk: next_agent = "Monitoring Complete"
 *    - breached: next_agent = "Escalation Agent"
 * 8. Preserve idempotency to prevent duplicate monitoring event storms.
 */

const SEVERITY_SLA_HOURS = {
  critical: 6,
  high: 24,
  medium: 48,
  low: 72,
};

/**
 * Calculate deterministic SLA parameters for an issue.
 *
 * @param {string} severity
 * @param {string|Date} createdAt
 * @param {Date} [nowDate=new Date()]
 * @returns {{ slaHours: number, deadline: Date, slaStatus: 'on_track'|'at_risk'|'breached', remainingHours: number }}
 */
export function calculateSlaStatus(severity, createdAt, nowDate = new Date()) {
  const normSeverity = String(severity || 'medium').toLowerCase();
  const slaHours = SEVERITY_SLA_HOURS[normSeverity] || 48;

  const createdTime = createdAt ? new Date(createdAt).getTime() : nowDate.getTime();
  const validCreatedTime = isNaN(createdTime) ? nowDate.getTime() : createdTime;

  const totalDurationMs = slaHours * 60 * 60 * 1000;
  const deadlineMs = validCreatedTime + totalDurationMs;
  const deadline = new Date(deadlineMs);

  const remainingMs = deadlineMs - nowDate.getTime();
  const remainingHours = Number(Math.max(0, remainingMs / (1000 * 60 * 60)).toFixed(1));
  const remainingRatio = remainingMs / totalDurationMs;

  let slaStatus = 'on_track';

  if (remainingMs <= 0) {
    slaStatus = 'breached';
  } else if (remainingRatio <= 0.25) {
    slaStatus = 'at_risk';
  } else {
    slaStatus = 'on_track';
  }

  return {
    slaHours,
    deadline,
    slaStatus,
    remainingHours,
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
      agent_name: 'Monitoring Agent',
      action: action || 'ISSUE_MONITORING',
      issue_id: issueId || null,
      execution_status: executionStatus, // 'success' | 'failed'
      input: input || null,
      output: output || null,
      error_message: errorMessage || null,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from('agent_logs').insert([payload]);
    if (error) {
      console.error('[monitoringAgent] agent_logs insert error:', error.message);
    } else {
      console.log(`[monitoringAgent] Successfully recorded agent_log (${executionStatus}) for issue ${issueId}`);
    }
  } catch (err) {
    console.error('[monitoringAgent] Exception while writing to agent_logs:', err.message);
  }
}

/**
 * Helper to write a timeline event to `public.issue_updates`.
 *
 * @param {Object} params
 */
async function logIssueUpdate({ issueId, message, oldStatus = 'assigned', newStatus = 'assigned', metadata = null }) {
  try {
    const payload = {
      issue_id: issueId,
      agent_name: 'Monitoring Agent',
      message: message,
      old_status: oldStatus,
      new_status: newStatus,
      metadata: metadata,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from('issue_updates').insert([payload]);
    if (error) {
      console.error('[monitoringAgent] issue_updates insert error:', error.message);
    } else {
      console.log(`[monitoringAgent] Successfully recorded issue_update for issue ${issueId}`);
    }
  } catch (err) {
    console.error('[monitoringAgent] Exception while writing to issue_updates:', err.message);
  }
}

/**
 * Run the Monitoring Agent on an issue.
 *
 * @param {string|Object} input - Issue UUID or issue record
 * @param {Object} [options] - Optional execution options (analysis, assignment, userClient, token)
 * @returns {Promise<{ success: boolean, issue_id: string, agent_name: string, severity?: string, sla_hours?: number, sla_status?: string, deadline?: string, remaining_hours?: number, next_agent?: string|null, error?: string }>}
 */
export async function runMonitoringAgent(input, options = {}) {
  const issueId = typeof input === 'string' ? input : input?.id;
  const readClient = options.userClient || (options.token ? getSupabaseUserClient(options.token) : supabaseAdmin);

  if (!issueId) {
    return {
      success: false,
      issue_id: null,
      agent_name: 'Monitoring Agent',
      error: 'Missing issueId for Monitoring Agent.',
      next_agent: null,
    };
  }

  console.log(`[monitoringAgent] Starting Monitoring Agent for issue: ${issueId}`);

  try {
    // 1. Fetch current issue record from database
    let issueRecord = null;
    if (typeof input === 'object' && input !== null && input.severity) {
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
          throw new Error(`Issue not found for monitoring: ${error?.message || adminErr?.message || issueId}`);
        }
        issueRecord = adminData;
      } else {
        issueRecord = data;
      }
    }

    // 2. Idempotency check: verify if recent successful monitoring was already logged
    try {
      const { data: existingLogs, error: logCheckError } = await supabaseAdmin
        .from('agent_logs')
        .select('id, output, execution_status, created_at')
        .eq('issue_id', issueId)
        .eq('action', 'ISSUE_MONITORING')
        .eq('execution_status', 'success')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!logCheckError && Array.isArray(existingLogs) && existingLogs.length > 0) {
        const cached = existingLogs[0].output || {};
        console.log(`[monitoringAgent] Issue ${issueId} has already been monitored. Returning cached result.`);
        return {
          success: true,
          issue_id: issueId,
          agent_name: 'Monitoring Agent',
          severity: cached.severity || issueRecord.severity,
          sla_hours: cached.sla_hours || issueRecord.sla_hours,
          sla_status: cached.sla_status || 'on_track',
          deadline: cached.sla_deadline || issueRecord.sla_deadline,
          remaining_hours: cached.remaining_hours,
          next_agent: cached.next_agent || (cached.sla_status === 'breached' ? 'Escalation Agent' : 'Monitoring Complete'),
          already_processed: true,
        };
      }
    } catch (dupErr) {
      console.warn('[monitoringAgent] Non-blocking idempotency check notice:', dupErr.message);
    }

    // 3. Resolve severity and calculation parameters
    const analysisData = options.analysis || {};
    const severity = analysisData.severity || issueRecord.severity || 'medium';
    const createdAt = issueRecord.created_at || new Date().toISOString();

    const { slaHours, deadline, slaStatus, remainingHours } = calculateSlaStatus(severity, createdAt);

    console.log(`[monitoringAgent] SLA Evaluated: Severity="${severity}", Window=${slaHours}h, Deadline=${deadline.toISOString()}, Status="${slaStatus}", Remaining=${remainingHours}h`);

    // 4. Determine next_agent based strictly on SLA evaluation
    const nextAgent = slaStatus === 'breached' ? 'Escalation Agent' : 'Monitoring Complete';
    const timestamp = new Date().toISOString();

    // 5. Update existing SLA fields in `public.issues`
    const updatePayload = {
      sla_hours: slaHours,
      sla_deadline: deadline.toISOString(),
      updated_at: timestamp,
    };

    const { error: dbUpdateError } = await supabaseAdmin
      .from('issues')
      .update(updatePayload)
      .eq('id', issueId);

    if (dbUpdateError) {
      console.error(`[monitoringAgent] Failed to update issues table for issue ${issueId}:`, dbUpdateError.message);
    } else {
      console.log(`[monitoringAgent] Successfully updated public.issues record with SLA deadline (${deadline.toISOString()})`);
    }

    // 6. Record audit entry in `public.agent_logs`
    await logAgentAction({
      issueId,
      action: 'ISSUE_MONITORING',
      executionStatus: 'success',
      input: {
        severity,
        created_at: createdAt,
        current_status: issueRecord.status || 'assigned',
      },
      output: {
        severity,
        sla_hours: slaHours,
        sla_deadline: deadline.toISOString(),
        sla_status: slaStatus,
        remaining_hours: remainingHours,
        next_agent: nextAgent,
      },
    });

    // 7. Record timeline update in `public.issue_updates`
    let timelineMessage = '';
    if (slaStatus === 'on_track') {
      timelineMessage = `Monitoring Agent checked SLA: issue is currently on track with ${remainingHours} hours remaining.`;
    } else if (slaStatus === 'at_risk') {
      timelineMessage = `Monitoring Agent detected SLA risk (${remainingHours} hours remaining); escalation may be required.`;
    } else {
      timelineMessage = `Monitoring Agent detected an SLA breach. Deadline of ${deadline.toLocaleString()} has passed.`;
    }

    await logIssueUpdate({
      issueId,
      message: timelineMessage,
      oldStatus: issueRecord.status || 'assigned',
      newStatus: issueRecord.status || 'assigned',
      metadata: {
        severity,
        sla_hours: slaHours,
        sla_deadline: deadline.toISOString(),
        sla_status: slaStatus,
        remaining_hours: remainingHours,
      },
    });

    // 8. Return structured monitoring result
    console.log(`[monitoringAgent] Monitoring completed successfully. Next agent: ${nextAgent}`);
    return {
      success: true,
      issue_id: issueId,
      agent_name: 'Monitoring Agent',
      severity,
      sla_hours: slaHours,
      sla_status: slaStatus,
      deadline: deadline.toISOString(),
      remaining_hours: remainingHours,
      next_agent: nextAgent,
    };
  } catch (err) {
    const errorMsg = err.message || 'Unexpected exception during Monitoring Agent execution.';
    console.error(`[monitoringAgent] Monitoring failed for issue ${issueId}:`, errorMsg);

    await logAgentAction({
      issueId,
      action: 'ISSUE_MONITORING_ERROR',
      executionStatus: 'failed',
      errorMessage: errorMsg,
    });

    return {
      success: false,
      issue_id: issueId,
      agent_name: 'Monitoring Agent',
      error: errorMsg,
      next_agent: null,
    };
  }
}
