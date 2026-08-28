import api from './api.js';

/**
 * Government Command Center Service
 *
 * Provides real-time data fetching for municipal staff from the backend API.
 */

/**
 * Fetch overview statistics, enriched issues queue, departments, and escalations.
 *
 * @returns {Promise<{ success: boolean, stats: Object, issues: Array, departments: Array, officers: Array, escalations: Array, recentLogs: Array }>}
 */
export async function fetchGovernmentOverview() {
  try {
    const response = await api.get('/government/overview');
    return response.data;
  } catch (error) {
    console.error('[governmentService] fetchGovernmentOverview error:', error.message);
    throw error;
  }
}

/**
 * Fetch detailed view for a single issue including timeline and agent audit logs.
 *
 * @param {string} issueId - UUID of the issue
 * @returns {Promise<{ success: boolean, issue: Object, updates: Array, agentLogs: Array, escalation: Object|null }>}
 */
export async function fetchGovernmentIssueDetail(issueId) {
  if (!issueId) throw new Error('Missing issue ID.');

  try {
    const response = await api.get(`/government/issues/${issueId}`);
    return response.data;
  } catch (error) {
    console.error('[governmentService] fetchGovernmentIssueDetail error:', error.message);
    throw error;
  }
}
