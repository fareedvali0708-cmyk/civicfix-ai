import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedRoute
 *
 * Wraps any route element that requires authentication.
 *
 * - While the initial session check is in flight (loading=true), renders
 *   a full-screen spinner so there is no premature redirect flash.
 * - Once loading is complete:
 *   - Authenticated: renders children.
 *   - Unauthenticated: redirects to /login.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        id="auth-loading-screen"
        className="min-h-screen flex flex-col items-center justify-center gap-3"
      >
        <Loader2 size={28} className="animate-spin text-blue-400" />
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
