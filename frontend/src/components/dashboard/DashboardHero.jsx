import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, FileText, Sparkles, Plus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { transitions, buttonHoverTap } from '../../lib/motionVariants.js';

export default function DashboardHero() {
  const { user } = useAuth();

  const firstName =
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.user_metadata?.name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'there';

  return (
    <section className="relative overflow-hidden pt-6 pb-4 sm:pt-10 sm:pb-6">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.easeSmooth}
          className="max-w-3xl"
        >
          {/* Welcome status pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5 border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl shadow-lg shadow-black/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-slate-300">
              Welcome back, <span className="text-white font-semibold">{firstName}</span>
            </span>
          </div>

          {/* Headline with luxury typography */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-4">
            Turn everyday problems{' '}
            <span className="text-gradient-stitch">
              into action.
            </span>
          </h1>

          {/* Sub-copy */}
          <p className="text-sm sm:text-base text-slate-400 mb-8 max-w-xl leading-relaxed font-normal">
            Report civic issues with instant GPS imagery. Autonomous AI agents verify, prioritize, and route to local municipal teams in real time.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3.5">
            <motion.div
              variants={buttonHoverTap}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
            >
              <Link
                id="report-issue-btn"
                to="/report"
                className="
                  group relative inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl
                  text-sm font-semibold text-white
                  bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500
                  hover:from-blue-500 hover:to-indigo-500
                  shadow-xl shadow-blue-600/30 border border-blue-400/30
                  transition-all duration-200
                "
              >
                <Plus size={16} className="text-blue-200" />
                <span>Report an Issue</span>
                <ArrowRight
                  size={15}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>
            </motion.div>

            <motion.a
              id="view-reports-link"
              href="#recent-reports"
              variants={buttonHoverTap}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              className="
                inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium
                text-slate-300 hover:text-white
                bg-white/[0.04] hover:bg-white/[0.08]
                border border-white/[0.08] hover:border-white/[0.18]
                backdrop-blur-md transition-all duration-150
              "
            >
              <FileText size={15} className="text-slate-400" />
              <span>View My Reports</span>
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
