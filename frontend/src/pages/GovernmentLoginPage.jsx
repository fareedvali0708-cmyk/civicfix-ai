import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, Lock, AlertCircle, ArrowRight, Activity, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import Logo from '../components/common/Logo.jsx';

export default function GovernmentLoginPage() {
  const { isAuthenticated, isGovernmentUser, signInWithGoogle } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // If already authenticated with government role, redirect directly to command center
  if (isAuthenticated && isGovernmentUser) {
    return <Navigate to="/government" replace />;
  }

  const handleGoogleLogin = async () => {
    setSigningIn(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle('government');
    } catch (err) {
      console.error('[GovernmentLoginPage] Sign-in error:', err.message);
      setErrorMessage(err.message || 'Failed to authenticate. Please try again.');
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(224,30%,7%)] text-slate-100 flex flex-col justify-between p-4 sm:p-6 selection:bg-indigo-500 selection:text-white">
      {/* Background ambient glow */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div
          className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full blur-[140px] opacity-[0.09]"
          style={{
            background: 'radial-gradient(circle, hsl(220 90% 56%) 0%, hsl(260 80% 50%) 60%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[140px] opacity-[0.05]"
          style={{
            background: 'radial-gradient(circle, hsl(200 90% 50%) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <Link to="/">
          <Logo size="md" />
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span>Citizen Portal</span>
          <ArrowRight size={12} />
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md w-full mx-auto my-auto py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="rounded-3xl p-7 sm:p-10 bg-[hsl(222,25%,11%)]/95 border border-[hsl(222,20%,20%)] backdrop-blur-xl shadow-2xl shadow-black/50 space-y-6"
        >
          {/* Government Badge & Icon */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-indigo-600/15 border-2 border-indigo-500/30 text-indigo-400 shadow-lg shadow-indigo-500/10">
              <Shield size={32} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 uppercase">
              <Activity size={10} className="animate-pulse text-emerald-400" />
              Municipal Command Center
            </div>

            <div className="space-y-1">
              <h1
                className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
                style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
              >
                CivicFix Government Portal
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Secure access for municipal officers and department administrators.
              </p>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="p-4 rounded-2xl bg-[hsl(222,20%,14%)] border border-[hsl(222,20%,18%)] space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
              <span>Real-Time Autonomous Agent Pipeline Oversight</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
              <span>Departmental SLA Monitoring & Escalations</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
              <span>Multi-Department Issue Triage & Geo-Spatial Map</span>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300"
            >
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </motion.div>
          )}

          {/* Sign in with Google Button */}
          <div className="space-y-3 pt-1">
            <button
              onClick={handleGoogleLogin}
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-2xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/25 border border-indigo-400/30 cursor-pointer disabled:opacity-50"
            >
              {signingIn ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{signingIn ? 'Redirecting to OAuth…' : 'Sign in with Municipal Google Account'}</span>
            </button>

            <p className="text-[11px] text-center text-slate-500">
              Only authorized staff credentials will be granted access.
            </p>
          </div>

          {/* Switch to Citizen Login */}
          <div className="pt-2 border-t border-[hsl(222,20%,18%)] text-center">
            <Link
              to="/login"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Citizen? Sign in to Citizen Portal →
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center text-[11px] text-slate-500 py-2">
        CivicFix Autonomous Governance Infrastructure • Internal Prototype
      </footer>
    </div>
  );
}
