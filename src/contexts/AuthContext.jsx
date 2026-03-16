import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const mountedRef = useRef(true);

  // Load user profile
  const loadProfile = useCallback(async (userId) => {
    if (!userId || !mountedRef.current) return;
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        ?.from('user_profiles')
        ?.select('*')
        ?.eq('id', userId)
        ?.single();
      if (!error && mountedRef.current) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Profile load error:', error);
    } finally {
      if (mountedRef.current) {
        setProfileLoading(false);
      }
    }
  }, []);

  // Clear profile
  const clearProfile = useCallback(() => {
    setUserProfile(null);
    setProfileLoading(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Initial session check
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase?.auth?.getSession();
        if (mountedRef.current) {
          setUser(session?.user ?? null);
          setLoading(false);
          if (session?.user) {
            loadProfile(session.user.id);
          }
        }
      } catch (error) {
        console.error('Session init error:', error);
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    initSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase?.auth?.onAuthStateChange(
      (event, session) => {
        if (!mountedRef.current) return;
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          clearProfile();
        }
      }
    );

    return () => {
      mountedRef.current = false;
      subscription?.unsubscribe();
    };
  }, [loadProfile, clearProfile]);

  // Auth methods
  const signIn = useCallback(async (email, password) => {
    try {
      const { data, error } = await supabase?.auth?.signInWithPassword({ email, password });
      return { data, error };
    } catch (error) {
      return { error: { message: 'Network error. Please try again.' } };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase?.auth?.signOut();
      if (!error) {
        setUser(null);
        clearProfile();
      }
      return { error };
    } catch (error) {
      return { error: { message: 'Network error. Please try again.' } };
    }
  }, [clearProfile]);

  const updateProfile = useCallback(async (updates) => {
    if (!user) return { error: { message: 'No user logged in' } };
    
    try {
      const { data, error } = await supabase
        ?.from('user_profiles')
        ?.update(updates)
        ?.eq('id', user?.id)
        ?.select()
        ?.single();
      if (!error && mountedRef.current) {
        setUserProfile(data);
      }
      return { data, error };
    } catch (error) {
      return { error: { message: 'Network error. Please try again.' } };
    }
  }, [user]);

  const value = {
    user,
    userProfile,
    loading,
    profileLoading,
    signIn,
    signOut,
    updateProfile,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
