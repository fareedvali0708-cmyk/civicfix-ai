import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Clock,
  AlertTriangle,
  Building,
  User,
  MapPin,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Bot,
  Layers,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { fetchGovernmentIssueDetail } from '../../services/governmentService.js';
import { transitions } from '../../lib/motionVariants.js';

export default function GovernmentIssueDetailModal({ issueId, onClose }) {
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!issueId) return;

    let cancelled = false;

    async function loadDetail() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchGovernmentIssueDetail(issueId);
        if (!cancelled && res.success) {
          setDetailData(res);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load issue details.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [issueId]);

  if (!issueId) return null;

  const issue = detailData?.issue;
  const updates = detailData?.updates || [];
  const agentLogs = detailData?.agentLogs || [];
  const escalation = detailData?.escalation;

  const publicRef = issue?.public_id || issue?.public_issue_id || issueId.slice(0, 8);

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

  const getSlaBadge = (slaStatus, remainingHours) => {
    switch (slaStatus) {
      case 'breached':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
            <AlertTriangle size={13} />
            SLA BREACHED (Overdue)
          </span>
        );
      case 'at_risk':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Clock size={13} className="text-amber-400 animate-pulse" />
            SLA AT RISK ({remainingHours}h remaining)
          </span>
        );
      case 'on_track':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <Clock size={13} />
            SLA ON TRACK ({remainingHours}h remaining)
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 14 }}
        transition={transitions.springSmooth}
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-[hsl(222,25%,11%/0.95)] border border-[hsl(222,20%,22%)] backdrop-blur-xl shadow-2xl overflow-hidden"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(222,20%,18%)] bg-[hsl(222,25%,13%/0.9)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Layers size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                  Civic Issue Dossier
                </h3>
                <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded border border-indigo-500/25">
                  REF #{publicRef}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">UUID: {issueId}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[hsl(222,20%,20%)] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 mx-auto border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-300 font-medium">Fetching real issue records from Supabase...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300">
              <AlertTriangle size={24} className="mx-auto mb-2" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          ) : issue ? (
            <>
              {/* Escalation Banner if active */}
              {(escalation || issue.is_escalated || issue.status === 'escalated') && (
                <div className="p-4 rounded-2xl bg-red-600/15 border border-red-500/40 text-red-200 space-y-1 shadow-lg shadow-red-950/20">
                  <div className="flex items-center gap-2 text-sm font-bold text-red-300">
                    <ShieldAlert size={18} className="text-red-400" />
                    <span>OFFICIAL ESCALATION NOTICE</span>
                  </div>
                  <p className="text-xs text-red-200/90 leading-relaxed">
                    Reason: {escalation?.reason || 'Escalated to senior departmental oversight due to SLA breach or critical safety risk.'}
                  </p>
                  {escalation?.created_at && (
                    <p className="text-[10px] text-red-300/70 font-mono">
                      Escalated At: {new Date(escalation.created_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Top Section: Photo & Metadata Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Photo Panel */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Verified Photo Evidence
                  </span>
                  <div className="w-full h-64 rounded-2xl bg-[hsl(222,25%,14%)] border border-[hsl(222,20%,20%)] overflow-hidden flex items-center justify-center relative">
                    {issue.signed_image_url ? (
                      <img
                        src={issue.signed_image_url}
                        alt="Issue photographic evidence"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4 text-slate-500">
                        <AlertTriangle size={24} className="mx-auto mb-1 text-slate-600" />
                        <span className="text-xs">No image attached</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metadata Summary */}
                <div className="space-y-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Classification & SLA Status
                  </span>

                  <div className="p-4 rounded-2xl bg-[hsl(222,25%,14%/0.85)] border border-[hsl(222,20%,20%)] space-y-3 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Category:</span>
                      <span className="text-xs font-bold text-white uppercase bg-[hsl(222,20%,20%)] px-2 py-0.5 rounded border border-[hsl(222,20%,24%)]">
                        {(issue.category || 'other').replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Severity:</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${getSeverityBadge(issue.severity)}`}>
                        {issue.severity || 'medium'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Priority Level:</span>
                      <span className="text-xs font-bold text-slate-200 uppercase">
                        {issue.priority_level || 'standard'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">SLA Evaluation:</span>
                      <div>{getSlaBadge(issue.sla_status, issue.remaining_hours)}</div>
                    </div>

                    {issue.sla_deadline && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Target Deadline:</span>
                        <span className="font-mono text-slate-300">
                          {new Date(issue.sla_deadline).toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="border-t border-[hsl(222,20%,20%)] pt-3 flex items-center justify-between">
                      <span className="text-xs text-slate-400">Assigned Department:</span>
                      <span className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                        <Building size={13} />
                        {issue.department_name}
                      </span>
                    </div>

                    {issue.assigned_officer_name && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Assigned Officer:</span>
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                          <User size={13} />
                          {issue.assigned_officer_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Gemini Analysis Box */}
              <div className="p-4 rounded-2xl bg-indigo-950/25 border border-indigo-500/35 space-y-2 backdrop-blur-sm shadow-md shadow-indigo-950/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
                    <Sparkles size={15} className="text-indigo-400" />
                    <span>Gemini Vision AI Analysis</span>
                  </div>
                  {issue.ai_confidence && (
                    <span className="text-xs font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
                      {Math.round(issue.ai_confidence * 100)}% Confidence
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {issue.ai_summary || 'Analysis complete based on photographic evidence and location context.'}
                </p>
              </div>

              {/* Citizen Description & Location Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[hsl(222,25%,14%/0.85)] border border-[hsl(222,20%,20%)] space-y-1.5 backdrop-blur-sm">
                  <span className="text-xs font-semibold text-slate-400">Citizen Description</span>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {issue.description || 'No additional citizen text provided.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[hsl(222,25%,14%/0.85)] border border-[hsl(222,20%,20%)] space-y-2 backdrop-blur-sm">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <MapPin size={13} className="text-indigo-400" />
                    Location Coordinates
                  </span>
                  <p className="text-xs text-slate-200 truncate">
                    {issue.address || 'GPS coordinates verified'}
                  </p>
                  {issue.latitude && issue.longitude ? (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-mono text-slate-400">
                        {Number(issue.latitude).toFixed(5)}, {Number(issue.longitude).toFixed(5)}
                      </span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${issue.latitude},${issue.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <span>Open Map</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">No GPS coordinates recorded</span>
                  )}
                </div>
              </div>

              {/* Real Processing Timeline from public.issue_updates */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                  <Calendar size={14} className="text-indigo-400" />
                  <span>Agentic Processing Timeline ({updates.length} events)</span>
                </div>

                <div className="p-4 rounded-2xl bg-[hsl(222,25%,14%/0.85)] border border-[hsl(222,20%,20%)] space-y-4 backdrop-blur-sm">
                  {updates.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-2">No timeline events recorded yet.</p>
                  ) : (
                    updates.map((update, idx) => (
                      <div key={update.id || idx} className="flex items-start gap-3 text-xs">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">
                              {update.agent_name || 'System Event'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {update.created_at ? new Date(update.created_at).toLocaleTimeString() : ''}
                            </span>
                          </div>
                          <p className="text-slate-300 mt-0.5 leading-relaxed">{update.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Real Agent Execution Logs from public.agent_logs */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                  <Bot size={14} className="text-purple-400" />
                  <span>Agent Audit Execution Logs ({agentLogs.length} entries)</span>
                </div>

                <div className="p-4 rounded-2xl bg-[hsl(222,25%,13%/0.85)] border border-[hsl(222,20%,20%)] space-y-2.5 backdrop-blur-sm">
                  {agentLogs.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-2">No agent audit logs found for this issue.</p>
                  ) : (
                    agentLogs.map((log, idx) => (
                      <div
                        key={log.id || idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[hsl(222,20%,16%)] border border-[hsl(222,20%,22%)] text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                          <span className="font-bold text-slate-200">{log.agent_name}</span>
                          <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                            {log.action}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-emerald-400 uppercase">
                            {log.execution_status}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {log.created_at ? new Date(log.created_at).toLocaleTimeString() : ''}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-3.5 border-t border-[hsl(222,20%,18%)] bg-[hsl(222,25%,12%)] flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Agentic CivicFix Government Command Center — Operations Dossier
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[hsl(222,20%,18%)] text-white hover:bg-[hsl(222,20%,24%)] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

