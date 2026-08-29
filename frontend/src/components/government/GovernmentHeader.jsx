import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { RefreshCw, Shield, LayoutDashboard, LogOut, Activity } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import Logo from '../common/Logo.jsx';

export default function GovernmentHeader({ loading, onRefresh, lastUpdated }) {
  const { user, signOut, role } = useAuth();
  const navigate = useNavigate();

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Municipal Officer';

  const handleSignOut = async () => {
    await signOut();
    navigate('/government/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[hsl(222,25%,9%)]/90 backdrop-blur-md border-b border-[hsl(222,20%,18%)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            {/* ← Home link to landing page */}
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-300 transition-colors duration-150"
              title="Back to CivicFix Home"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 5-7 7 7 7"/></svg>
              Home
            </Link>

            <Link to="/government" className="flex items-center gap-3">
              <Logo size="md" />
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white tracking-wide">CivicFix Command Center</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Activity size={10} className="animate-pulse" />
                    LIVE
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">Municipal Operations & Agentic Oversight</span>
              </div>
            </Link>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {/* Last updated & Refresh */}
            {lastUpdated && (
              <span className="hidden md:inline-block text-[11px] text-slate-400">
                Updated {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}

            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[hsl(222,20%,16%)] text-slate-300 hover:text-white hover:bg-[hsl(222,20%,22%)] border border-[hsl(222,20%,24%)] transition-all cursor-pointer disabled:opacity-50"
              title="Refresh Real Data"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-indigo-400' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Switch to Citizen Portal */}
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-600/10 text-indigo-300 hover:bg-indigo-600/20 border border-indigo-500/30 transition-all"
            >
              <LayoutDashboard size={13} />
              <span className="hidden sm:inline">Citizen Portal</span>
            </Link>

            {/* Officer Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[hsl(222,20%,14%)] border border-[hsl(222,20%,20%)]">
              <Shield size={14} className="text-indigo-400" />
              <div className="flex flex-col text-left">
                <span className="text-xs font-medium text-slate-200 max-w-[120px] truncate">
                  {displayName}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-indigo-300 font-mono leading-none">
                  {role === 'department_admin' ? 'Admin' : 'Officer'}
                </span>
              </div>
            </div>

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium bg-[hsl(222,20%,14%)] text-slate-400 hover:text-white hover:bg-rose-950/40 hover:border-rose-800/40 border border-[hsl(222,20%,20%)] transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
