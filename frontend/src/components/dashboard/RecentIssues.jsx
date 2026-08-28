import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ClipboardList, ChevronRight } from 'lucide-react';
import IssueCard from './IssueCard.jsx';
import EmptyIssuesState from './EmptyIssuesState.jsx';
import { sectionVariants, containerStagger, transitions } from '../../lib/motionVariants.js';

/**
 * RecentIssues
 *
 * Renders the user's 5 most recent issues from the database,
 * or the EmptyIssuesState if none exist.
 */
export default function RecentIssues({ issues, totalCount, limit = 5 }) {
  return (
    <motion.section
      id="recent-reports"
      variants={sectionVariants}
      className="space-y-4 sm:space-y-5"
    >
      {/* Section header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <ClipboardList size={16} strokeWidth={2} />
          </div>

          <h2
            className="text-lg sm:text-xl font-bold text-white tracking-tight"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            Recent Reports
          </h2>

          {totalCount > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[hsl(220_20%_18%)] text-slate-300 border border-[hsl(220_20%_24%)]">
              {totalCount}
            </span>
          )}
        </div>

        {totalCount > limit && (
          <Link
            id="view-all-issues-link"
            to="/issues"
            className="group inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors duration-150"
          >
            <span>View all</span>
            <ChevronRight
              size={13}
              className="transition-transform duration-150 group-hover:translate-x-0.5"
            />
          </Link>
        )}
      </div>

      {/* Content */}
      {issues.length === 0 ? (
        <EmptyIssuesState />
      ) : (
        <motion.div
          variants={containerStagger}
          initial="hidden"
          animate="visible"
          className="space-y-3.5 sm:space-y-4"
        >
          {issues.map((issue, i) => (
            <IssueCard key={issue.id} issue={issue} index={i} />
          ))}
        </motion.div>
      )}
    </motion.section>
  );
}
