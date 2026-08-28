import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, FileText, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { transitions, buttonHoverTap } from '../../lib/motionVariants.js';

/**
 * DashboardHero
 *
 * Hero section with greeting, tagline, and primary CTA.
 * Uses motion tokens and refined SaaS typography.
 */
export default function DashboardHero() {
  const { user } = useAuth();

  const firstName =
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.user_metadata?.name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'there';

  return (
    <section className="relative overflow-hidden pt-8 pb-6 sm:pt-12 sm:pb-8">
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 65% 55% at 50% -10%, hsl(220 90% 56% / 0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.easeSmooth}
          className="max-w-2xl"
        >
          {/* Welcome status pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 border border-[hsl(220_20%_22%)] bg-[hsl(220_20%_14%/0.7)] backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-slate-300">
              Welcome back, <span className="text-white font-semibold">{firstName}</span>
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-white tracking-tight leading-[1.15] mb-4"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            Turn everyday problems
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              into action.
            </span>
          </h1>

          {/* Sub-copy */}
          <p className="text-sm sm:text-base text-slate-400 mb-8 max-w-lg leading-relaxed">
            Report civic issues, track real-time resolution progress, and keep your community safe and functional.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3">
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
                  group relative inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl
                  text-sm font-semibold text-white
                  shadow-lg shadow-blue-500/20
                  transition-all duration-200
                "
                style={{
                  background: 'linear-gradient(135deg, hsl(220 90% 56%) 0%, hsl(224 85% 46%) 100%)',
                }}
              >
                <span>Report an Issue</span>
                <ArrowRight
                  size={15}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
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
                inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                text-slate-300 hover:text-white
                bg-[hsl(220_20%_14%/0.7)] hover:bg-[hsl(220_20%_18%)]
                border border-[hsl(220_20%_20%)] hover:border-[hsl(220_20%_26%)]
                transition-colors duration-150
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
