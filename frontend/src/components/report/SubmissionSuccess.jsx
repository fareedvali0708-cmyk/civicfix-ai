import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ArrowRight, LayoutDashboard, FileText, AlertCircle, Cpu } from 'lucide-react';
import { transitions, buttonHoverTap } from '../../lib/motionVariants.js';

/**
 * SubmissionSuccess
 *
 * Success state shown immediately after a civic issue is created in the database
 * and the Intake Agent has been triggered.
 *
 * Props:
 *  - issue: The created issue object (may contain public_issue_id from the Intake Agent)
 *  - intakeDelayed: boolean — true when the issue was saved but the Intake Agent call failed
 */
export default function SubmissionSuccess({ issue, intakeDelayed = false }) {
  // Use the real UUID from the database — never fall back to a placeholder string
  const issueId = issue?.id ?? null;

  // Prefer the human-readable public ID (e.g. CIV-000042) assigned by the Intake Agent
  const publicIssueId = issue?.public_issue_id || issue?.public_id || null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={transitions.easeSmooth}
      className="
        rounded-3xl p-7 sm:p-10 text-center
        border border-emerald-500/25 bg-[hsl(220_20%_12%/0.95)] backdrop-blur-xl
        shadow-2xl shadow-emerald-500/10 space-y-6 max-w-lg mx-auto
      "
    >
      {/* Animated Checkmark Badge */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 20, delay: 0.1 }}
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto flex items-center justify-center bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/20"
      >
        <CheckCircle2 size={36} strokeWidth={2.2} />
      </motion.div>

      {/* Header text */}
      <div className="space-y-2">
        <h2
          className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          Report submitted successfully
        </h2>
        <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
          Your report has entered the CivicFix processing pipeline.
        </p>
      </div>

      {/* Issue Details Box */}
      <div className="p-4 rounded-2xl bg-[hsl(220_20%_15%)] border border-[hsl(220_20%_22%)] space-y-2.5 text-xs text-left">

        {/* Public Reference ID — prominent when available */}
        {publicIssueId && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Reference</span>
            <span className="font-mono font-bold text-blue-200 px-2.5 py-0.5 rounded-lg bg-blue-500/15 border border-blue-500/25 tracking-wider text-sm">
              {publicIssueId}
            </span>
          </div>
        )}

        {/* Internal UUID — always shown, smaller */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Issue ID</span>
          <span className="font-mono text-slate-300 text-[11px] truncate max-w-[200px]">
            {issueId ?? '—'}
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Status</span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Reported
          </span>
        </div>

        {/* Pipeline entry confirmation */}
        {!intakeDelayed && (
          <div className="flex items-start gap-2 pt-1 border-t border-[hsl(220_20%_20%)]">
            <Cpu size={13} className="text-blue-400 mt-0.5 shrink-0" />
            <span className="text-slate-400 leading-relaxed">
              Intake Agent has accepted your report and queued it for the processing pipeline.
            </span>
          </div>
        )}
      </div>

      {/* Intake-delayed soft notice — only when intake call failed */}
      <AnimatePresence>
        {intakeDelayed && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={transitions.easeFast}
            className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-left"
            role="status"
          >
            <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-amber-300">Processing temporarily delayed</p>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                Your report was saved successfully but automatic processing is momentarily delayed. It will be picked up shortly — no action is needed.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {issueId && (
          <motion.div
            variants={buttonHoverTap}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
            className="w-full sm:w-auto"
          >
            <Link
              id="view-submitted-report-btn"
              to={`/issues/${issueId}`}
              className="
                w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl
                text-sm font-semibold text-white
                shadow-lg shadow-blue-500/25
                transition-all duration-150
              "
              style={{
                background: 'linear-gradient(135deg, hsl(220 90% 56%) 0%, hsl(224 85% 46%) 100%)',
              }}
            >
              <FileText size={15} />
              <span>View Report</span>
              <ArrowRight size={14} />
            </Link>
          </motion.div>
        )}

        <motion.div
          variants={buttonHoverTap}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
          className="w-full sm:w-auto"
        >
          <Link
            id="back-to-dashboard-btn"
            to="/dashboard"
            className="
              w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl
              text-sm font-medium text-slate-300 hover:text-white
              bg-[hsl(220_20%_16%)] hover:bg-[hsl(220_20%_20%)]
              border border-[hsl(220_20%_22%)]
              transition-colors duration-150
            "
          >
            <LayoutDashboard size={15} />
            <span>Back to Dashboard</span>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
