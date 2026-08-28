import { motion } from 'motion/react';
import { Bot, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { containerStagger, itemFadeUp } from '../../lib/motionVariants.js';

export default function GovernmentAgentActivity({ logs = [], onSelectIssue }) {
  if (logs.length === 0) {
    return (
      <div className="p-12 text-center bg-[hsl(222,25%,12%/0.5)] border border-[hsl(222,20%,18%)] rounded-2xl backdrop-blur-md">
        <Bot size={24} className="mx-auto mb-2 text-slate-500" />
        <h3 className="text-sm font-bold text-white mb-1" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
          No Recent Agent Logs
        </h3>
        <p className="text-xs text-slate-400">Agent activity records will display here in real time as reports are processed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-purple-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
            Agentic Activity & Audit Trail ({logs.length})
          </h3>
        </div>
        <span className="text-xs text-purple-300 font-semibold bg-purple-500/15 px-2.5 py-0.5 rounded-full border border-purple-500/30 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          Autonomous Agents Live
        </span>
      </div>

      <motion.div
        variants={containerStagger}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        {logs.map((log) => {
          const isSuccess = log.execution_status === 'success';
          const publicRef = log.issue_id ? log.issue_id.slice(0, 8) : 'Global';

          return (
            <motion.div
              key={log.id}
              variants={itemFadeUp}
              onClick={() => log.issue_id && onSelectIssue && onSelectIssue({ id: log.issue_id })}
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-all backdrop-blur-sm ${
                log.issue_id ? 'cursor-pointer hover:border-indigo-500/50 bg-[hsl(222,25%,12%/0.85)] hover:bg-[hsl(222,25%,15%)]' : 'bg-[hsl(222,25%,12%/0.6)]'
              } ${
                isSuccess
                  ? 'border-[hsl(222,20%,18%)]'
                  : 'border-red-500/30 bg-red-950/15'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${isSuccess ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {isSuccess ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{log.agent_name}</span>
                    <span className="text-[10px] font-mono font-semibold text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                      {log.action}
                    </span>
                    {log.issue_id && (
                      <span className="text-[10px] font-mono text-slate-400">
                        #{publicRef}
                      </span>
                    )}
                  </div>
                  {log.error_message ? (
                    <p className="text-[11px] text-red-300 mt-0.5">{log.error_message}</p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Execution completed successfully ({log.execution_status})
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 self-end sm:self-center">
                <Clock size={11} />
                <span>{log.created_at ? new Date(log.created_at).toLocaleTimeString() : ''}</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

