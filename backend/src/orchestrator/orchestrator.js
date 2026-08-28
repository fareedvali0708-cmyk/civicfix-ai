import { runIntakeAgent } from '../agents/intakeAgent.js';
import { runAnalysisAgent } from '../agents/analysisAgent.js';
import { runAssignmentAgent } from '../agents/assignmentAgent.js';
import { runMonitoringAgent } from '../agents/monitoringAgent.js';
import { runEscalationAgent } from '../agents/escalationAgent.js';
import { runClosureAgent } from '../agents/closureAgent.js';

/**
 * Agent Orchestrator
 *
 * Coordinates the full agentic pipeline for civic issue resolution:
 * Intake Agent → Analysis Agent → Assignment Agent → Monitoring Agent → [Escalation Agent] → Closure Agent → Feedback Agent
 */

/**
 * Orchestrate an issue through the workflow.
 *
 * @param {string|Object} issueInput - Issue ID or issue object
 * @param {Object} [options] - Optional execution options (e.g. scoped supabaseClient, token)
 * @returns {Promise<Object>} Orchestration execution result
 */
export async function orchestrate(issueInput, options = {}) {
  console.log(`[orchestrator] Starting orchestration for issue...`);

  // Step 1: Execute Intake Agent
  const intakeResult = await runIntakeAgent(issueInput, options);

  if (!intakeResult.success) {
    console.error(`[orchestrator] Intake Agent failed:`, intakeResult.error);
    return {
      success: false,
      stage: 'Intake Agent',
      error: intakeResult.error,
    };
  }

  console.log(`[orchestrator] Intake Agent completed successfully for issue ${intakeResult.issue_id || intakeResult.public_issue_id}.`);
  console.log(`[orchestrator] Preparing handoff to: ${intakeResult.next_agent}`);

  const targetIssueId = intakeResult.issue_id || (typeof issueInput === 'string' ? issueInput : issueInput?.id);
  let analysisResult = null;
  let assignmentResult = null;
  let monitoringResult = null;
  let escalationResult = null;
  let closureResult = null;

  // Step 2: Execute Analysis Agent
  if (targetIssueId) {
    try {
      console.log(`[orchestrator] Executing Analysis Agent for issue ${targetIssueId}...`);
      analysisResult = await runAnalysisAgent(targetIssueId, options);

      if (analysisResult.success) {
        console.log(`[orchestrator] Analysis Agent succeeded for issue ${targetIssueId}.`);
        console.log(`[orchestrator] Category: ${analysisResult.category}, Severity: ${analysisResult.severity}, Confidence: ${analysisResult.confidence}`);
        console.log(`[orchestrator] Preparing handoff to: ${analysisResult.next_agent}`);
      } else {
        console.warn(`[orchestrator] Analysis Agent returned failure:`, analysisResult.error);
      }
    } catch (analysisErr) {
      console.error(`[orchestrator] Analysis Agent exception:`, analysisErr.message);
      analysisResult = { success: false, error: analysisErr.message, next_agent: null };
    }
  }

  // Step 3: Execute Assignment Agent (if Analysis succeeded)
  if (targetIssueId && analysisResult?.success) {
    try {
      console.log(`[orchestrator] Executing Assignment Agent for issue ${targetIssueId}...`);
      assignmentResult = await runAssignmentAgent(targetIssueId, {
        ...options,
        analysis: analysisResult,
      });

      if (assignmentResult.success) {
        console.log(`[orchestrator] Assignment Agent succeeded for issue ${targetIssueId}.`);
        console.log(`[orchestrator] Assigned Department: "${assignmentResult.department_name}", Officer: "${assignmentResult.officer_name || 'unassigned'}"`);
        console.log(`[orchestrator] Preparing handoff to: ${assignmentResult.next_agent}`);
      } else {
        console.warn(`[orchestrator] Assignment Agent returned failure:`, assignmentResult.error);
      }
    } catch (assignmentErr) {
      console.error(`[orchestrator] Assignment Agent exception:`, assignmentErr.message);
      assignmentResult = { success: false, error: assignmentErr.message, next_agent: null };
    }
  }

  // Step 4: Execute Monitoring Agent (if Assignment succeeded)
  if (targetIssueId && assignmentResult?.success) {
    try {
      console.log(`[orchestrator] Executing Monitoring Agent for issue ${targetIssueId}...`);
      monitoringResult = await runMonitoringAgent(targetIssueId, {
        ...options,
        analysis: analysisResult,
        assignment: assignmentResult,
      });

      if (monitoringResult.success) {
        console.log(`[orchestrator] Monitoring Agent succeeded for issue ${targetIssueId}.`);
        console.log(`[orchestrator] SLA Status: "${monitoringResult.sla_status}", Remaining: ${monitoringResult.remaining_hours}h`);
        console.log(`[orchestrator] Next Agent: ${monitoringResult.next_agent}`);
      } else {
        console.warn(`[orchestrator] Monitoring Agent returned failure:`, monitoringResult.error);
      }
    } catch (monitoringErr) {
      console.error(`[orchestrator] Monitoring Agent exception:`, monitoringErr.message);
      monitoringResult = { success: false, error: monitoringErr.message, next_agent: null };
    }
  }

  // Step 5: Execute Escalation Agent (ONLY when genuine escalation condition is met)
  const isBreached = monitoringResult?.sla_status === 'breached';
  const isCritical = String(analysisResult?.severity).toLowerCase() === 'critical';

  if (targetIssueId && monitoringResult?.success && (isBreached || isCritical)) {
    try {
      console.log(`[orchestrator] Escalation condition triggered (breached=${isBreached}, critical=${isCritical}). Executing Escalation Agent...`);
      escalationResult = await runEscalationAgent(targetIssueId, {
        ...options,
        analysis: analysisResult,
        assignment: assignmentResult,
        monitoring: monitoringResult,
      });

      if (escalationResult.success && escalationResult.escalated) {
        console.log(`[orchestrator] Escalation Agent succeeded for issue ${targetIssueId}. Reason: "${escalationResult.reason}"`);
        console.log(`[orchestrator] Next Agent: ${escalationResult.next_agent}`);
      }
    } catch (escErr) {
      console.error(`[orchestrator] Escalation Agent exception:`, escErr.message);
      escalationResult = { success: false, error: escErr.message, next_agent: null };
    }
  }

  // Step 6: Execute Closure Agent (Resolution Stage)
  if (targetIssueId && (monitoringResult?.success || assignmentResult?.success)) {
    try {
      console.log(`[orchestrator] Executing Closure Agent for issue ${targetIssueId}...`);
      closureResult = await runClosureAgent(targetIssueId, {
        ...options,
        analysis: analysisResult,
        assignment: assignmentResult,
        monitoring: monitoringResult,
        escalation: escalationResult,
      });

      if (closureResult.success) {
        console.log(`[orchestrator] Closure Agent succeeded for issue ${targetIssueId}. Resolution state: "${closureResult.resolution_state}"`);
        console.log(`[orchestrator] Next Agent: ${closureResult.next_agent}`);
      }
    } catch (closureErr) {
      console.error(`[orchestrator] Closure Agent exception:`, closureErr.message);
      closureResult = { success: false, error: closureErr.message, next_agent: null };
    }
  }

  const finalStage = closureResult?.success
    ? 'Closure Stage Completed'
    : escalationResult?.escalated
      ? 'Escalation Completed'
      : monitoringResult?.success
        ? 'Monitoring Completed'
        : assignmentResult?.success
          ? 'Assignment Completed'
          : analysisResult?.success
            ? 'Analysis Completed'
            : 'Intake Completed';

  const finalNextAgent = closureResult?.success
    ? closureResult.next_agent // "Feedback Agent"
    : escalationResult?.escalated
      ? escalationResult.next_agent
      : monitoringResult?.success
        ? monitoringResult.next_agent
        : assignmentResult?.success
          ? assignmentResult.next_agent
          : null;

  const finalStatus = escalationResult?.escalated
    ? 'escalated'
    : assignmentResult?.success
      ? 'assigned'
      : intakeResult.status;

  return {
    success: true,
    stage: finalStage,
    issue_id: targetIssueId,
    public_issue_id: intakeResult.public_issue_id,
    status: finalStatus,
    category: analysisResult?.category || null,
    severity: analysisResult?.severity || null,
    confidence: analysisResult?.confidence || null,
    recommended_department: analysisResult?.recommended_department || null,
    department_name: assignmentResult?.department_name || null,
    department_id: assignmentResult?.department_id || null,
    assigned_officer_id: assignmentResult?.assigned_officer_id || null,
    officer_name: assignmentResult?.officer_name || null,
    sla_hours: monitoringResult?.sla_hours || null,
    sla_status: monitoringResult?.sla_status || null,
    sla_deadline: monitoringResult?.deadline || null,
    remaining_hours: monitoringResult?.remaining_hours ?? null,
    escalated: escalationResult?.escalated || false,
    escalation_reason: escalationResult?.reason || null,
    resolution_state: closureResult?.resolution_state || null,
    next_agent: finalNextAgent,
  };
}
