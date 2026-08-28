import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPin, Calendar, ArrowRight, Image as ImageIcon } from 'lucide-react';
import IssueStatusBadge from './IssueStatusBadge.jsx';
import { getPriorityConfig } from '../../lib/statusConfig.js';
import { cardHover, transitions, buttonHoverTap } from '../../lib/motionVariants.js';

/**
 * Format a UTC ISO date string to a readable local date.
 */
function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Truncate text to maxLen characters with ellipsis.
 */
function truncate(text, maxLen = 110) {
  if (!text) return null;
  return text.length > maxLen ? `${text.slice(0, maxLen).trimEnd()}…` : text;
}

/**
 * IssueCard
 *
 * Displays a single issue from the real database.
 * "View Details" links to /issues/:id.
 */
export default function IssueCard({ issue, index = 0 }) {
  const priority = getPriorityConfig(issue.priority);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1], delay: index * 0.05 }}
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      className="
        group relative rounded-2xl overflow-hidden
        border border-[hsl(220_20%_18%)] hover:border-[hsl(220_20%_28%)]
        bg-[hsl(220_20%_13%/0.85)] backdrop-blur-sm
        transition-colors duration-200
      "
    >
      <div className="flex flex-col sm:flex-row">

        {/* Optional Image with hover scale */}
        {issue.image_url && (
          <div className="sm:w-44 sm:shrink-0 h-44 sm:h-auto overflow-hidden bg-[hsl(220_20%_16%)] relative">
            <img
              src={issue.image_url}
              alt={issue.title || 'Issue photo'}
              className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.parentElement.innerHTML =
                  `<div class="w-full h-full flex items-center justify-center text-slate-500"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>`;
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between gap-3.5 min-w-0">

          {/* Title & Status */}
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h3 className="font-semibold text-white text-base sm:text-lg leading-snug group-hover:text-blue-300 transition-colors duration-150 truncate">
                {issue.title || 'Untitled Issue'}
              </h3>
              <IssueStatusBadge status={issue.status} />
            </div>

            {issue.category && (
              <p className="text-xs font-medium text-slate-400 capitalize flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60" />
                <span>{issue.category.replace(/_/g, ' ')}</span>
              </p>
            )}
          </div>

          {/* Description */}
          {issue.description && (
            <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
              {truncate(issue.description)}
            </p>
          )}

          {/* Metadata Row & Action */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[hsl(220_20%_18%)]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
              {issue.address && (
                <span className="flex items-center gap-1.5 truncate max-w-[240px]">
                  <MapPin size={12} className="text-blue-400 shrink-0" />
                  <span className="truncate">{issue.address}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar size={12} className="text-slate-500 shrink-0" />
                <span>{formatDate(issue.created_at)}</span>
              </span>
              {issue.priority && (
                <span
                  className="font-semibold px-2 py-0.5 rounded-md"
                  style={{
                    color: priority.color,
                    backgroundColor: `${priority.color}15`,
                  }}
                >
                  {priority.label}
                </span>
              )}
            </div>

            {/* View Details CTA */}
            <motion.div
              variants={buttonHoverTap}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
            >
              <Link
                to={`/issues/${issue.id}`}
                id={`view-issue-${issue.id}`}
                className="
                  inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg
                  text-blue-300 hover:text-white
                  bg-blue-500/10 hover:bg-blue-500/20
                  border border-blue-500/20 hover:border-blue-500/40
                  transition-colors duration-150
                "
              >
                <span>View Details</span>
                <ArrowRight size={12} />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
