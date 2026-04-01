import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // --- DEVELOPMENT MOCK BYPASS ---
    const isMock = localStorage.getItem('krishisetu_mock_logged_in') === 'true';
    if (isMock) {
        setUser({ id: 'mock-auth-id', email: 'farmer@krishisetu.com', user_metadata: { full_name: 'Farmer User' } });
        setLoading(false);
        return;
    }
    
    /* --- PRODUCTION SUPABASE AUTH ---
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
    */
  }, []);

  const signInWithGoogle = async () => {
    // --- DEVELOPMENT MOCK BYPASS ---
    window.location.href = 'http://localhost:5000/app/auth/callback?mock_bypass=true';
    
    /* --- PRODUCTION SUPABASE AUTH ---
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      console.error('Error signing in with Google:', error.message);
      throw error;
    }
    */
  };

  const signOut = async () => {
    // --- DEVELOPMENT MOCK BYPASS ---
    localStorage.removeItem('krishisetu_mock_logged_in');
    setUser(null);
    window.location.href = 'http://localhost:5000';
    
    /* --- PRODUCTION SUPABASE AUTH ---
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
      throw error;
    }
    // Redirect to landing page after logout
    window.location.href = 'http://localhost:5000';
    */
  };

  const checkOnboardedStatus = async (email) => {
    // --- DEVELOPMENT MOCK BYPASS ---
    // If we're mocking, we just assume they are onboarded to reach the dashboard
    return true;

    /* --- PRODUCTION MONGODB CHECK ---
    try {
      if (!email) return false;

      const res = await fetch(`http://localhost:5000/api/users/check-email?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const { exists } = await res.json();
        return exists;
      }
      return false;
    } catch (error) {
      console.error('Error checking onboarded status in MongoDB:', error);
      return false;
    }
    */
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signOut,
    checkOnboardedStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};