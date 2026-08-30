import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldX, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import Logo from '../components/common/Logo.jsx';

export default function UnauthorizedPage() {
  const { user, role } = useAuth();
  const email = user?.email || 'citizen account';
  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Citizen';

  return (
    <div className="min-h-screen bg-[hsl(222,25%,9%)] text-slate-100 flex flex-col justify-between p-6">
      {/* Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link to="/dashboard">
          <Logo size="md" />
        </Link>
        <Link
          to="/dashboard"
          className="text-xs text-slate-400 hover:text-white transition-colors"
        >
          Citizen Portal
        </Link>
      </header>

      {/* Main Container */}
      <main className="max-w-md w-full mx-auto my-auto py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="rounded-3xl p-8 sm:p-10 text-center bg-[hsl(222,25%,12%)] border border-rose-500/30 shadow-2xl shadow-rose-950/40 space-y-6"
        >
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <ShieldX size={32} />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1
              className="text-2xl font-bold text-white tracking-tight"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              Access Restricted
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              The Government Command Center requires a verified municipal officer or department administrator account.
            </p>
          </div>

          {/* Account Details Box */}
          <div className="p-3.5 rounded-xl bg-[hsl(222,20%,15%)] border border-[hsl(222,20%,22%)] text-xs text-left space-y-1">
            <span className="text-slate-400 text-[11px]">Current Session:</span>
            <p className="font-mono text-slate-200 truncate">{email}</p>
            <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Role: {displayRole}
            </span>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pt-2">
            <Link
              to="/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
            >
              <LayoutDashboard size={14} />
              <span>Return to Citizen Dashboard</span>
            </Link>

            <Link
              to="/government/login"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium text-slate-300 bg-[hsl(222,20%,16%)] hover:bg-[hsl(222,20%,22%)] border border-[hsl(222,20%,24%)] transition-colors"
            >
              <ShieldCheck size={14} className="text-indigo-400" />
              <span>Sign in with Government Account</span>
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center text-xs text-slate-500">
        CivicFix Autonomous Municipal Platform • Secure Role Enforcement
      </footer>
    </div>
  );
}
