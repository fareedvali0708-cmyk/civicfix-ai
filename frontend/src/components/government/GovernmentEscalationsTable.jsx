import { motion } from 'motion/react';
import { AlertTriangle, ShieldAlert, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { containerStagger, itemFadeUp } from '../../lib/motionVariants.js';

export default function GovernmentEscalationsTable({ escalations = [], onSelectIssue }) {
  if (escalations.length === 0) {
    return (
      <div className="p-12 text-center bg-[hsl(222,25%,12%/0.5)] border border-[hsl(222,20%,18%)] rounded-2xl backdrop-blur-md">
        <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 size={24} />
        </div>
        <h3 className="text-base font-bold text-white mb-1" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
          No Active Escalations
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          All civic issues are currently resolving within normal SLA parameters or standard routing channels.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <ShieldAlert size={18} className="text-red-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
            Active Administrative Escalations ({escalations.length})
          </h3>
        </div>
        <span className="text-xs text-red-300 font-semibold bg-red-500/15 px-2.5 py-0.5 rounded-full border border-red-500/30 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          Senior Oversight Required
        </span>
      </div>

      <motion.div
        variants={containerStagger}
        initial="hidden"
        animate="visible"
        className="space-y-2.5"
      >
        {escalations.map((esc) => {
          const publicRef = esc.issue_id ? esc.issue_id.slice(0, 8) : 'N/A';

          return (
            <motion.div
              key={esc.id}
              variants={itemFadeUp}
              whileHover={{ scale: 1.002, x: 2, transition: { duration: 0.15 } }}
              onClick={() => onSelectIssue && onSelectIssue({ id: esc.issue_id })}
              className="p-4 rounded-2xl bg-red-950/25 border border-red-500/35 hover:border-red-500/55 backdrop-blur-sm transition-all cursor-pointer shadow-lg shadow-red-950/20"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-red-300 bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">
                      ISSUE #{publicRef}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-200 bg-red-600/30 px-2 py-0.5 rounded border border-red-500/40">
                      ESCALATED LEVEL
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock size={11} />
                      {esc.created_at ? new Date(esc.created_at).toLocaleString() : 'Recent'}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-red-100 leading-relaxed mt-1">
                    {esc.reason || 'Escalated to senior departmental management.'}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span>
                      Previous: <strong className="text-slate-300 uppercase">{esc.previous_level || 'assigned'}</strong>
                    </span>
                    <span>→</span>
                    <span>
                      New Status: <strong className="text-red-300 uppercase">{esc.new_level || 'escalated'}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-red-300 shrink-0">
                  <span>View Dossier</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

