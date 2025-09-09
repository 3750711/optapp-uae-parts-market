import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { checkSessionSoft } from '@/auth/authSessionManager';
import { clearAuthStorageSafe } from '@/auth/clearAuthStorage';
import { useWakeUpHandler } from '@/hooks/useWakeUpHandler';
import { FLAGS } from '@/config/flags';

// Local timeout utility to avoid external dependencies
async function withTimeout<T>(promise: Promise<T>, ms: number, label = 'timeout'): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(label)), ms);
  });
  
  try {
    return await Promise.race([promise, timeoutPromise]) as T;
  } finally {
    clearTimeout(timer);
  }
}

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
  signInWithTelegram: (authData: any) => Promise<{ user: User | null; error: any; telegramData?: any }>;
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
  // Defensive check for React dispatcher - using safer approach
  try {
    const [testState] = useState(null); // This will fail if dispatcher is null
  } catch (error: any) {
    if (error?.message?.includes('dispatcher') || error?.message?.includes('null')) {
      console.error('🚨 [AuthProvider] React dispatcher not ready, hooks unavailable');
      throw new Error('React dispatcher not initialized - try refreshing page');
    }
  }

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef<() => void>();
  const endedRef = useRef(false); // Prevent multiple setLoading(false) calls

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

  // Initialize auth state with improved timeout handling
  useEffect(() => {
    let cancelled = false;
    
    // Read runtime configuration for timeouts
    const RC = (window as any).__PB_RUNTIME__ || {};
    const INIT_TIMEOUT = Number(RC.AUTH_INIT_TIMEOUT_MS ?? 20000);  // getSession timeout (увеличен для продакшена)
    const WATCHDOG_TIMEOUT = Math.max(INIT_TIMEOUT + 5000, 25000);  // страховка с большим запасом

    // 1) Set up auth state subscription FIRST (before getSession)
    unsubRef.current?.();
    const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (cancelled) return;
      
      if (FLAGS.DEBUG_AUTH) {
        console.debug('[AuthProvider] Auth state changed:', event, newSession?.user?.id, 
          'hasUser:', !!newSession?.user, 'token:', !!newSession?.access_token);
      }

      // Update session and user state
      setSession(newSession);
      setUser(newSession?.user ?? null);

      // Realtime auth removed - no longer needed
      // if (newSession?.access_token) {
      //   supabase.realtime.setAuth(newSession.access_token);
      // }

      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        // Clear auth storage
        clearAuthStorageSafe();
      }

      // End loading on key auth events
      if (!endedRef.current && (
        event === 'INITIAL_SESSION' || 
        event === 'SIGNED_IN' || 
        event === 'TOKEN_REFRESHED' || 
        event === 'SIGNED_OUT'
      )) {
        endedRef.current = true;
        setLoading(false);
        if (FLAGS.DEBUG_AUTH) {
          console.log('[AuthProvider] Loading ended by event:', event);
        }
      }
    });
    
    unsubRef.current = () => data.subscription.unsubscribe();

    // 2) Try to restore session with timeout (don't block app forever)
    (async () => {
      try {
        const startTime = Date.now();
        await withTimeout(supabase.auth.getSession(), INIT_TIMEOUT, 'getSession-timeout');
        
        if (FLAGS.DEBUG_AUTH) {
          console.log('[AuthProvider] getSession completed in', Date.now() - startTime, 'ms');
        }
      } catch (error) {
        console.warn('[AuthProvider] getSession failed/timeout on init:', error);
      } finally {
        // If no auth events came through, end loading anyway
        if (!cancelled && !endedRef.current) {
          endedRef.current = true;
          setLoading(false);
          if (FLAGS.DEBUG_AUTH) {
            console.log('[AuthProvider] Loading ended by getSession finally block');
          }
        }
      }
    })();

    // 3) Watchdog timer - force loading=false after configurable timeout
    const watchdog = setTimeout(() => {
      if (!cancelled && !endedRef.current) {
        console.warn(`[AuthProvider] Watchdog: forcing loading=false after ${WATCHDOG_TIMEOUT}ms`);
        endedRef.current = true;
        setLoading(false);
      }
    }, WATCHDOG_TIMEOUT);

    return () => {
      cancelled = true;
      clearTimeout(watchdog);
      unsubRef.current?.();
    };
  }, []);

  // Core auth methods
  const signIn = async (email: string, password: string): Promise<{ user: User | null; error: any }> => {
    try {
      console.log('🔑 [AuthContext] Starting signInWithPassword for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (error) {
        console.error('❌ [AuthContext] signInWithPassword error:', error);
        return { user: null, error };
      }
      
      if (data.user) {
        console.log('✅ [AuthContext] signInWithPassword success for user:', data.user.id);
        
        // Add fallback mechanism - wait for AuthContext state update
        const checkStateUpdate = () => new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            console.warn('⚠️ [AuthContext] State update timeout, forcing manual update');
            setUser(data.user);
            setSession(data.session);
            resolve();
          }, 5000); // 5 second timeout
          
          // Check if state is already updated
          if (user?.id === data.user.id) {
            clearTimeout(timeout);
            resolve();
          } else {
            // Poll for state update
            const interval = setInterval(() => {
              if (user?.id === data.user.id) {
                clearTimeout(timeout);
                clearInterval(interval);
                resolve();
              }
            }, 100);
          }
        });
        
        // Don't await the state check, let it run in background
        checkStateUpdate();
      }
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error('💥 [AuthContext] signIn exception:', error);
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

  const signInWithTelegram = async (authData: any): Promise<{ user: User | null; error: any; telegramData?: any }> => {
    try {
      console.log('🚀 [AuthContext] Starting Telegram authentication:', authData.id);
      
      // Call the telegram-widget-auth Edge Function
      const { data, error } = await supabase.functions.invoke('telegram-widget-auth', {
        body: { authData }
      });

      if (error) {
        console.error('❌ [AuthContext] Telegram Edge Function error:', error);
        throw error;
      }

      if (!data.success) {
        console.error('❌ [AuthContext] Telegram auth failed:', data.error);
        throw new Error(data.error || 'Authentication failed');
      }

      console.log('✅ [AuthContext] Telegram Edge Function success:', { 
        isNewUser: data.is_new_user,
        requiresCompletion: data.requires_profile_completion,
        requiresMerge: data.requires_merge,
        alreadyLinked: data.already_linked
      });

      // Return the response data for the widget to handle UI flows
      return { 
        user: null, 
        error: null,
        telegramData: data
      };
      
    } catch (error) {
      console.error('💥 [AuthContext] Telegram authentication error:', error);
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