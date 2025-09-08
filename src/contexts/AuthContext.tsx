import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { checkSessionSoft } from '@/auth/authSessionManager';
import { clearAuthStorageSafe } from '@/auth/clearAuthStorage';
import { useWakeUpHandler } from '@/hooks/useWakeUpHandler';
import { FLAGS } from '@/config/flags';

// Simplified type definition for profile updates
type ProfileUpdate = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  company_name?: string;
  location?: string;
  description_user?: string;
  telegram?: string;
  preferred_locale?: string;
  first_login_completed?: boolean;
  profile_completed?: boolean;
  accepted_terms?: boolean;
  accepted_privacy?: boolean;
};

type AuthContextType = {
  // Core state - unified session, user, profile, loading states
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: any;
  isAdmin: boolean;
  isCheckingAdmin: boolean;
  
  // Core auth methods
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: any }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, options?: any) => Promise<{ user: User | null; error: any }>;
  
  // Profile methods (delegates to Supabase directly)
  updateProfile: (updates: ProfileUpdate) => Promise<void>;
  
  // Additional auth methods for backward compatibility
  sendPasswordResetEmail: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  signInWithTelegram: (authData: any) => Promise<{ user: User | null; error: any }>;
  completeFirstLogin: () => Promise<void>;
  
  // Legacy properties for backward compatibility
  /** @deprecated Use profile directly */
  isLoading: boolean;
  /** @deprecated Use isCheckingAdmin */
  isProfileLoading: boolean;
  /** @deprecated Always null */
  profileError: string | null;
  /** @deprecated Always null */
  authError: string | null;
  /** @deprecated Always false */
  needsFirstLoginCompletion: boolean;
  /** @deprecated Always 'authed' when user exists */
  status?: string;
  /** @deprecated No-op function */
  refreshProfile: () => Promise<void>;
  /** @deprecated No-op function */
  retryProfileLoad: () => void;
  /** @deprecated No-op function */
  clearAuthError: () => void;
  /** @deprecated No-op function */
  forceReauth: () => Promise<void>;
  /** @deprecated No-op function */
  runDiagnostic: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);
export const useAuth = () => useContext(AuthContext)!;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Centralized wake-up handler
  useWakeUpHandler();

  // Centralized profile loading using React Query
  const profileQuery = useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user?.id,
    queryFn: async ({ signal }) => {
      if (!user?.id) throw new Error('No user ID available');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .abortSignal(signal)
        .single();
      
      if (error) throw error;
      return data;
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    retry: (failureCount, error: any) => {
      if (error?.name === 'AbortError' || (error?.status >= 400 && error?.status < 500)) {
        return false;
      }
      return failureCount < 1;
    },
  });

  // Stable derived state
  const profile = profileQuery.data || null;
  const isAdmin = profile?.user_type === 'admin';
  const isCheckingAdmin = !!user && profileQuery.isLoading;

  // Single source of truth: onAuthStateChange
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (FLAGS.DEBUG_AUTH) {
        console.debug('[AUTH] event:', event, !!newSession);
      }

      // Update session and user state
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        if (newSession?.access_token && FLAGS.REALTIME_ENABLED) {
          // Set realtime auth token (minimal realtime interaction)
          supabase.realtime.setAuth(newSession.access_token);
        }
        setLoading(false);
        
        if (FLAGS.DEBUG_AUTH) {
          console.debug('[AUTH] Session established');
        }
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        if (newSession?.access_token && FLAGS.REALTIME_ENABLED) {
          // Update realtime auth token
          supabase.realtime.setAuth(newSession.access_token);
        }
        
        if (FLAGS.DEBUG_AUTH) {
          console.debug('[AUTH] Token refreshed');
        }
        return;
      }

      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        // Clear auth storage
        clearAuthStorageSafe();
        setLoading(false);
        
        if (FLAGS.DEBUG_AUTH) {
          console.debug('[AUTH] Signed out, storage cleared');
        }
        return;
      }
    });

    // Initialize with existing session
    (async () => {
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      const verdict = checkSessionSoft(existingSession);
      
      if (!existingSession || !verdict.ok) {
        setUser(null); 
        setSession(null); 
        setLoading(false);
        
        if (FLAGS.DEBUG_AUTH) {
          console.debug('[AUTH] No valid session found');
        }
        return;
      }
      
      setSession(existingSession);
      setUser(existingSession.user);
      setLoading(false);
      
      if (FLAGS.DEBUG_AUTH) {
        console.debug('[AUTH] Session restored');
      }
    })();

    return () => {
      try { 
        subscription.unsubscribe(); 
      } catch {} 
    };
  }, []);

  // Core auth methods
  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error; 
      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut(); 
    // State cleanup handled by onAuthStateChange
  };

  const signUp = async (email: string, password: string, options?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          ...options,
        },
      });
      
      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error) {
      console.error("Sign up error:", error);
      return { user: null, error };
    }
  };

  const updateProfile = async (updates: ProfileUpdate) => {
    if (!user?.id) throw new Error("User not authenticated");
    
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);
      
    if (error) throw error;
    
    // React Query will handle cache invalidation automatically
  };

  // Additional methods for backward compatibility
  const sendPasswordResetEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signInWithTelegram = async (authData: any): Promise<{ user: User | null; error: any }> => {
    try {
      console.log("Telegram auth not implemented yet:", authData);
      return { user: null, error: new Error("Telegram auth not implemented") };
    } catch (error) {
      return { user: null, error };
    }
  };

  const completeFirstLogin = async () => {
    if (!user?.id) {
      console.error('Cannot complete first login without user');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          first_login_completed: true,
          profile_completed: true 
        })
        .eq('id', user.id);
        
      if (error) {
        console.error('Failed to complete first login:', error);
        throw error;
      }
      
      // React Query will handle cache invalidation automatically
      console.log('First login setup completed');
      
    } catch (error) {
      console.error('Error completing first login:', error);
    }
  };

  // No-op legacy methods for backward compatibility
  const refreshProfile = async () => {
    // No-op - React Query handles this automatically
  };

  const retryProfileLoad = () => {
    // No-op - use React Query refetch instead
  };

  const clearAuthError = () => {
    // No-op - errors handled by individual hooks
  };

  const forceReauth = async () => {
    await signOut();
  };

  const runDiagnostic = async () => {
    // No-op - use debugging tools instead
  };

  const value = useMemo<AuthContextType>(() => ({
    // Core unified state
    user, 
    session, 
    loading,
    profile,
    isAdmin,
    isCheckingAdmin,
    
    // Core methods
    signIn, 
    signOut,
    signUp,
    updateProfile,
    sendPasswordResetEmail,
    updatePassword,
    signInWithTelegram,
    completeFirstLogin,
    
    // Legacy properties for backward compatibility
    isLoading: loading || isCheckingAdmin,
    isProfileLoading: isCheckingAdmin,
    profileError: null,
    authError: null,
    needsFirstLoginCompletion: false,
    status: user ? 'authed' : 'guest',
    refreshProfile,
    retryProfileLoad,
    clearAuthError,
    forceReauth,
    runDiagnostic
  }), [user, session, loading, profile, isAdmin, isCheckingAdmin]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}