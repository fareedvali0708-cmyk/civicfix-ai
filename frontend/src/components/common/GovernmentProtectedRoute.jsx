import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { Loader2 } from 'lucide-react';

/**
 * GovernmentProtectedRoute
 *
 * Enforces authentication and government role authorization:
 * - If session check is loading: displays loading screen.
 * - If unauthenticated: redirects to /government/login.
 * - If authenticated citizen (not government role): redirects to /unauthorized.
 * - If authenticated government_officer or department_admin: renders children.
 */
export default function GovernmentProtectedRoute({ children }) {
  const { isAuthenticated, isGovernmentUser, loading, profileLoading, role } = useAuth();

  // If initial auth session is loading OR user profile/role is still resolving, show loading screen
  if (loading || profileLoading) {
    return (
      <div
        id="gov-auth-loading-screen"
        className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[hsl(222,25%,9%)] text-slate-100"
      >
        <Loader2 size={32} className="animate-spin text-indigo-400" />
        <p className="text-sm text-slate-400 font-medium">Verifying government credentials…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/government/login" replace />;
  }

  if (!isGovernmentUser) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
