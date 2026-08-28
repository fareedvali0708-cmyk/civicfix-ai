import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ClipboardList, ArrowRight } from 'lucide-react';
import { transitions, buttonHoverTap } from '../../lib/motionVariants.js';

/**
 * EmptyIssuesState
 *
 * Shown when the authenticated user has zero issues in the database.
 * Uses subtle entrance animation and button micro-interactions.
 */
export default function EmptyIssuesState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={transitions.easeSmooth}
      className="
        flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl
        border border-dashed border-[hsl(220_20%_24%)]
        bg-[hsl(220_20%_12%/0.7)] backdrop-blur-sm
      "
    >
      {/* Centered Beacon Icon with soft entrance */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.35, ease: 'easeOut' }}
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-blue-500/10 border border-blue-500/20 text-blue-400"
      >
        <ClipboardList size={26} strokeWidth={1.8} />
      </motion.div>

      <h3
        className="text-lg font-bold text-white mb-2"
        style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
      >
        You haven&apos;t reported any civic issues yet
      </h3>

      <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
        Spot a problem in your area? Report it and CivicFix will help route it to the right team.
      </p>

      <motion.div
        variants={buttonHoverTap}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
      >
        <Link
          id="empty-report-btn"
          to="/report"
          className="
            inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
            text-sm font-semibold text-white
            shadow-md shadow-blue-500/20
            transition-all duration-150
          "
          style={{
            background: 'linear-gradient(135deg, hsl(220 90% 56%) 0%, hsl(224 85% 46%) 100%)',
          }}
        >
          <span>Report an Issue</span>
          <ArrowRight size={15} />
        </Link>
      </motion.div>
    </motion.div>
  );
}
