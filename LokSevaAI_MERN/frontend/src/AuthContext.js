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
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/app/auth/callback'
      }
    });

    if (error) {
      console.error('Error signing in with Google:', error.message);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
      throw error;
    }
    // Redirect to landing page after logout
    window.location.href = 'http://localhost:5000';
  };

  const checkOnboardedStatus = async (email) => {
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