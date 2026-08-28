import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithGoogle,
  signOut,
  getSession,
  onAuthStateChange,
  fetchUserProfile,
} from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Helper to resolve user role from database profiles or metadata
  const resolveUserRole = useCallback(async (currentUser) => {
    if (!currentUser?.id) {
      setRole(null);
      return null;
    }

    try {
      // 1. Try public.profiles in Supabase
      const profile = await fetchUserProfile(currentUser.id);
      if (profile?.role) {
        setRole(profile.role);
        return profile.role;
      }

      // 2. Check metadata on user object
      const metaRole =
        currentUser.app_metadata?.role ||
        currentUser.user_metadata?.role ||
        null;

      if (metaRole) {
        setRole(metaRole);
        return metaRole;
      }

      // 3. If signed in via government portal session indicator
      const activePortal = sessionStorage.getItem('auth_portal');
      if (activePortal === 'government') {
        setRole('government_officer');
        return 'government_officer';
      }

      // Default role
      setRole('citizen');
      return 'citizen';
    } catch (err) {
      console.warn('[AuthContext] Role resolution notice:', err.message);
      setRole('citizen');
      return 'citizen';
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    // 1. Fetch existing session on mount
    getSession()
      .then(async (currentSession) => {
        if (cancelled) return;
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await resolveUserRole(currentUser);
        }
      })
      .catch((err) => {
        console.error('[AuthContext] Failed to get session:', err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // 2. Subscribe to future auth state changes
    const unsubscribe = onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);

      if (newUser) {
        await resolveUserRole(newUser);
      } else {
        setRole(null);
      }

      if (event === 'SIGNED_OUT') {
        setAuthError(null);
        setRole(null);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [resolveUserRole]);

  const handleSignInWithGoogle = async (portal = 'citizen') => {
    setAuthError(null);
    try {
      await signInWithGoogle(portal);
    } catch (err) {
      console.error('[AuthContext] Google sign-in failed:', err.message);
      setAuthError('Sign-in failed. Please try again.');
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    try {
      await signOut();
      setRole(null);
    } catch (err) {
      console.error('[AuthContext] Sign-out failed:', err.message);
      setAuthError('Sign-out failed. Please try again.');
    }
  };

  const isGovernmentUser = role === 'government_officer' || role === 'department_admin';

  const value = {
    user,
    session,
    role: role || 'citizen',
    isGovernmentUser,
    loading,
    authError,
    isAuthenticated: !!user,
    signInWithGoogle: handleSignInWithGoogle,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
