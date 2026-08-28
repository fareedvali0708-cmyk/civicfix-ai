import { getStatusConfig } from '../../lib/statusConfig.js';

/**
 * IssueStatusBadge
 *
 * Renders an accessible, high-contrast status badge.
 * Colours and labels are centralized in statusConfig.js.
 */
export default function IssueStatusBadge({ status, className = '' }) {
  const cfg = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap transition-colors duration-150 ${className}`}
      style={{
        color: cfg.color,
        backgroundColor: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
        style={{ backgroundColor: cfg.dot }}
      />
      <span>{cfg.label}</span>
    </span>
  );
}
