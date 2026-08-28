import CitizenDashboard from '../components/dashboard/CitizenDashboard.jsx';

/**
 * DashboardPage
 *
 * Protected route at /dashboard.
 * Delegates entirely to CitizenDashboard — this file stays thin.
 * Authentication is enforced by ProtectedRoute in App.jsx.
 */
export default function DashboardPage() {
  return <CitizenDashboard />;
}
