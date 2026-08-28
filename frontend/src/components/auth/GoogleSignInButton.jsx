import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

/**
 * GoogleSignInButton
 *
 * Reusable "Continue with Google" button.
 * Handles its own loading and disabled states.
 * All auth logic lives in the parent (LoginPage) via the onClick prop.
 */
export default function GoogleSignInButton({ onClick, loading = false, disabled = false }) {
  return (
    <motion.button
      id="google-signin-btn"
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.015, y: -1 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.985 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="
        relative w-full flex items-center justify-center gap-3
        px-5 py-3.5 rounded-xl font-medium text-sm
        bg-white text-gray-800
        border border-gray-200
        shadow-sm
        hover:bg-gray-50 hover:shadow-md
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-150
        select-none
      "
      aria-label="Continue with Google"
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin text-gray-500 shrink-0" />
      ) : (
        /* Google "G" SVG logo */
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 48 48"
          className="shrink-0"
        >
          <path
            fill="#4285F4"
            d="M44.5 20H24v8.5h11.8C34.1 33.9 29.6 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"
          />
          <path
            fill="#34A853"
            d="M6.3 14.7l7 5.1C15.2 16.2 19.3 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2c-7.7 0-14.4 4.4-17.7 10.7z"
          />
          <path
            fill="#FBBC05"
            d="M24 46c5.5 0 10.5-1.9 14.3-5l-6.6-5.4C29.8 37.3 27 38 24 38c-5.6 0-10.3-3.1-12.7-7.7l-7 5.4C7.7 41.7 15.3 46 24 46z"
          />
          <path
            fill="#EA4335"
            d="M44.5 20H24v8.5h11.8c-.8 2.5-2.5 4.6-4.7 6.1l6.6 5.4C41.3 37 44.5 31 44.5 24c0-1.3-.2-2.7-.5-4z"
          />
        </svg>
      )}
      <span>{loading ? 'Signing in…' : 'Continue with Google'}</span>
    </motion.button>
  );
}
