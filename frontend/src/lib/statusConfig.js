/**
 * statusConfig.js
 *
 * Single source of truth for all issue status labels, colors, and icons.
 * All status-aware components import from here.
 *
 * Statuses match exactly those in the database schema:
 * reported | verified | assigned | in_progress | sla_risk |
 * escalated | resolved | reopened | closed
 */

export const STATUS_CONFIG = {
  reported: {
    label: 'Reported',
    color: 'hsl(213 94% 68%)',
    bg: 'hsl(213 94% 68% / 0.12)',
    border: 'hsl(213 94% 68% / 0.25)',
    dot: 'hsl(213 94% 68%)',
  },
  verified: {
    label: 'Verified',
    color: 'hsl(262 80% 70%)',
    bg: 'hsl(262 80% 70% / 0.12)',
    border: 'hsl(262 80% 70% / 0.25)',
    dot: 'hsl(262 80% 70%)',
  },
  assigned: {
    label: 'Assigned',
    color: 'hsl(199 89% 60%)',
    bg: 'hsl(199 89% 60% / 0.12)',
    border: 'hsl(199 89% 60% / 0.25)',
    dot: 'hsl(199 89% 60%)',
  },
  in_progress: {
    label: 'In Progress',
    color: 'hsl(38 92% 60%)',
    bg: 'hsl(38 92% 60% / 0.12)',
    border: 'hsl(38 92% 60% / 0.25)',
    dot: 'hsl(38 92% 60%)',
  },
  sla_risk: {
    label: 'SLA Risk',
    color: 'hsl(25 95% 60%)',
    bg: 'hsl(25 95% 60% / 0.12)',
    border: 'hsl(25 95% 60% / 0.25)',
    dot: 'hsl(25 95% 60%)',
  },
  escalated: {
    label: 'Escalated',
    color: 'hsl(0 85% 65%)',
    bg: 'hsl(0 85% 65% / 0.12)',
    border: 'hsl(0 85% 65% / 0.25)',
    dot: 'hsl(0 85% 65%)',
  },
  resolved: {
    label: 'Resolved',
    color: 'hsl(158 64% 52%)',
    bg: 'hsl(158 64% 52% / 0.12)',
    border: 'hsl(158 64% 52% / 0.25)',
    dot: 'hsl(158 64% 52%)',
  },
  reopened: {
    label: 'Reopened',
    color: 'hsl(0 85% 65%)',
    bg: 'hsl(0 85% 65% / 0.12)',
    border: 'hsl(0 85% 65% / 0.25)',
    dot: 'hsl(0 85% 65%)',
  },
  closed: {
    label: 'Closed',
    color: 'hsl(220 10% 55%)',
    bg: 'hsl(220 10% 55% / 0.12)',
    border: 'hsl(220 10% 55% / 0.25)',
    dot: 'hsl(220 10% 55%)',
  },
};

export const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'hsl(158 64% 52%)' },
  medium: { label: 'Medium', color: 'hsl(38 92% 60%)' },
  high: { label: 'High', color: 'hsl(25 95% 60%)' },
  critical: { label: 'Critical', color: 'hsl(0 85% 65%)' },
};

/** Returns STATUS_CONFIG entry or a safe fallback for unknown values. */
export function getStatusConfig(status) {
  return (
    STATUS_CONFIG[status] ?? {
      label: status ?? 'Unknown',
      color: 'hsl(220 10% 55%)',
      bg: 'hsl(220 10% 55% / 0.12)',
      border: 'hsl(220 10% 55% / 0.25)',
      dot: 'hsl(220 10% 55%)',
    }
  );
}

export function getPriorityConfig(priority) {
  return PRIORITY_CONFIG[priority] ?? { label: priority ?? '—', color: 'hsl(220 10% 55%)' };
}
