import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Plus,
  LayoutDashboard,
  MapPin,
  Calendar,
  Clock,
  Image as ImageIcon,
  AlertTriangle,
  FileSearch,
  CheckCircle2,
  Cpu,
  Tag,
  Gauge,
  Crosshair,
  Navigation,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import DashboardNavbar from '../components/dashboard/DashboardNavbar.jsx';
import IssueStatusBadge from '../components/dashboard/IssueStatusBadge.jsx';
import { fetchIssueById, fetchIssueUpdates, getSignedImageUrl } from '../services/issueDetailsService.js';
import { getPriorityConfig } from '../lib/statusConfig.js';
import {
  pageVariants,
  sectionVariants,
  containerStagger,
  itemFadeUp,
  transitions,
} from '../lib/motionVariants.js';

/* ─── Utility helpers ────────────────────────────────────────── */

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function formatCoord(val, decimals = 6) {
  if (val === null || val === undefined || isNaN(Number(val))) return null;
  return Number(val).toFixed(decimals);
}

/* ─── Sub-components ─────────────────────────────────────────── */

/**
 * A single detail row inside the issue info card.
 */
function DetailRow({ icon: Icon, label, value, pending = false, mono = false }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[hsl(220_20%_18%)] last:border-0">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-[hsl(220_20%_18%)]">
        <Icon size={14} className="text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">{label}</p>
        {pending ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 italic">
            <Clock size={11} className="text-slate-600" />
            Pending
          </span>
        ) : value ? (
          <p className={`text-sm text-slate-200 break-words ${mono ? 'font-mono text-xs' : ''}`}>
            {value}
          </p>
        ) : (
          <span className="text-xs text-slate-600 italic">—</span>
        )}
      </div>
    </div>
  );
}

/**
 * Skeleton pulse for the loading state.
 */
function SkeletonPulse({ className = '' }) {
  return (
    <div
      className={`rounded-xl animate-pulse ${className}`}
      style={{ backgroundColor: 'hsl(220 20% 18%)' }}
    />
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonPulse className="h-8 w-48" />
      <SkeletonPulse className="h-72 w-full rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-3 p-5 rounded-2xl" style={{ backgroundColor: 'hsl(220 20% 14%)', border: '1px solid hsl(220 20% 20%)' }}>
          {[...Array(5)].map((_, i) => <SkeletonPulse key={i} className="h-5 w-full" />)}
        </div>
        <div className="space-y-3 p-5 rounded-2xl" style={{ backgroundColor: 'hsl(220 20% 14%)', border: '1px solid hsl(220 20% 20%)' }}>
          {[...Array(4)].map((_, i) => <SkeletonPulse key={i} className="h-5 w-full" />)}
        </div>
      </div>
    </div>
  );
}

/**
 * Full-page error state (not found / forbidden / network error).
 */
function ErrorState({ title, message, icon: Icon = AlertTriangle }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={transitions.easeSmooth}
      className="
        rounded-3xl p-10 text-center max-w-md mx-auto
        border border-[hsl(220_20%_20%)] bg-[hsl(220_20%_13%/0.8)]
        backdrop-blur-md shadow-xl space-y-5
      "
    >
      <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-rose-500/10 border border-rose-500/20 text-rose-400">
        <Icon size={28} strokeWidth={1.8} />
      </div>
      <div className="space-y-2">
        <h2
          className="text-xl font-bold text-white"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          {title}
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
      </div>
      <Link
        to="/dashboard"
        className="
          inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
          text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400
        "
        style={{
          background: 'linear-gradient(135deg, hsl(220 90% 56%) 0%, hsl(224 85% 46%) 100%)',
        }}
      >
        <LayoutDashboard size={15} />
        Back to Dashboard
      </Link>
    </motion.div>
  );
}

function getAgentStyle(agentName) {
  const name = String(agentName || '').toLowerCase();
  if (name.includes('intake')) {
    return { color: 'hsl(213 94% 68%)', bg: 'hsl(213 94% 68% / 0.15)', border: 'hsl(213 94% 68% / 0.3)' };
  }
  if (name.includes('analysis')) {
    return { color: 'hsl(262 80% 70%)', bg: 'hsl(262 80% 70% / 0.15)', border: 'hsl(262 80% 70% / 0.3)' };
  }
  if (name.includes('assignment')) {
    return { color: 'hsl(199 89% 60%)', bg: 'hsl(199 89% 60% / 0.15)', border: 'hsl(199 89% 60% / 0.3)' };
  }
  if (name.includes('monitoring')) {
    return { color: 'hsl(38 92% 60%)', bg: 'hsl(38 92% 60% / 0.15)', border: 'hsl(38 92% 60% / 0.3)' };
  }
  if (name.includes('escalation')) {
    return { color: 'hsl(0 85% 65%)', bg: 'hsl(0 85% 65% / 0.15)', border: 'hsl(0 85% 65% / 0.3)' };
  }
  if (name.includes('closure')) {
    return { color: 'hsl(158 64% 52%)', bg: 'hsl(158 64% 52% / 0.15)', border: 'hsl(158 64% 52% / 0.3)' };
  }
  return { color: 'hsl(220 90% 60%)', bg: 'hsl(220 90% 60% / 0.15)', border: 'hsl(220 90% 60% / 0.3)' };
}

/**
 * A single timeline event row.
 */
function TimelineEvent({ update, index, totalEvents }) {
  const agentName = update.agent_name || update.author || 'System';
  const message = update.message || update.update_text || '';
  const agentStyle = getAgentStyle(agentName);
  const isLatest = index === (totalEvents - 1);
  const isPrevious = !isLatest && totalEvents > 1;

  return (
    <motion.div
      variants={itemFadeUp}
      className="relative flex gap-4 group"
    >
      {/* Vertical connector line */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
            isLatest
              ? 'ring-2 ring-blue-400/50 ring-offset-2 ring-offset-[hsl(220_20%_10%)] shadow-lg shadow-blue-500/20'
              : ''
          }`}
          style={{
            background: agentStyle.bg,
            border: `1px solid ${agentStyle.border}`,
            color: agentStyle.color,
          }}
        >
          {isLatest ? (
            <Cpu size={13} className="animate-pulse" />
          ) : isPrevious ? (
            <CheckCircle2 size={14} className="text-emerald-400" />
          ) : (
            <Cpu size={13} />
          )}
        </div>
        {/* Connector line below icon */}
        {index < totalEvents - 1 && (
          <div
            className="w-px flex-1 mt-1 min-h-[22px]"
            style={{
              background: 'linear-gradient(to bottom, hsl(220 20% 24%), hsl(220 20% 18%))',
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-5 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-md"
            style={{
              color: agentStyle.color,
              backgroundColor: agentStyle.bg,
              border: `1px solid ${agentStyle.border}`,
            }}
          >
            {agentName}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {formatDateTime(update.created_at)}
          </span>
          {isLatest && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
              <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
              Latest Action
            </span>
          )}
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */

/**
 * IssueDetailPage
 *
 * Route: /issues/:id (protected)
 *
 * Shows the citizen their own issue with:
 * - full issue details
 * - real photo
 * - agent-determined fields (with "Pending Analysis" where not yet set)
 * - live timeline from public.issue_updates
 */
export default function IssueDetailPage() {
  const { id: issueId } = useParams();
  const { user } = useAuth();

  const [issue, setIssue] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signedImageUrl, setSignedImageUrl] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Error variants
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (!user?.id || !issueId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);

      // Fetch issue and timeline in parallel
      const [issueResult, updatesResult] = await Promise.all([
        fetchIssueById(issueId, user.id),
        fetchIssueUpdates(issueId),
      ]);

      if (cancelled) return;

      if (issueResult.notFound) {
        setNotFound(true);
      } else if (issueResult.forbidden) {
        setForbidden(true);
      } else if (issueResult.error) {
        setFetchError(issueResult.error);
      } else {
        setIssue(issueResult.data);
        setUpdates(updatesResult.data);

        // Resolve a signed URL for the private storage bucket.
        // Ownership is already verified by fetchIssueById above.
        if (issueResult.data?.image_url) {
          const signed = await getSignedImageUrl(issueResult.data.image_url);
          if (!cancelled) setSignedImageUrl(signed);
        }
      }

      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [issueId, user?.id]);

  /* Derived display values */
  const publicId = issue?.public_issue_id || issue?.public_id || null;
  const displayRef = publicId || (issue?.id ? `#${issue.id.slice(0, 8).toUpperCase()}` : '—');
  const priorityVal = issue?.priority_level || issue?.priority || issue?.severity;
  const priority = priorityVal ? getPriorityConfig(String(priorityVal).toLowerCase()) : null;
  const lat = formatCoord(issue?.latitude);
  const lng = formatCoord(issue?.longitude);
  const accuracy = issue?.location_accuracy ? `±${Math.round(issue.location_accuracy)} m` : null;

  /* ─── Render ─── */
  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ backgroundColor: 'hsl(220 20% 10%)' }}
    >
      {/* Ambient background glow */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div
          className="absolute -top-40 left-1/3 w-[550px] h-[550px] rounded-full blur-[140px] opacity-[0.07]"
          style={{
            background: 'radial-gradient(circle, hsl(220 90% 56%) 0%, hsl(260 80% 50%) 60%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.04]"
          style={{
            background: 'radial-gradient(circle, hsl(158 64% 52%) 0%, transparent 70%)',
          }}
        />
      </div>

      <DashboardNavbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <AnimatePresence mode="wait">

          {/* ── Loading ── */}
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <PageSkeleton />
            </motion.div>
          )}

          {/* ── Not found ── */}
          {!loading && notFound && (
            <motion.div key="not-found" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ErrorState
                icon={FileSearch}
                title="Report Not Found"
                message="This issue report doesn't exist or may have been removed. Check that the link is correct."
              />
            </motion.div>
          )}

          {/* ── Forbidden ── */}
          {!loading && forbidden && (
            <motion.div key="forbidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ErrorState
                title="Access Denied"
                message="You don't have permission to view this report. Only the citizen who filed it can access it."
              />
            </motion.div>
          )}

          {/* ── Network / DB error ── */}
          {!loading && fetchError && (
            <motion.div key="fetch-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ErrorState
                title="Failed to Load Report"
                message={fetchError}
              />
            </motion.div>
          )}

          {/* ── Main issue view ── */}
          {!loading && issue && (
            <motion.div
              key="issue"
              variants={pageVariants}
              initial="hidden"
              animate="visible"
              className="space-y-7"
            >
              {/* ── Page header ── */}
              <motion.div variants={sectionVariants} className="space-y-3">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors duration-150"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Dashboard</span>
                </Link>

                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
                      Your CivicFix Report
                    </p>
                    <h1
                      className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
                      style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                    >
                      {publicId ? (
                        <>
                          <span className="text-blue-400">{publicId}</span>
                        </>
                      ) : (
                        displayRef
                      )}
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                      Submitted {formatDate(issue.created_at)}
                    </p>
                  </div>

                  <IssueStatusBadge status={issue.status} className="text-sm px-3.5 py-1.5" />
                </div>
              </motion.div>

              {/* ── Photo ── */}
              {signedImageUrl && (
                <motion.div
                  variants={sectionVariants}
                  className="relative rounded-2xl overflow-hidden border border-[hsl(220_20%_20%)] bg-[hsl(220_20%_14%)]"
                  style={{ minHeight: 240 }}
                >
                  {/* Blur placeholder while loading */}
                  {!imgLoaded && !imgError && (
                    <div
                      className="absolute inset-0 animate-pulse"
                      style={{ backgroundColor: 'hsl(220 20% 18%)' }}
                    />
                  )}

                  {!imgError ? (
                    <motion.img
                      src={signedImageUrl}
                      alt="Issue photo submitted by citizen"
                      className="w-full object-cover max-h-[420px]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: imgLoaded ? 1 : 0 }}
                      transition={{ duration: 0.4 }}
                      onLoad={() => setImgLoaded(true)}
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-500">
                      <ImageIcon size={28} strokeWidth={1.5} />
                      <p className="text-xs">Photo unavailable</p>
                    </div>
                  )}

                  {/* Gradient overlay at bottom */}
                  {imgLoaded && (
                    <div className="absolute bottom-0 inset-x-0 h-16 pointer-events-none"
                      style={{ background: 'linear-gradient(to top, hsl(220 20% 14%) 0%, transparent 100%)' }}
                    />
                  )}
                </motion.div>
              )}

              {/* ── AI Analysis Highlight (if available) ── */}
              {issue.ai_summary && (
                <motion.div
                  variants={sectionVariants}
                  className="p-5 rounded-2xl bg-blue-950/20 border border-blue-500/30 backdrop-blur-md space-y-2 shadow-lg shadow-blue-950/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
                      <Cpu size={15} className="text-blue-400" />
                      <span>Autonomous AI Vision Analysis</span>
                    </div>
                    {issue.ai_confidence && (
                      <span className="text-[11px] font-bold text-blue-300 bg-blue-500/15 px-2 py-0.5 rounded-full border border-blue-500/25">
                        {Math.round(issue.ai_confidence * 100)}% Confidence
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {issue.ai_summary}
                  </p>
                </motion.div>
              )}

              {/* ── Details grid ── */}
              <motion.div
                variants={containerStagger}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                {/* Issue Details card */}
                <motion.div
                  variants={itemFadeUp}
                  className="rounded-2xl border border-[hsl(220_20%_18%)] bg-[hsl(220_20%_13%/0.8)] backdrop-blur-md overflow-hidden"
                >
                  <div className="px-5 py-3.5 border-b border-[hsl(220_20%_18%)]">
                    <h2
                      className="text-sm font-semibold text-white"
                      style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                    >
                      Issue Details
                    </h2>
                  </div>
                  <div className="px-5 py-1">
                    <DetailRow
                      icon={Tag}
                      label="Category"
                      value={issue.category ? <span className="capitalize">{issue.category.replace(/_/g, ' ')}</span> : null}
                      pending={!issue.category}
                    />
                    <DetailRow
                      icon={Gauge}
                      label="Severity"
                      value={issue.severity ? <span className="uppercase font-semibold text-xs tracking-wider">{issue.severity}</span> : null}
                      pending={!issue.severity}
                    />
                    <DetailRow
                      icon={Gauge}
                      label="Priority Level"
                      value={
                        priority
                          ? <span style={{ color: priority.color }} className="font-semibold">{priority.label}</span>
                          : null
                      }
                      pending={!priorityVal}
                    />
                    <DetailRow
                      icon={CheckCircle2}
                      label="Citizen Description"
                      value={issue.description}
                    />
                    <DetailRow
                      icon={Calendar}
                      label="Reported"
                      value={formatDateTime(issue.created_at)}
                    />
                  </div>
                </motion.div>

                {/* Location Details card */}
                <motion.div
                  variants={itemFadeUp}
                  className="rounded-2xl border border-[hsl(220_20%_18%)] bg-[hsl(220_20%_13%/0.8)] backdrop-blur-md overflow-hidden"
                >
                  <div className="px-5 py-3.5 border-b border-[hsl(220_20%_18%)]">
                    <h2
                      className="text-sm font-semibold text-white"
                      style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                    >
                      Location
                    </h2>
                  </div>
                  <div className="px-5 py-1">
                    <DetailRow
                      icon={MapPin}
                      label="Address"
                      value={issue.address}
                      pending={!issue.address}
                    />
                    <DetailRow
                      icon={Navigation}
                      label="Latitude"
                      value={lat}
                      mono
                    />
                    <DetailRow
                      icon={Navigation}
                      label="Longitude"
                      value={lng}
                      mono
                    />
                    <DetailRow
                      icon={Crosshair}
                      label="GPS Accuracy"
                      value={accuracy}
                    />
                  </div>
                </motion.div>
              </motion.div>

              {/* ── Processing Timeline ── */}
              <motion.div variants={sectionVariants}>
                <div className="rounded-2xl border border-[hsl(220_20%_18%)] bg-[hsl(220_20%_13%/0.8)] backdrop-blur-md overflow-hidden">
                  <div className="px-5 py-4 border-b border-[hsl(220_20%_18%)] flex items-center gap-2">
                    <Cpu size={16} className="text-blue-400" />
                    <h2
                      className="text-sm font-semibold text-white"
                      style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                    >
                      Processing Timeline
                    </h2>
                    {updates.length > 0 && (
                      <span className="ml-auto text-xs font-mono text-slate-500">
                        {updates.length} event{updates.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="px-5 py-5">
                    {updates.length === 0 ? (
                      <div className="flex flex-col items-center gap-3 py-6 text-center">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[hsl(220_20%_18%)] text-slate-500">
                          <Clock size={18} strokeWidth={1.6} />
                        </div>
                        <div>
                          <p className="text-sm text-slate-300 font-medium">Awaiting Processing</p>
                          <p className="text-xs text-slate-500 mt-0.5 max-w-xs leading-relaxed">
                            Your report has been submitted and is waiting for processing.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <motion.div
                        variants={containerStagger}
                        initial="hidden"
                        animate="visible"
                        className="space-y-0"
                      >
                        {updates.map((update, i) => (
                          <TimelineEvent key={update.id || i} update={update} index={i} totalEvents={updates.length} />
                        ))}
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* ── Action buttons ── */}
              <motion.div
                variants={sectionVariants}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
              >
                <Link
                  id="back-to-dashboard-detail-btn"
                  to="/dashboard"
                  className="
                    w-full sm:w-auto inline-flex items-center justify-center gap-2
                    px-5 py-2.5 rounded-xl text-sm font-semibold text-white
                    transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400
                  "
                  style={{
                    background: 'linear-gradient(135deg, hsl(220 90% 56%) 0%, hsl(224 85% 46%) 100%)',
                  }}
                >
                  <LayoutDashboard size={15} />
                  Back to Dashboard
                </Link>

                <Link
                  id="report-another-issue-btn"
                  to="/report"
                  className="
                    w-full sm:w-auto inline-flex items-center justify-center gap-2
                    px-5 py-2.5 rounded-xl text-sm font-medium
                    text-slate-300 hover:text-white
                    bg-[hsl(220_20%_16%)] hover:bg-[hsl(220_20%_20%)]
                    border border-[hsl(220_20%_22%)]
                    transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400
                  "
                >
                  <Plus size={15} />
                  Report Another Issue
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
