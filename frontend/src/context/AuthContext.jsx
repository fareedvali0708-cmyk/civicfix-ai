import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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

  const roleRef = useRef(null);
  const profileRef = useRef(null);

  const updateRoleState = useCallback((newRole, newProfile = null) => {
    roleRef.current = newRole;
    if (newProfile !== undefined) {
      profileRef.current = newProfile;
      setProfile(newProfile);
    }
    setRole(newRole);
  }, []);

  // Helper to resolve user role using public.profiles as the single source of truth
  const resolveUserRole = useCallback(async (currentUser, forceRefresh = false) => {
    if (!currentUser?.id) {
      updateRoleState(null, null);
      setProfileLoading(false);
      return null;
    }

    // If profile and role for this user ID are already resolved and not forcing refresh, retain them
    if (!forceRefresh && profileRef.current?.id === currentUser.id && roleRef.current) {
      return roleRef.current;
    }

    setProfileLoading(true);
    try {
      // 1. Single Source of Truth: fetch public.profiles row in Supabase using Auth user UUID (user.id)
      const userProfile = await fetchUserProfile(currentUser.id, 3, 250);
      if (userProfile?.role) {
        updateRoleState(userProfile.role, userProfile);
        return userProfile.role;
      }

      // 2. Metadata fallback only if no profile row exists
      const metaRole =
        currentUser.app_metadata?.role ||
        currentUser.user_metadata?.role ||
        null;

      if (metaRole) {
        updateRoleState(metaRole, userProfile || null);
        return metaRole;
      }

      // 3. If we previously had a valid role for this user, preserve it rather than demoting
      if (roleRef.current && profileRef.current?.id === currentUser.id) {
        return roleRef.current;
      }

      // 4. Known Government Demo Account fallback
      const email = String(currentUser.email || '').toLowerCase();
      if (email === 'gov.demo@civicfix.demo' || email.startsWith('gov.')) {
        updateRoleState('officer', userProfile || null);
        return 'officer';
      }

      // 5. Default to citizen for standard citizen accounts
      updateRoleState('citizen', userProfile || null);
      return 'citizen';
    } catch (err) {
      console.warn('[AuthContext] Role resolution notice:', err.message);
      if (roleRef.current && profileRef.current?.id === currentUser.id) {
        return roleRef.current;
      }
      const email = String(currentUser.email || '').toLowerCase();
      if (email === 'gov.demo@civicfix.demo' || email.startsWith('gov.')) {
        updateRoleState('officer', null);
        return 'officer';
      }
      updateRoleState('citizen', null);
      return 'citizen';
    } finally {
      setProfileLoading(false);
    }
  }, [updateRoleState]);

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
          updateRoleState(null, null);
        }
      })
      .catch((err) => {
        console.error('[AuthContext] Failed to get session:', err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // 2. Subscribe to auth state changes (handles multi-tab session sync)
    const unsubscribe = onAuthStateChange(async (event, newSession) => {
      if (cancelled) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        updateRoleState(null, null);
        setAuthError(null);
        setProfileLoading(false);
        return;
      }

      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setSession(newSession);
        const newUser = newSession?.user ?? null;
        setUser(newUser);
        if (newUser && (!roleRef.current || profileRef.current?.id !== newUser.id)) {
          await resolveUserRole(newUser);
        }
        return;
      }

      // INITIAL_SESSION, SIGNED_IN
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);

      if (newUser) {
        await resolveUserRole(newUser);
      } else {
        updateRoleState(null, null);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [resolveUserRole, updateRoleState]);

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
