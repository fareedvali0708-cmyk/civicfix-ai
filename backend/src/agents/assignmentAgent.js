import { supabaseAdmin, getSupabaseUserClient } from '../config/supabase.js';

/**
 * Assignment Agent
 *
 * Responsibilities:
 * 1. Read real Analysis Agent outputs (category, severity, recommended_department) and issue context.
 * 2. Select a suitable existing municipal department from `public.departments`.
 * 3. If a matching active officer exists in `public.officers`, assign one.
 * 4. If no officer exists or is available, keep officer unassigned (null) while completing department routing.
 * 5. Update only existing fields in `public.issues` (`department_id`, `assigned_officer_id`, `status`, `updated_at`).
 * 6. Record exactly one audit entry in `public.agent_logs` (`agent_name: "Assignment Agent"`, `action: "ISSUE_ASSIGNMENT"`, `execution_status: "success"`).
 * 7. Record one timeline event in `public.issue_updates`.
 * 8. Hand off to Monitoring Agent (`next_agent: "Monitoring Agent"`).
 * 9. Maintain idempotency to prevent duplicate assignment events.
 */

// Category to default Department Name mapping fallback
const CATEGORY_DEPARTMENT_MAP = {
  pothole: 'Roads & Infrastructure Department',
  road_damage: 'Roads & Infrastructure Department',
  streetlight: 'Electrical & Lighting Department',
  drainage: 'Water Supply & Sewerage Board',
  water_sanitation: 'Water Supply & Sewerage Board',
  garbage: 'Public Health & Sanitation',
  damaged_infrastructure: 'Public Works Department',
  other: 'Citizen Grievance & Municipal Services',
};

/**
 * Match a department from existing database departments or determine best routing name.
 *
 * @param {Array} departments - List of departments from database
 * @param {string} recommendedDepartment - Department recommended by Analysis Agent
 * @param {string} category - Issue category
 * @returns {{ departmentId: string|null, departmentName: string }}
 */
function resolveDepartment(departments, recommendedDepartment, category) {
  const fallbackName = CATEGORY_DEPARTMENT_MAP[category] || recommendedDepartment || 'Public Works Department';

  if (!Array.isArray(departments) || departments.length === 0) {
    return {
      departmentId: null,
      departmentName: recommendedDepartment || fallbackName,
    };
  }

  // 1. Try matching recommended_department against department name
  if (recommendedDepartment) {
    const normRec = recommendedDepartment.toLowerCase();
    const exactMatch = departments.find((d) => d.name && d.name.toLowerCase() === normRec);
    if (exactMatch) {
      return { departmentId: exactMatch.id, departmentName: exactMatch.name };
    }

    const partialMatch = departments.find(
      (d) => d.name && (d.name.toLowerCase().includes(normRec) || normRec.includes(d.name.toLowerCase()))
    );
    if (partialMatch) {
      return { departmentId: partialMatch.id, departmentName: partialMatch.name };
    }
  }

  // 2. Try matching category keywords against department name / description
  const categoryKeywords = {
    pothole: ['road', 'infrastructure', 'traffic', 'works'],
    road_damage: ['road', 'infrastructure', 'traffic', 'works'],
    streetlight: ['electric', 'light', 'energy', 'power'],
    drainage: ['drain', 'water', 'sewer', 'storm'],
    water_sanitation: ['water', 'sanitation', 'sewer', 'health'],
    garbage: ['garbage', 'waste', 'sanitation', 'health', 'clean'],
    damaged_infrastructure: ['works', 'infrastructure', 'building', 'public'],
    other: ['grievance', 'service', 'public', 'general', 'municipal'],
  };

  const keywords = categoryKeywords[category] || ['public', 'works'];

  for (const kw of keywords) {
    const match = departments.find(
      (d) =>
        (d.name && d.name.toLowerCase().includes(kw)) ||
        (d.description && d.description.toLowerCase().includes(kw))
    );
    if (match) {
      return { departmentId: match.id, departmentName: match.name };
    }
  }

  // 3. Default to first department in list
  const firstDept = departments[0];
  return {
    departmentId: firstDept?.id || null,
    departmentName: firstDept?.name || fallbackName,
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
      agent_name: 'Assignment Agent',
      action: action || 'ISSUE_ASSIGNMENT',
      issue_id: issueId || null,
      execution_status: executionStatus, // 'success' | 'failed'
      input: input || null,
      output: output || null,
      error_message: errorMessage || null,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from('agent_logs').insert([payload]);
    if (error) {
      console.error('[assignmentAgent] agent_logs insert error:', error.message);
    } else {
      console.log(`[assignmentAgent] Successfully recorded agent_log (${executionStatus}) for issue ${issueId}`);
    }
  } catch (err) {
    console.error('[assignmentAgent] Exception while writing to agent_logs:', err.message);
  }
}

/**
 * Helper to write a timeline event to `public.issue_updates`.
 *
 * @param {Object} params
 */
async function logIssueUpdate({ issueId, message, oldStatus = 'reported', newStatus = 'assigned', metadata = null }) {
  try {
    const payload = {
      issue_id: issueId,
      agent_name: 'Assignment Agent',
      message: message,
      old_status: oldStatus,
      new_status: newStatus,
      metadata: metadata,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from('issue_updates').insert([payload]);
    if (error) {
      console.error('[assignmentAgent] issue_updates insert error:', error.message);
    } else {
      console.log(`[assignmentAgent] Successfully recorded issue_update for issue ${issueId}`);
    }
  } catch (err) {
    console.error('[assignmentAgent] Exception while writing to issue_updates:', err.message);
  }
}

/**
 * Run the Assignment Agent on an issue.
 *
 * @param {string|Object} input - Issue UUID or issue record
 * @param {Object} [options] - Optional execution options (analysis data, userClient, token)
 * @returns {Promise<{ success: boolean, issue_id: string, agent_name: string, department_name?: string, department_id?: string|null, assigned_officer_id?: string|null, officer_name?: string|null, next_agent?: string|null, error?: string }>}
 */
export async function runAssignmentAgent(input, options = {}) {
  const issueId = typeof input === 'string' ? input : input?.id;
  const readClient = options.userClient || (options.token ? getSupabaseUserClient(options.token) : supabaseAdmin);

  if (!issueId) {
    return {
      success: false,
      issue_id: null,
      agent_name: 'Assignment Agent',
      error: 'Missing issueId for Assignment Agent.',
      next_agent: null,
    };
  }

  console.log(`[assignmentAgent] Starting Assignment Agent for issue: ${issueId}`);

  try {
    // 1. Fetch current issue record from database
    let issueRecord = null;
    if (typeof input === 'object' && input !== null && input.category) {
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
          throw new Error(`Issue not found for assignment: ${error?.message || adminErr?.message || issueId}`);
        }
        issueRecord = adminData;
      } else {
        issueRecord = data;
      }
    }

    // 2. Idempotency check: verify if successful assignment was already logged
    try {
      const { data: existingLogs, error: logCheckError } = await supabaseAdmin
        .from('agent_logs')
        .select('id, output, execution_status')
        .eq('issue_id', issueId)
        .eq('action', 'ISSUE_ASSIGNMENT')
        .eq('execution_status', 'success')
        .limit(1);

      if (!logCheckError && Array.isArray(existingLogs) && existingLogs.length > 0) {
        const cached = existingLogs[0].output || {};
        console.log(`[assignmentAgent] Issue ${issueId} has already been assigned. Returning cached result.`);
        return {
          success: true,
          issue_id: issueId,
          agent_name: 'Assignment Agent',
          department_name: cached.department_name || 'Assigned Department',
          department_id: cached.department_id || issueRecord.department_id || null,
          assigned_officer_id: cached.assigned_officer_id || issueRecord.assigned_officer_id || null,
          officer_name: cached.officer_name || null,
          next_agent: 'Monitoring Agent',
          already_processed: true,
        };
      }
    } catch (dupErr) {
      console.warn('[assignmentAgent] Non-blocking idempotency check notice:', dupErr.message);
    }

    // 3. Extract analysis inputs
    const analysisData = options.analysis || {};
    const category = analysisData.category || issueRecord.category || 'other';
    const severity = analysisData.severity || issueRecord.severity || 'medium';
    const recommendedDepartment = analysisData.recommended_department || issueRecord.ai_summary || null;

    console.log(`[assignmentAgent] Routing issue with category: "${category}", severity: "${severity}", recommended: "${recommendedDepartment}"`);

    // 4. Fetch available departments from database
    let departmentsList = [];
    try {
      const { data: depts, error: deptsErr } = await supabaseAdmin.from('departments').select('*');
      if (!deptsErr && Array.isArray(depts)) {
        departmentsList = depts;
      }
    } catch (deptFetchErr) {
      console.warn('[assignmentAgent] Note fetching departments table:', deptFetchErr.message);
    }

    // 5. Select matching department
    const { departmentId, departmentName } = resolveDepartment(departmentsList, recommendedDepartment, category);
    console.log(`[assignmentAgent] Selected Department: "${departmentName}" (ID: ${departmentId || 'unlinked'})`);

    // 6. Query matching active officer in public.officers if departmentId is available
    let officerId = null;
    let officerName = null;

    if (departmentId) {
      try {
        let query = supabaseAdmin
          .from('officers')
          .select('*')
          .eq('department_id', departmentId)
          .eq('is_active', true);

        if (issueRecord.ward) {
          query = query.eq('ward', issueRecord.ward);
        }

        const { data: officers, error: officersErr } = await query.limit(1);

        if (!officersErr && Array.isArray(officers) && officers.length > 0) {
          officerId = officers[0].id;
          officerName = officers[0].officer_name;
          console.log(`[assignmentAgent] Assigned to active officer: "${officerName}" (ID: ${officerId})`);
        } else if (issueRecord.ward) {
          // Fallback to any active officer in the department if ward match had 0 officers
          const { data: fallbackOfficers } = await supabaseAdmin
            .from('officers')
            .select('*')
            .eq('department_id', departmentId)
            .eq('is_active', true)
            .limit(1);

          if (Array.isArray(fallbackOfficers) && fallbackOfficers.length > 0) {
            officerId = fallbackOfficers[0].id;
            officerName = fallbackOfficers[0].officer_name;
            console.log(`[assignmentAgent] Assigned to department officer: "${officerName}" (ID: ${officerId})`);
          }
        }
      } catch (officerFetchErr) {
        console.warn('[assignmentAgent] Note querying officers:', officerFetchErr.message);
      }
    }

    if (!officerId) {
      console.log(`[assignmentAgent] No individual officer currently available. Department routing completed.`);
    }

    const timestamp = new Date().toISOString();
    const previousStatus = issueRecord.status || 'reported';
    const nextStatus = 'assigned';

    // 7. Update `public.issues` with assignment fields
    const updatePayload = {
      status: nextStatus,
      updated_at: timestamp,
      ...(departmentId ? { department_id: departmentId } : {}),
      ...(officerId ? { assigned_officer_id: officerId } : {}),
    };

    const { error: dbUpdateError } = await supabaseAdmin
      .from('issues')
      .update(updatePayload)
      .eq('id', issueId);

    if (dbUpdateError) {
      console.error(`[assignmentAgent] Failed to update issues table for issue ${issueId}:`, dbUpdateError.message);
    } else {
      console.log(`[assignmentAgent] Successfully updated public.issues record with status "${nextStatus}"`);
    }

    // 8. Record audit entry in `public.agent_logs`
    await logAgentAction({
      issueId,
      action: 'ISSUE_ASSIGNMENT',
      executionStatus: 'success',
      input: {
        category,
        severity,
        recommended_department: recommendedDepartment,
        ward: issueRecord.ward || null,
      },
      output: {
        department_name: departmentName,
        department_id: departmentId || null,
        officer_name: officerName || null,
        assigned_officer_id: officerId || null,
        assigned_status: nextStatus,
      },
    });

    // 9. Record timeline update in `public.issue_updates`
    const timelineMessage = officerName
      ? `Assignment Agent routed this issue to ${departmentName} and assigned Officer ${officerName}. Status transitioned to ${nextStatus}.`
      : `Assignment Agent routed this issue to ${departmentName} for departmental review. Status transitioned to ${nextStatus}.`;

    await logIssueUpdate({
      issueId,
      message: timelineMessage,
      oldStatus: previousStatus,
      newStatus: nextStatus,
      metadata: {
        department_name: departmentName,
        department_id: departmentId || null,
        officer_name: officerName || null,
        assigned_officer_id: officerId || null,
      },
    });

    // 10. Structured handoff to Monitoring Agent
    console.log(`[assignmentAgent] Completed successfully. Next agent: Monitoring Agent.`);
    return {
      success: true,
      issue_id: issueId,
      agent_name: 'Assignment Agent',
      department_name: departmentName,
      department_id: departmentId || null,
      assigned_officer_id: officerId || null,
      officer_name: officerName || null,
      next_agent: 'Monitoring Agent',
    };
  } catch (err) {
    const errorMsg = err.message || 'Unexpected exception during Assignment Agent execution.';
    console.error(`[assignmentAgent] Assignment failed for issue ${issueId}:`, errorMsg);

    await logAgentAction({
      issueId,
      action: 'ISSUE_ASSIGNMENT_ERROR',
      executionStatus: 'failed',
      errorMessage: errorMsg,
    });

    return {
      success: false,
      issue_id: issueId,
      agent_name: 'Assignment Agent',
      error: errorMsg,
      next_agent: null,
    };
  }
}
