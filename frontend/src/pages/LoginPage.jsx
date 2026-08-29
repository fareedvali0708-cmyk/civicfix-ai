import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, AlertCircle, MapPin, Zap, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import GoogleSignInButton from '../components/auth/GoogleSignInButton.jsx';
import Logo from '../components/common/Logo.jsx';

/* ── Small feature pill rendered in the left panel ─────────────── */
function FeaturePill({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-300">
      <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/[0.07] border border-white/[0.08] text-blue-300 shrink-0">
        <Icon size={15} />
      </span>
      <span>{label}</span>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────── */
export default function LoginPage() {
  const { isAuthenticated, loading, signInWithGoogle, authError } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [signingIn, setSigningIn] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  // Detect error param from failed OAuth redirect (e.g. ?error=callback_failed)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'callback_failed') {
      setLocalError('Sign-in was cancelled or failed. Please try again.');
    }
  }, [searchParams]);

  const handleSignIn = async () => {
    setLocalError(null);
    setSigningIn(true);
    try {
      await signInWithGoogle();
      // Browser redirects away — signingIn stays true intentionally
    } catch {
      setSigningIn(false);
      setLocalError('Could not start sign-in. Check your connection and try again.');
    }
  };

  const displayError = localError || authError;

  // While checking the initial session, show nothing (ProtectedRoute handles the spinner)
  if (loading) return null;

  return (
    <div
      id="login-page"
      className="min-h-screen flex items-stretch"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── Left panel — brand / hero ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="hidden lg:flex flex-col justify-between w-1/2 p-14 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, hsl(222 47% 11%) 0%, hsl(220 43% 16%) 100%)',
        }}
      >
        {/* Subtle grid texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 48px), repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 48px)',
          }}
        />

        {/* Glow orb */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(220 90% 56% / 0.18) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <Logo size="lg" animate={false} />
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1
              className="text-4xl font-bold leading-tight text-white"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              Turn everyday problems
              <br />
              <span style={{ color: 'hsl(215 95% 68%)' }}>into action.</span>
            </h1>
            <p className="text-base text-slate-400 max-w-xs leading-relaxed">
              Report civic issues — potholes, broken lights, drainage blockages — and AI agents
              route them to the right team automatically.
            </p>
          </div>

          <div className="space-y-3">
            <FeaturePill icon={Zap} label="AI-driven issue routing in seconds" />
            <FeaturePill icon={MapPin} label="GPS-precise location tagging" />
            <FeaturePill icon={Users} label="Real-time status updates" />
          </div>
        </div>

        {/* Bottom note */}
        <p className="relative z-10 text-xs text-slate-500">
          © 2026 Agentic CivicFix · Hackathon Project
        </p>
      </motion.div>

      {/* ── Right panel — sign-in card ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="flex-1 flex items-center justify-center px-6 py-16"
        style={{ backgroundColor: 'hsl(220 20% 10%)' }}
      >
        <div className="w-full max-w-sm space-y-8">
          {/* ← Back to landing page */}
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors duration-150 mb-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 5-7 7 7 7"/></svg>
            CivicFix Home
          </Link>

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center">
            <Logo size="md" animate={false} />
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <h2
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              Welcome back
            </h2>
            <p className="text-sm text-slate-400">
              Sign in to report and track civic issues in your area.
            </p>
          </div>

          {/* Error alert */}
          <AnimatePresence mode="wait">
            {displayError && (
              <motion.div
                key="error"
                id="auth-error-message"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
                style={{
                  backgroundColor: 'hsl(0 70% 55% / 0.12)',
                  border: '1px solid hsl(0 70% 55% / 0.25)',
                  color: 'hsl(0 80% 70%)',
                }}
                role="alert"
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{displayError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sign-in button */}
          <div className="space-y-3">
            <GoogleSignInButton
              onClick={handleSignIn}
              loading={signingIn}
              disabled={signingIn}
            />

            <div
              className="text-center text-xs"
              style={{ color: 'hsl(220 10% 50%)' }}
            >
              You&apos;ll be redirected to Google to complete sign-in.
            </div>
          </div>

          {/* Divider */}
          <div
            className="border-t"
            style={{ borderColor: 'hsl(220 20% 20%)' }}
          />

          {/* Privacy note */}
          <div className="flex items-start gap-2.5 text-xs" style={{ color: 'hsl(220 10% 50%)' }}>
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-500" />
            <span>
              We use Google OAuth via Supabase. We never store your Google password.
              Your data is used solely to track and resolve civic complaints.
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
