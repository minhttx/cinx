import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

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
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('📊 Session result:', { session: !!session, error, userEmail: session?.user?.email });

        if (!mounted) {
          console.log('⚠️ Component unmounted, skipping auth init');
          return;
        }

        if (error) {
          console.error('❌ Session error:', error);
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('✅ User found, loading profile...');
          setUser(session.user);
          
          // Load profile with timeout
          try {
            const profileResult = await Promise.race([
              loadUserProfile(session.user.id),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Profile timeout')), 5000)
              )
            ]);
          } catch (profileError) {
            console.warn('⚠️ Profile load timeout, continuing anyway');
            setUserProfile(null);
          }
        } else {
          console.log('ℹ️ No user session found');
          setUser(null);
          setUserProfile(null);
        }

        console.log('✅ Auth initialization complete, setting loading=false');
        setLoading(false);

      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email || 'No user');
        
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          try {
            await loadUserProfile(session.user.id);
          } catch (err) {
            console.warn('⚠️ Profile load failed during auth change:', err);
            setUserProfile(null);
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Failsafe timeout - force loading=false after 10 seconds
    const failsafeTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('⏰ Failsafe timeout triggered - forcing loading=false');
        setLoading(false);
      }
    }, 10000);

    return () => {
      mounted = false;
      clearTimeout(failsafeTimeout);
      subscription?.unsubscribe();
    };
  }, []);


  const loadUserProfile = async (userId) => {
    try {
      console.log('🔄 Loading user profile for:', userId);
      
      // Use direct REST API instead of SDK
      const response = await fetch(`https://nifmtrvapcumdptswdus.supabase.co/rest/v1/users?id=eq.${userId}`, {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZm10cnZhcGN1bWRwdHN3ZHVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NTE5NTksImV4cCI6MjA3MjEyNzk1OX0.qEUulV3RnQJKr4WigeA89_t8KiInQl4Vd0VaOBiiB40',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZm10cnZhcGN1bWRwdHN3ZHVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NTE5NTksImV4cCI6MjA3MjEyNzk1OX0.qEUulV3RnQJKr4WigeA89_t8KiInQl4Vd0VaOBiiB40',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const profiles = await response.json();
        const profile = profiles[0] || null;
        console.log('✅ User profile loaded:', profile?.name || 'No profile');
        setUserProfile(profile);
      } else {
        console.log('ℹ️ No user profile found in database');
        setUserProfile(null);
      }
    } catch (error) {
      console.error('❌ Profile load failed:', error);
      setUserProfile(null);
    }
  };

  const signUp = async (email, password, userData = {}) => {
    try {
      setLoading(true);
      
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name || ''
          }
        }
      });

      if (error) throw error;

      // Create user profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            name: userData.name || '',
            email: email,
            phone: userData.phone || '',
            birth_year: userData.birth_year || '',
            role: 'user',
            status: 'active'
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      setUserProfile(null);
      
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUserProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error };
    }
  };

  const isAdmin = () => {
    return userProfile?.role === 'admin';
  };

  const isMod = () => {
    return userProfile?.role === 'admin' || userProfile?.role === 'mod';
  };

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAdmin,
    isMod,
    refreshProfile: () => user && loadUserProfile(user.id)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};