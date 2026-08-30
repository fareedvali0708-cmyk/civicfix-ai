import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, Activity, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import Logo from '../components/common/Logo.jsx';

export default function GovernmentLoginPage() {
  const { isAuthenticated, isGovernmentUser, loading: authLoading, signInWithPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // If already authenticated with government role, redirect directly to command center
  useEffect(() => {
    if (!authLoading && isAuthenticated && isGovernmentUser) {
      navigate('/government', { replace: true });
    }
  }, [isAuthenticated, isGovernmentUser, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setSigningIn(true);
    setErrorMessage(null);

    try {
      const result = await signInWithPassword(email.trim(), password);
      const userRole = result?.role;

      if (
        userRole === 'officer' ||
        userRole === 'admin' ||
        userRole === 'government_officer' ||
        userRole === 'department_admin'
      ) {
        navigate('/government', { replace: true });
      } else if (userRole === 'citizen') {
        navigate('/unauthorized', { replace: true });
      } else {
        // Fallback for government portal if role verified or default navigation
        navigate('/government', { replace: true });
      }
    } catch (err) {
      console.error('[GovernmentLoginPage] Sign-in error:', err);
      let msg = err?.message || 'Invalid government credentials.';
      if (
        msg.toLowerCase().includes('invalid login credentials') ||
        msg.toLowerCase().includes('invalid credentials')
      ) {
        msg = 'Invalid government credentials. Please check your email and password.';
      }
      setErrorMessage(msg);
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
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2" title="CivicFix Home">
            <Logo size="md" />
          </Link>
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span>CivicFix Home</span>
          </Link>
        </div>
        <Link
          to="/login"
          id="citizen-portal-link"
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
          <AnimatePresence mode="wait">
            {errorMessage && (
              <motion.div
                key="error-message"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300"
                role="alert"
              >
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <p id="gov-auth-error-text">{errorMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email/Password Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="gov-email"
                className="block text-xs font-semibold text-slate-300"
              >
                Government Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail size={15} />
                </div>
                <input
                  id="gov-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gov.demo@civicfix.demo"
                  disabled={signingIn}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 bg-[hsl(222,20%,14%)] border border-[hsl(222,20%,22%)] rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label
                htmlFor="gov-password"
                className="block text-xs font-semibold text-slate-300"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={15} />
                </div>
                <input
                  id="gov-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={signingIn}
                  className="w-full pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 bg-[hsl(222,20%,14%)] border border-[hsl(222,20%,22%)] rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="gov-login-submit-btn"
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/25 border border-indigo-400/30 cursor-pointer disabled:opacity-50 mt-2"
            >
              {signingIn ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in to Government Portal</span>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-500 pt-1">
              Only authorized staff credentials will be granted access.
            </p>
          </form>

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
