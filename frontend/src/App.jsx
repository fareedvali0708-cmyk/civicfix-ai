import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import GovernmentProtectedRoute from './components/common/GovernmentProtectedRoute';
import AuthCallbackHandler from './components/auth/AuthCallbackHandler';
import LoginPage from './pages/LoginPage';
import GovernmentLoginPage from './pages/GovernmentLoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import DashboardPage from './pages/DashboardPage';
import ReportIssuePage from './pages/ReportIssuePage';
import HomePage from './pages/HomePage';
import IssueDetailPage from './pages/IssueDetailPage';
import GovernmentPage from './pages/GovernmentPage';

/**
 * App.jsx — root component.
 *
 * Route structure:
 *   /                  → HomePage (public)
 *   /login             → LoginPage (citizen login)
 *   /government/login  → GovernmentLoginPage (municipal officer login)
 *   /auth/callback     → AuthCallbackHandler (OAuth redirect landing)
 *   /unauthorized      → UnauthorizedPage (access denied for citizens)
 *   /dashboard         → DashboardPage (citizen protected)
 *   /report            → ReportIssuePage (citizen protected)
 *   /issues/:id        → IssueDetailPage (citizen protected)
 *   /government        → GovernmentPage (government protected)
 *   *                  → redirect to /login
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={
              <MainLayout>
                <HomePage />
              </MainLayout>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/government/login" element={<GovernmentLoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* OAuth callback — must be outside ProtectedRoute */}
          <Route path="/auth/callback" element={<AuthCallbackHandler />} />

          {/* Protected citizen routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <ReportIssuePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/issues/:id"
            element={
              <ProtectedRoute>
                <IssueDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Protected government route with role enforcement */}
          <Route
            path="/government"
            element={
              <GovernmentProtectedRoute>
                <GovernmentPage />
              </GovernmentProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
