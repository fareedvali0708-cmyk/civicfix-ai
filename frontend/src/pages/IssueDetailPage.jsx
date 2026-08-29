import { useState, useEffect, useRef, useCallback } from 'react';
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
  Building2,
  UserCheck,
  RefreshCw,
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

// Fallback message extractors in case metadata is formatted inside timeline text
function extractCategoryFromMessage(msg) {
  if (!msg || typeof msg !== 'string') return null;
  const match = msg.match(/classified this report as ([a-zA-Z0-9_\s]+?)\s+with/i);
  return match ? match[1].trim().replace(/\s+/g, '_') : null;
}

function extractSeverityFromMessage(msg) {
  if (!msg || typeof msg !== 'string') return null;
  const match = msg.match(/with\s+(low|medium|high|critical)\s+severity/i);
  return match ? match[1].toLowerCase() : null;
}

function extractDepartmentFromMessage(msg) {
  if (!msg || typeof msg !== 'string') return null;
  const match = msg.match(/routed this issue to ([\w\s&]+?)(?:\s+and assigned|\s+for departmental|\.|$)/i);
  return match ? match[1].trim() : null;
}

function extractOfficerFromMessage(msg) {
  if (!msg || typeof msg !== 'string') return null;
  const match = msg.match(/assigned Officer ([\w\s.\-]+?)(?:\.|\s+Status|$)/i);
  return match ? match[1].trim() : null;
}

/* ─── Sub-components ─────────────────────────────────────────── */

/**
 * A single detail row inside the issue info card.
 */
function DetailRow({ icon: Icon, label, value, pending = false, mono = false, analyzing = false }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[hsl(220_20%_18%)] last:border-0">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-[hsl(220_20%_18%)]">
        <Icon size={14} className="text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">{label}</p>
        {analyzing ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-ping opacity-75" />
            Analyzing…
          </span>
        ) : pending ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 italic">
            <Clock size={11} className="text-slate-600" />
            Pending
          </span>
        ) : value ? (
          <div className={`text-sm text-slate-200 break-words ${mono ? 'font-mono text-xs' : ''}`}>
            {value}
          </div>
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
function ErrorState({ title, message, icon: Icon = AlertTriangle, onRetry = null }) {
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
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="
              inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
              text-white transition-colors duration-150 bg-[hsl(220_20%_18%)] hover:bg-[hsl(220_20%_24%)]
            "
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        )}
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
      </div>
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
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/25">
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

/**
 * Check if the issue analysis has finished based on real database state.
 */
function checkAnalysisCompleted(issueData, updatesData = []) {
  if (!issueData) return false;

  // 1. Direct fields stored in public.issues
  if (issueData.category || issueData.severity || issueData.ai_summary || issueData.priority_level) {
    return true;
  }

  // 2. Status advanced beyond initial intake
  if (issueData.status && issueData.status !== 'reported') {
    return true;
  }

  // 3. Real timeline events from Analysis Agent or downstream agents
  if (Array.isArray(updatesData) && updatesData.length > 0) {
    const hasDownstreamEvent = updatesData.some((u) => {
      const name = String(u.agent_name || u.author || '').toLowerCase();
      return (
        name.includes('analysis') ||
        name.includes('assignment') ||
        name.includes('monitoring') ||
        name.includes('escalation') ||
        name.includes('closure')
      );
    });
    if (hasDownstreamEvent) return true;
  }

  return false;
}

/* ─── Main Page ──────────────────────────────────────────────── */

/**
 * IssueDetailPage
 *
 * Route: /issues/:id (protected)
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

  // Polling state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pollTimeout, setPollTimeout] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pollTimerRef = useRef(null);
  const pollCountRef = useRef(0);
  const MAX_POLL_ATTEMPTS = 10; // 10 × 2.5s = 25 seconds

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    pollCountRef.current = 0;
    setIsAnalyzing(false);
  }, []);

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (!user?.id || !issueId) return;

    if (isManualRefresh) setRefreshing(true);

    try {
      const [issueResult, updatesResult] = await Promise.all([
        fetchIssueById(issueId, user.id),
        fetchIssueUpdates(issueId),
      ]);

      if (issueResult.notFound) {
        setNotFound(true);
        stopPolling();
      } else if (issueResult.forbidden) {
        setForbidden(true);
        stopPolling();
      } else if (issueResult.error) {
        setFetchError(issueResult.error);
        stopPolling();
      } else {
        const fetchedIssue = issueResult.data;
        const fetchedUpdates = updatesResult.data || [];

        setIssue(fetchedIssue);
        setUpdates(fetchedUpdates);

        if (fetchedIssue?.image_url && !signedImageUrl) {
          getSignedImageUrl(fetchedIssue.image_url).then((signed) => {
            if (signed) setSignedImageUrl(signed);
          });
        }

        const isComplete = checkAnalysisCompleted(fetchedIssue, fetchedUpdates);
        if (isComplete) {
          stopPolling();
          setPollTimeout(false);
        } else if (!isManualRefresh && pollCountRef.current === 0) {
          setIsAnalyzing(true);
          setPollTimeout(false);
        }
      }
    } catch (err) {
      console.error('[IssueDetailPage] loadData error:', err);
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  }, [issueId, user?.id, signedImageUrl, stopPolling]);

  // Initial load
  useEffect(() => {
    loadData();
    return () => stopPolling();
  }, [loadData, stopPolling]);

  // Polling effect: refetch every 2.5s while processing
  useEffect(() => {
    if (!isAnalyzing || !user?.id || !issueId) return;

    pollTimerRef.current = setInterval(async () => {
      pollCountRef.current += 1;

      try {
        const [issueResult, updatesResult] = await Promise.all([
          fetchIssueById(issueId, user.id),
          fetchIssueUpdates(issueId),
        ]);

        if (issueResult.data) {
          const freshIssue = issueResult.data;
          const freshUpdates = updatesResult.data || [];

          setIssue(freshIssue);
          setUpdates(freshUpdates);

          const isComplete = checkAnalysisCompleted(freshIssue, freshUpdates);
          if (isComplete) {
            stopPolling();
            setPollTimeout(false);
            return;
          }
        }

        if (pollCountRef.current >= MAX_POLL_ATTEMPTS) {
          stopPolling();
          setPollTimeout(true);
        }
      } catch (err) {
        console.warn('[IssueDetailPage] Polling interval error:', err);
      }
    }, 2500);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [isAnalyzing, issueId, user?.id, stopPolling]);

  /* ── Derived display values ── */
  const publicId = issue?.public_issue_id || issue?.public_id || null;
  const displayRef = publicId || (issue?.id ? `#${issue.id.slice(0, 8).toUpperCase()}` : '—');

  // Timeline-aware agent extractions
  const analysisUpdate = updates.find(
    (u) => u.agent_name && u.agent_name.toLowerCase().includes('analysis')
  );
  const assignmentUpdate = updates.find(
    (u) => u.agent_name && u.agent_name.toLowerCase().includes('assignment')
  );

  const hasAnalysisCompleted = checkAnalysisCompleted(issue, updates);

  const categoryVal =
    issue?.category ||
    analysisUpdate?.metadata?.category ||
    extractCategoryFromMessage(analysisUpdate?.message) ||
    null;

  const severityVal =
    issue?.severity ||
    analysisUpdate?.metadata?.severity ||
    extractSeverityFromMessage(analysisUpdate?.message) ||
    null;

  const priorityVal =
    issue?.priority_level ||
    issue?.priority ||
    analysisUpdate?.metadata?.priority_level ||
    severityVal ||
    null;

  const priority = priorityVal ? getPriorityConfig(String(priorityVal).toLowerCase()) : null;

  const aiSummaryVal =
    issue?.ai_summary ||
    analysisUpdate?.metadata?.concise_reasoning ||
    null;

  const aiConfidenceVal =
    issue?.ai_confidence !== undefined && issue?.ai_confidence !== null
      ? issue.ai_confidence
      : (analysisUpdate?.metadata?.confidence ?? null);

  const departmentNameVal =
    assignmentUpdate?.metadata?.department_name ||
    issue?.department_name ||
    (issue?.departments && issue.departments.name) ||
    analysisUpdate?.metadata?.recommended_department ||
    extractDepartmentFromMessage(assignmentUpdate?.message) ||
    null;

  const officerNameVal =
    assignmentUpdate?.metadata?.officer_name ||
    issue?.officer_name ||
    (issue?.officers && issue.officers.officer_name) ||
    extractOfficerFromMessage(assignmentUpdate?.message) ||
    null;

  const lat = formatCoord(issue?.latitude);
  const lng = formatCoord(issue?.longitude);
  const accuracy = issue?.location_accuracy ? `±${Math.round(issue.location_accuracy)} m` : null;

  /* ── Render ── */
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
                onRetry={() => loadData(true)}
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
                        <span className="text-blue-400">{publicId}</span>
                      ) : (
                        displayRef
                      )}
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                      Submitted {formatDate(issue.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => loadData(true)}
                      title="Refresh issue status"
                      className="p-2 rounded-xl text-slate-400 hover:text-white bg-[hsl(220_20%_15%)] hover:bg-[hsl(220_20%_20%)] border border-[hsl(220_20%_22%)] transition-colors"
                    >
                      <RefreshCw size={14} className={refreshing ? 'animate-spin text-blue-400' : ''} />
                    </button>
                    <IssueStatusBadge status={issue.status} className="text-sm px-3.5 py-1.5" />
                  </div>
                </div>
              </motion.div>

              {/* ── Photo ── */}
              {signedImageUrl && (
                <motion.div
                  variants={sectionVariants}
                  className="relative rounded-2xl overflow-hidden border border-[hsl(220_20%_20%)] bg-[hsl(220_20%_14%)]"
                  style={{ minHeight: 240 }}
                >
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

                  {imgLoaded && (
                    <div className="absolute bottom-0 inset-x-0 h-16 pointer-events-none"
                      style={{ background: 'linear-gradient(to top, hsl(220 20% 14%) 0%, transparent 100%)' }}
                    />
                  )}
                </motion.div>
              )}

              {/* ── Active AI Pipeline Running Banner ── */}
              {isAnalyzing && !hasAnalysisCompleted && (
                <motion.div
                  variants={sectionVariants}
                  className="flex items-center gap-3 p-4 rounded-2xl border border-blue-500/25 bg-blue-950/20 backdrop-blur-md"
                >
                  <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-blue-500/15 border border-blue-500/25">
                    <Cpu size={14} className="text-blue-400 animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-300">AI Pipeline Running</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Gemini Vision is classifying your report. Category, severity, and department will appear automatically.
                    </p>
                  </div>
                  <div className="shrink-0 flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-blue-400"
                        style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── Polling Timeout Warning with Manual Retry ── */}
              {pollTimeout && !hasAnalysisCompleted && (
                <motion.div
                  variants={sectionVariants}
                  className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 backdrop-blur-md"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-amber-500/15 border border-amber-500/25 text-amber-400">
                      <Clock size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-amber-300">Analysis In Progress</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Analysis is taking longer than expected. Refresh to check the latest status.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadData(true)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition-colors"
                  >
                    <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                  </button>
                </motion.div>
              )}

              {/* ── Completed AI Analysis Card ── */}
              {hasAnalysisCompleted && (aiSummaryVal || categoryVal) && (
                <motion.div
                  variants={sectionVariants}
                  className="p-5 rounded-2xl bg-blue-950/20 border border-blue-500/30 backdrop-blur-md space-y-2 shadow-lg shadow-blue-950/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
                      <Cpu size={15} className="text-blue-400" />
                      <span>Autonomous AI Vision Analysis</span>
                    </div>
                    {aiConfidenceVal !== null && aiConfidenceVal !== undefined && (
                      <span className="text-[11px] font-bold text-blue-300 bg-blue-500/15 px-2 py-0.5 rounded-full border border-blue-500/25">
                        {Math.round(Number(aiConfidenceVal) <= 1 ? Number(aiConfidenceVal) * 100 : Number(aiConfidenceVal))}% Confidence
                      </span>
                    )}
                  </div>
                  {aiSummaryVal ? (
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {aiSummaryVal}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Issue verified and classified as <span className="text-slate-200 font-medium capitalize">{String(categoryVal || '').replace(/_/g, ' ')}</span> with <span className="text-slate-200 font-medium uppercase">{severityVal}</span> severity.
                    </p>
                  )}
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
                      value={categoryVal ? <span className="capitalize">{String(categoryVal).replace(/_/g, ' ')}</span> : null}
                      pending={!categoryVal && !isAnalyzing}
                      analyzing={isAnalyzing && !categoryVal}
                    />
                    <DetailRow
                      icon={Gauge}
                      label="Severity"
                      value={severityVal ? <span className="uppercase font-semibold text-xs tracking-wider">{String(severityVal)}</span> : null}
                      pending={!severityVal && !isAnalyzing}
                      analyzing={isAnalyzing && !severityVal}
                    />
                    <DetailRow
                      icon={Gauge}
                      label="Priority Level"
                      value={
                        priority
                          ? <span style={{ color: priority.color }} className="font-semibold">{priority.label}</span>
                          : null
                      }
                      pending={!priorityVal && !isAnalyzing}
                      analyzing={isAnalyzing && !priorityVal}
                    />
                    <DetailRow
                      icon={Building2}
                      label="Department"
                      value={departmentNameVal ? <span>{departmentNameVal}</span> : null}
                      pending={!departmentNameVal && !isAnalyzing}
                      analyzing={isAnalyzing && !departmentNameVal}
                    />
                    {officerNameVal && (
                      <DetailRow
                        icon={UserCheck}
                        label="Assigned Officer"
                        value={<span>{officerNameVal}</span>}
                      />
                    )}
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
