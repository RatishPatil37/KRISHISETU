import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

// ─── Constants ────────────────────────────────────────────────────────────────
// Read base URL from env — change REACT_APP_BASE_URL in .env to your prod domain
const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:5000';
const API_BASE = BASE_URL; // backend lives on same origin (proxied via CRA proxy)

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [authError, setAuthError] = useState(null); // surfaces auth errors to UI

  // ── Session bootstrap ──────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted) setUser(session?.user ?? null);
      } catch (err) {
        console.error('[Auth] Failed to restore session:', err.message);
        if (mounted) setAuthError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    bootstrap();

    // ── Real-time auth state listener ──────────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        switch (event) {
          case 'SIGNED_IN':
            setUser(session?.user ?? null);
            setAuthError(null);
            break;
          case 'SIGNED_OUT':
            setUser(null);
            break;
          case 'TOKEN_REFRESHED':
            // Session silently refreshed — update user object
            setUser(session?.user ?? null);
            break;
          case 'USER_UPDATED':
            setUser(session?.user ?? null);
            break;
          default:
            break;
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ── Google Sign-In ─────────────────────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Redirect back to /app/auth/callback on this origin after Google consent
          redirectTo: `${window.location.origin}/app/auth/callback`,
          queryParams: {
            access_type: 'offline', // request refresh_token from Google
            prompt: 'consent',      // always show consent screen (needed for refresh token)
          },
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('[Auth] Google sign-in failed:', err.message);
      setAuthError(err.message);
      throw err; // let the caller handle UI feedback if needed
    }
  }, []);

  // ── Sign-Out ───────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Redirect to landing page after logout
      window.location.href = BASE_URL;
    } catch (err) {
      console.error('[Auth] Sign-out failed:', err.message);
      setAuthError(err.message);
      throw err;
    }
  }, []);

  // ── Check if user has completed onboarding (exists in MongoDB) ─────────────
  const checkOnboardedStatus = useCallback(async (email) => {
    if (!email) return false;
    try {
      const res = await fetch(
        `${API_BASE}/api/users/check-email?email=${encodeURIComponent(email)}`
      );
      if (!res.ok) {
        console.warn('[Auth] check-email returned non-OK status:', res.status);
        return false;
      }
      const { exists } = await res.json();
      return Boolean(exists);
    } catch (err) {
      console.error('[Auth] Error checking onboarding status:', err.message);
      return false;
    }
  }, []);

  // ── Context value ──────────────────────────────────────────────────────────
  const value = {
    user,
    loading,
    authError,       // expose error so UI can show a toast/message
    signInWithGoogle,
    signOut,
    checkOnboardedStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};