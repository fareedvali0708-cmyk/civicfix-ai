import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { fetchUserIssues, fetchUserIssueCounts } from '../../services/issuesService.js';
import DashboardNavbar from './DashboardNavbar.jsx';
import DashboardHero from './DashboardHero.jsx';
import StatsCard from './StatsCard.jsx';
import RecentIssues from './RecentIssues.jsx';
import LoadingSkeleton from './LoadingSkeleton.jsx';
import { pageVariants, sectionVariants } from '../../lib/motionVariants.js';

const FETCH_LIMIT = 5;

/**
 * CitizenDashboard
 *
 * Orchestrates dashboard data fetching and motion hierarchy.
 * Subtle ambient background element included.
 */
export default function CitizenDashboard() {
  const { user } = useAuth();

  const [issues, setIssues] = useState([]);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    async function loadDashboardData() {
      setLoading(true);
      setError(null);

      const [issuesResult, countsResult] = await Promise.all([
        fetchUserIssues(user.id, FETCH_LIMIT),
        fetchUserIssueCounts(user.id),
      ]);

      if (cancelled) return;

      if (issuesResult.error) {
        console.error('[CitizenDashboard] Failed to load issues:', issuesResult.error.message);
        setError('Failed to load your reports. Please refresh the page.');
      } else {
        setIssues(issuesResult.data);
      }

      if (countsResult.error) {
        console.error('[CitizenDashboard] Failed to load counts:', countsResult.error.message);
      } else {
        setCounts(countsResult.counts);
      }

      setLoading(false);
    }

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const statsCards = [
    {
      icon: ClipboardList,
      label: 'Total Reports',
      value: counts?.total,
      accent: 'hsl(213 94% 68%)',
    },
    {
      icon: Clock,
      label: 'In Progress',
      value: counts?.inProgress,
      accent: 'hsl(38 92% 60%)',
    },
    {
      icon: CheckCircle2,
      label: 'Resolved',
      value: counts?.resolved,
      accent: 'hsl(158 64% 52%)',
    },
    {
      icon: AlertTriangle,
      label: 'Needs Attention',
      value: counts?.needsAttention,
      accent: 'hsl(0 85% 65%)',
    },
  ];

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ backgroundColor: 'hsl(220 20% 10%)' }}
    >
      {/* ── Very subtle ambient background glow ────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden -z-10"
      >
        <motion.div
          animate={{
            x: [0, 20, -15, 0],
            y: [0, -20, 15, 0],
            opacity: [0.08, 0.12, 0.08],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
          }}
          className="absolute -top-48 right-1/4 w-[600px] h-[600px] rounded-full blur-[140px]"
          style={{
            background: 'radial-gradient(circle, hsl(220 90% 56%) 0%, hsl(260 80% 50% / 0.4) 50%, transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px)',
          }}
        />
      </div>

      {/* Top Navbar */}
      <DashboardNavbar />

      {/* Hero */}
      <DashboardHero />

      {/* Main Content Area */}
      <motion.main
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-10"
      >
        {/* Error banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
            style={{
              backgroundColor: 'hsl(0 70% 55% / 0.1)',
              border: '1px solid hsl(0 70% 55% / 0.25)',
              color: 'hsl(0 80% 70%)',
            }}
            role="alert"
          >
            <AlertTriangle size={15} className="shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Summary statistics */}
            <motion.section
              variants={sectionVariants}
              aria-label="Summary statistics"
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {statsCards.map((card, i) => (
                  <StatsCard
                    key={card.label}
                    icon={card.icon}
                    label={card.label}
                    value={card.value}
                    accent={card.accent}
                    delay={i * 0.05}
                  />
                ))}
              </div>
            </motion.section>

            {/* Recent reports */}
            <RecentIssues
              issues={issues}
              totalCount={counts?.total ?? 0}
              limit={FETCH_LIMIT}
            />
          </>
        )}
      </motion.main>
    </div>
  );
}
