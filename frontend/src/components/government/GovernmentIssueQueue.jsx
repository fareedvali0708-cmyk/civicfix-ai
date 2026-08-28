import { motion } from 'motion/react';
import {
  Clock,
  AlertTriangle,
  Flame,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  Building,
  User,
  Image as ImageIcon,
} from 'lucide-react';
import { containerStagger, itemFadeUp, cardHover } from '../../lib/motionVariants.js';

export default function GovernmentIssueQueue({ issues = [], selectedIssueId, onSelectIssue, loading }) {
  if (loading) {
    return (
      <div className="space-y-3 p-8 text-center bg-[hsl(222,25%,12%/0.6)] border border-[hsl(222,20%,18%)] rounded-2xl backdrop-blur-md">
        <div className="w-8 h-8 mx-auto border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-300">Loading municipal issue queue...</p>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="p-12 text-center bg-[hsl(222,25%,12%/0.4)] border border-[hsl(222,20%,18%)] rounded-2xl backdrop-blur-md">
        <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-2xl bg-[hsl(222,20%,16%)] text-slate-400">
          <CheckCircle2 size={24} />
        </div>
        <h3 className="text-base font-bold text-white mb-1" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
          No Matching Issues Found
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          No civic issues currently match the selected criteria. Adjust your filters or wait for new reports.
        </p>
      </div>
    );
  }

  const getSeverityBadge = (sev) => {
    const s = String(sev || '').toLowerCase();
    switch (s) {
      case 'critical':
        return 'bg-red-500/20 text-red-300 border-red-500/40 ring-1 ring-red-500/30';
      case 'high':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'medium':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'low':
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
      default:
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    }
  };

  const getStatusBadge = (st, isEscalated) => {
    if (isEscalated) {
      return 'bg-red-600/20 text-red-300 border-red-500/40';
    }
    const s = String(st || '').toLowerCase();
    switch (s) {
      case 'reported':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'assigned':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'in_progress':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'resolved':
      case 'closed':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    }
  };

  const getSlaBadge = (slaStatus, remainingHours) => {
    switch (slaStatus) {
      case 'breached':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
            <AlertTriangle size={11} />
            BREACHED
          </span>
        );
      case 'at_risk':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Clock size={11} className="text-amber-400 animate-pulse" />
            AT RISK ({remainingHours}h)
          </span>
        );
      case 'on_track':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <Clock size={11} />
            ON TRACK ({remainingHours}h)
          </span>
        );
    }
  };

  return (
    <motion.div
      variants={containerStagger}
      initial="hidden"
      animate="visible"
      className="space-y-2.5"
    >
      {issues.map((issue) => {
        const isSelected = selectedIssueId === issue.id;
        const publicRef = issue.public_id || issue.public_issue_id || issue.id.slice(0, 8);

        return (
          <motion.div
            key={issue.id}
            variants={itemFadeUp}
            onClick={() => onSelectIssue(issue)}
            whileHover={{ scale: 1.002, x: 2, transition: { duration: 0.15 } }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer backdrop-blur-sm ${
              isSelected
                ? 'bg-[hsl(222,25%,16%)] border-indigo-500 shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-500/40'
                : 'bg-[hsl(222,25%,12%/0.85)] hover:bg-[hsl(222,25%,14%)] border-[hsl(222,20%,18%)] hover:border-[hsl(222,20%,26%)]'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              {/* Left Column: ID, Category & Title */}
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                {/* Photo Thumbnail if available */}
                <div className="w-12 h-12 rounded-xl bg-[hsl(222,20%,16%)] border border-[hsl(222,20%,24%)] overflow-hidden shrink-0 flex items-center justify-center">
                  {issue.signed_image_url ? (
                    <img
                      src={issue.signed_image_url}
                      alt="Civic issue"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={18} className="text-slate-500" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono font-bold text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                      REF #{publicRef}
                    </span>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getSeverityBadge(issue.severity)}`}>
                      {issue.severity || 'medium'}
                    </span>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getStatusBadge(issue.status, issue.is_escalated)}`}>
                      {issue.is_escalated ? 'ESCALATED' : (issue.status || 'reported').replace(/_/g, ' ')}
                    </span>

                    {issue.ai_confidence && (
                      <span className="text-[10px] font-medium text-slate-400 bg-[hsl(222,20%,16%)] px-1.5 py-0.5 rounded border border-[hsl(222,20%,22%)]">
                        AI {Math.round(issue.ai_confidence * 100)}%
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-semibold text-white truncate group-hover:text-indigo-200 transition-colors">
                    {issue.title || (issue.category ? issue.category.replace(/_/g, ' ').toUpperCase() : 'Civic Grievance Report')}
                  </h4>

                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {issue.description || issue.ai_summary || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Right Column: Department, SLA & Action */}
              <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[hsl(222,20%,18%)]">
                <div className="flex items-center gap-2">
                  {getSlaBadge(issue.sla_status, issue.remaining_hours)}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 truncate max-w-[140px]">
                    <Building size={11} className="text-slate-500" />
                    {issue.department_name}
                  </span>
                  <ChevronRight size={14} className="text-slate-500" />
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

