import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithGoogle,
  signInWithPassword,
  signOut,
  getSession,
  onAuthStateChange,
  fetchUserProfile,
} from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Helper to resolve user role using public.profiles as the single source of truth
  const resolveUserRole = useCallback(async (currentUser) => {
    if (!currentUser?.id) {
      setProfile(null);
      setRole(null);
      setProfileLoading(false);
      return null;
    }

    setProfileLoading(true);
    try {
      // 1. Single Source of Truth: fetch public.profiles row in Supabase using Auth user UUID (user.id)
      const userProfile = await fetchUserProfile(currentUser.id);
      if (userProfile?.role) {
        setProfile(userProfile);
        setRole(userProfile.role);
        return userProfile.role;
      }

      // 2. Metadata fallback only if no profile row exists
      const metaRole =
        currentUser.app_metadata?.role ||
        currentUser.user_metadata?.role ||
        null;

      if (metaRole) {
        setProfile(userProfile || null);
        setRole(metaRole);
        return metaRole;
      }

      // 3. Default to citizen only if no role is defined in DB or metadata
      setProfile(userProfile || null);
      setRole('citizen');
      return 'citizen';
    } catch (err) {
      console.warn('[AuthContext] Role resolution notice:', err.message);
      setRole('citizen');
      return 'citizen';
    } finally {
      setProfileLoading(false);
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
        } else {
          setRole(null);
          setProfile(null);
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
      if (cancelled) return;
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);

      if (newUser) {
        await resolveUserRole(newUser);
      } else {
        setRole(null);
        setProfile(null);
      }

      if (event === 'SIGNED_OUT') {
        setAuthError(null);
        setRole(null);
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [resolveUserRole]);

  const handleSignInWithPassword = async (email, password) => {
    setAuthError(null);
    setProfileLoading(true);
    try {
      const data = await signInWithPassword(email, password);
      let userRole = null;
      let userProfile = null;
      if (data?.user) {
        setUser(data.user);
        setSession(data.session);
        userProfile = await fetchUserProfile(data.user.id);
        userRole = userProfile?.role || 'officer';
        setProfile(userProfile);
        setRole(userRole);
      }
      return { data, profile: userProfile, role: userRole };
    } catch (err) {
      console.error('[AuthContext] Password sign-in failed:', err.message);
      setAuthError(err.message || 'Sign-in failed. Please try again.');
      throw err;
    } finally {
      setProfileLoading(false);
    }
  };

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
      setProfile(null);
    } catch (err) {
      console.error('[AuthContext] Sign-out failed:', err.message);
      setAuthError('Sign-out failed. Please try again.');
    }
  };

  const isGovernmentUser = role === 'officer' || role === 'admin';

  const value = {
    user,
    session,
    profile,
    role,
    isGovernmentUser,
    loading,
    profileLoading,
    authError,
    isAuthenticated: !!user,
    signInWithPassword: handleSignInWithPassword,
    signInWithGoogle: handleSignInWithGoogle,
    signOut: handleSignOut,
    resolveUserRole,
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
