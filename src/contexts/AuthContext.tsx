import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getRuntimeSupabaseUrl, getRuntimeAnonKey } from '@/config/runtimeSupabase';
import { checkSessionSoft } from '@/auth/authSessionManager';
import { clearAuthStorageSafe } from '@/auth/clearAuthStorage';
import { useWakeUpHandler } from '@/hooks/useWakeUpHandler';
import { sessionBackupManager } from '@/auth/sessionBackup';
import { authLog, authError, authWarn } from '@/utils/logger';
import { secureRecovery } from '@/utils/secureLogger';
import { refreshSessionOnce } from '@/utils/refreshMutex';
import { FLAGS } from '@/config/flags';
import { logUserLogin, logUserLogout } from '@/utils/activityLoggerStub';

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

// Parse recovery tokens from URL hash or query params
function parseRecoveryTokensFromUrl() {
  try {
    // First try hash parameters (new format)
    const hash = window.location.hash?.substring(1);
    if (hash) {
      const params = new URLSearchParams(hash);
      const type = params.get('type');
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const expiresIn = params.get('expires_in');
      
      if (type === 'recovery' && accessToken && refreshToken) {
        secureRecovery.log('Recovery tokens found in URL hash');
        return {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: expiresIn ? parseInt(expiresIn, 10) : 3600,
          token_type: 'bearer',
          user: null // Will be populated by Supabase
        };
      }
    }
    
    // Then try query parameters (old format from Supabase auth links)
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const token = urlParams.get('token');
    
    if (type === 'recovery' && token) {
      secureRecovery.log('Recovery token found in URL query (old format)');
      // For old format, let Supabase SDK handle the URL automatically
      return 'HANDLE_VIA_SDK';
    }
    
    return null;
  } catch (error) {
    authWarn('Error parsing recovery tokens from URL');
    return null;
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
  isRecoveryMode: boolean;
  
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
  clearRecoveryMode: () => void;
  
  // 🔒 БЕЗОПАСНАЯ функция для смены пароля через recovery токены
  validateRecoveryAndResetPassword: (newPassword: string) => Promise<{ success: boolean; error?: any }>;
  
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
  /** Unified auth status: 'checking' | 'guest' | 'authed' */
  status: 'checking' | 'guest' | 'authed';
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
  // Get query client for cache management
  const queryClient = useQueryClient();
  
  // Check React dispatcher readiness before using any hooks
  const checkDispatcher = () => {
    try {
      const ReactInternals = (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
      const dispatcher = ReactInternals?.ReactCurrentDispatcher?.current;
      if (!dispatcher) {
        console.error('🚨 [AuthProvider] React dispatcher is null');
        return false;
      }
      return true;
    } catch (error) {
      console.error('🚨 [AuthProvider] Error checking React dispatcher:', error);
      return false;
    }
  };

  // Early return if React hooks are not available
  if (!checkDispatcher()) {
    console.error('🚨 [AuthProvider] React hooks unavailable, showing error UI');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-lg p-6 border shadow-sm text-center">
          <h2 className="text-lg font-semibold text-destructive mb-4">
            Ошибка инициализации React
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            React dispatcher не готов. Обновите страницу.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md"
          >
            Обновить страницу
          </button>
        </div>
      </div>
    );
  }

  // If we reach here, React hooks should be working
  console.log('✅ [AuthProvider] React dispatcher ready, initializing hooks');
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // 🔒 Новое состояние для хранения recovery токенов БЕЗ автоматической авторизации
  const [recoveryTokens, setRecoveryTokens] = useState<any>(null);
  // Initialize recovery mode synchronously by checking URL immediately
  const [isRecoveryMode, setIsRecoveryMode] = useState(() => {
    try {
      const tokens = parseRecoveryTokensFromUrl();
      const hasRecoveryTokens = !!tokens;
      if (hasRecoveryTokens) {
        console.log('🔑 [AuthContext] Recovery mode detected synchronously during initialization');
      }
      return hasRecoveryTokens;
    } catch (error) {
      console.warn('[AuthContext] Error during synchronous recovery check:', error);
      return false;
    }
  });
  const unsubRef = useRef<() => void>();
  const endedRef = useRef(false); // Prevent multiple setLoading(false) calls

  // Centralized wake-up handler (only called if hooks are working)
  try {
    useWakeUpHandler();
  } catch (error) {
    console.warn('⚠️ [AuthProvider] useWakeUpHandler failed:', error);
  }

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
    staleTime: 300000, // 5 minutes - critical optimization
    gcTime: 300000, // 5 minutes - reduced to prevent stale data
    refetchOnWindowFocus: false, // CRITICAL: Disabled to prevent excessive requests
    refetchOnReconnect: false, // CRITICAL: Disabled to prevent excessive requests  
    refetchOnMount: false, // Don't refetch if data exists
    networkMode: 'online', // Only fetch when online
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
  
  // Unified status calculation
  const status: 'checking' | 'guest' | 'authed' = 
    loading || (user && profileQuery.isLoading) ? 'checking' :
    user ? 'authed' : 'guest';

  // CRITICAL: Clear profile cache if user disappears (prevents data leaks)
  useEffect(() => {
    if (!user && profileQuery.data) {
      console.warn('🧹 [AuthContext] Clearing stale profile data for missing user');
      queryClient.removeQueries({ queryKey: ['profile'] });
    }
  }, [user, profileQuery, queryClient]);

  // Initialize auth state with improved timeout handling
  useEffect(() => {
    let cancelled = false;
    
    // Read runtime configuration for timeouts
    const RC = (window as any).__PB_RUNTIME__ || {};
    const INIT_TIMEOUT = Number(RC.AUTH_INIT_TIMEOUT_MS ?? 25000);  // Increased for production stability  
    const WATCHDOG_TIMEOUT = Math.max(INIT_TIMEOUT + 5000, 30000);  // More buffer for slow connections

    // 1) Set up auth state subscription FIRST (before getSession)
    unsubRef.current?.();
    const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (cancelled) return;
      
      // 🔍 Enhanced auth event logging for PWA debugging
      if (FLAGS.DEBUG_AUTH) {
        console.debug('[AuthProvider] Auth state changed:', {
          event,
          userId: newSession?.user?.id,
          hasUser: !!newSession?.user,
          hasToken: !!newSession?.access_token,
          expiresAt: newSession?.expires_at,
          timestamp: new Date().toISOString(),
          isVisible: !document.hidden,
          userAgent: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'
        });
      }

      // 🚨 Detect unexpected SIGNED_OUT events for debugging
      if (event === 'SIGNED_OUT' && user && !document.hidden) {
        console.warn('🚨 [AuthProvider] Unexpected SIGNED_OUT while user active:', {
          previousUserId: user.id,
          wasVisible: !document.hidden,
          timestamp: new Date().toISOString()
        });
      }

      // Update session and user state
      setSession(newSession);
      setUser(newSession?.user ?? null);

      // Realtime auth removed - no longer needed
      // if (newSession?.access_token) {
      //   supabase.realtime.setAuth(newSession.access_token);
      // }

      // 📦 Session Backup: Backup session on successful auth events
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        if (newSession) {
          sessionBackupManager.backupSession(newSession);
          if (FLAGS.DEBUG_AUTH) {
            console.debug('[AuthProvider] Session backed up on:', event);
          }
        }
      }

      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        // CRITICAL: Clear profile cache FIRST to prevent data leaks
        queryClient.removeQueries({ queryKey: ['profile'] });
        // Clear recovery mode flag
        setIsRecoveryMode(false);
        // Then clear auth storage and session backup
        clearAuthStorageSafe();
        sessionBackupManager.clearBackup();
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

    // 2) Handle recovery tokens from URL if present
    (async () => {
      try {
        const recoveryTokens = parseRecoveryTokensFromUrl();
        if (recoveryTokens) {
          // Recovery mode already set synchronously during initialization
          secureRecovery.log('Processing recovery tokens (recovery mode already active)');
          
          // Handle old format (query params) - СОХРАНИТЬ информацию БЕЗ автоматической обработки SDK
          if (recoveryTokens === 'HANDLE_VIA_SDK') {
            console.log('🔑 [AuthContext] Detected old format recovery URL - parsing manually for security');
            
            // Получить токены из query параметров для безопасного хранения
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            const type = urlParams.get('type');
            
            if (type === 'recovery' && token) {
              // Создать объект токенов для последующего использования
              const oldFormatTokens = {
                recovery_token: token,
                type: 'recovery'
              };
              setRecoveryTokens(oldFormatTokens);
              secureRecovery.log('Old format recovery tokens stored for secure password reset');
            }
            
            // Очистить URL для безопасности
            if (window.location.search.includes('type=recovery')) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
            
            return;
          }
          
          // Handle new format (hash params) - СОХРАНИТЬ токены БЕЗ установки сессии
          secureRecovery.log('Recovery tokens detected - validation mode only');
          
          // Сохранить токены для валидации, но НЕ устанавливать сессию
          setRecoveryTokens(recoveryTokens);
          
          // Clear URL hash to prevent reprocessing
          if (window.location.hash) {
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          }
          
          // НЕ ВЫЗЫВАЕМ supabase.auth.setSession() - это и есть уязвимость!
          secureRecovery.log('Recovery tokens stored for secure password reset');
          
          return; // Skip normal getSession() call since we handled recovery
        }
        
        // 3) Normal session restore if no recovery tokens
        const startTime = Date.now();
        await withTimeout(supabase.auth.getSession(), INIT_TIMEOUT, 'getSession-timeout');
        
        if (FLAGS.DEBUG_AUTH) {
          console.log('[AuthProvider] getSession completed in', Date.now() - startTime, 'ms');
        }
      } catch (error) {
        console.warn('[AuthProvider] Session initialization failed/timeout:', error);
      } finally {
        // If no auth events came through, end loading anyway
        if (!cancelled && !endedRef.current) {
          endedRef.current = true;
          setLoading(false);
          if (FLAGS.DEBUG_AUTH) {
            console.log('[AuthProvider] Loading ended by session initialization finally block');
          }
        }
      }
    })();

    // 4) Watchdog timer - force loading=false after configurable timeout
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
      // КРИТИЧНО: Добавить проверку и вызов unsubscribe
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = undefined;
      }
    };
  }, []);

  // 🔄 PWA Session Recovery: Handle visibility changes for session validation (UNIFIED)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App going to background - log for debugging
        if (FLAGS.DEBUG_AUTH && user) {
          console.debug('[AuthProvider] App backgrounded, user:', user.id);
        }
        return;
      }

      // App returning from background - validate session
      if (user && session) {
        if (FLAGS.DEBUG_AUTH) {
          console.debug('[AuthProvider] App foregrounded, validating session for user:', user.id);
        }

        // Check if session is still valid
        const sessionCheck = checkSessionSoft(session);
        if (!sessionCheck.ok && sessionCheck.forceLogout) {
          console.warn('🚨 [AuthProvider] Session expired, forcing logout');
          signOut();
          return;
        }

        // Session validation removed - let Supabase SDK manage sessions
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, session]);

  // 🔍 PWA Session Monitoring: Detect and recover lost sessions
  useEffect(() => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window as any).navigator?.standalone === true;
    
    if (!isPWA || !user) return;
    
    let lastActivity = Date.now();
    let lastRateLimit = 0;
    let monitorInterval: any;
    
    // Throttled activity tracking (only update every 5 seconds)
    const updateActivity = () => {
      const now = Date.now();
      if (now - lastActivity > 5000) {
        lastActivity = now;
      }
    };
    
    // Reduced activity events (only 3 most critical)
    const activityEvents = ['mousedown', 'keypress', 'touchstart'];
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
    
    // Session monitoring every 10 minutes with rate limiting
    monitorInterval = setInterval(async () => {
      const now = Date.now();
      
      // Rate limiting: no more than once every 5 minutes
      if (now - lastRateLimit < 5 * 60 * 1000) return;
      lastRateLimit = now;
      
      // Only check if user was recently active (within 30 minutes - increased)
      const inactivePeriod = now - lastActivity;
      if (inactivePeriod > 30 * 60 * 1000) return;
      
      // Monitor for user/session mismatch
      if (user && !session) {
        console.error('🚨 [PWA SESSION MONITOR] User exists but session lost!');
        
        // Try to restore from backup
        const backupSession = sessionBackupManager.restoreSession();
        if (backupSession) {
          console.log('🔄 [PWA SESSION MONITOR] Attempting session restore from backup');
          setSession(backupSession);
          setUser(backupSession.user);
          
          // Validate restored session
          try {
            const { data } = await supabase.auth.getSession();
            if (!data.session) {
              console.warn('🚨 [PWA SESSION MONITOR] Backup restore failed, signing out');
              signOut();
            } else if (FLAGS.DEBUG_AUTH) {
              console.debug('[PWA SESSION MONITOR] Session successfully restored from backup');
            }
          } catch (error) {
            console.warn('[PWA SESSION MONITOR] Session validation failed after restore:', error);
            signOut();
          }
        } else {
          console.warn('🚨 [PWA SESSION MONITOR] No valid backup available, signing out');
          signOut();
        }
        return;
      }
      
      // Proactive token refresh 15 minutes before expiration (increased buffer)
      if (session?.expires_at) {
        const sessionNow = Math.floor(Date.now() / 1000);
        const expiresIn = session.expires_at - sessionNow;
        
        if (expiresIn < 1800 && expiresIn > 0) { // Less than 30 minutes
          if (FLAGS.DEBUG_AUTH) {
            console.debug('[PWA SESSION MONITOR] Token expires in', expiresIn, 'seconds, refreshing proactively');
          }
          
          try {
            // Add 10-second timeout for API calls
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 10000);
            
            await refreshSessionOnce(supabase);
          } catch (error) {
            console.warn('[PWA SESSION MONITOR] Proactive refresh failed:', error);
          }
        }
      }
      
    }, 30 * 60 * 1000); // Every 30 minutes - optimized frequency
    
    return () => {
      clearInterval(monitorInterval);
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, [user, session]);

  // 🏥 Session Recovery: Try to restore session on initialization if needed  
  useEffect(() => {
    const trySessionRestore = async () => {
      // Only try restore if we have no session but should have one
      if (user && !session && !loading) {
        if (FLAGS.DEBUG_AUTH) {
          console.debug('[AuthProvider] Attempting session recovery for user:', user.id);
        }
        
        const backupSession = sessionBackupManager.restoreSession();
        if (backupSession && backupSession.user?.id === user.id) {
          console.log('🔄 [AuthProvider] Restoring session from backup');
          setSession(backupSession);
          
          // Validate the restored session
          try {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
              if (FLAGS.DEBUG_AUTH) {
                console.debug('[AuthProvider] Session restore validated successfully');
              }
            } else {
              console.warn('🚨 [AuthProvider] Session restore validation failed');
              sessionBackupManager.clearBackup();
            }
          } catch (error) {
            console.warn('[AuthProvider] Session restore validation error:', error);
            sessionBackupManager.clearBackup();
          }
        }
      }
    };
    
    // Small delay to ensure auth state is settled
    const timer = setTimeout(trySessionRestore, 500);
    return () => clearTimeout(timer);
  }, [user, session, loading]);

  // Core auth methods
  const signIn = async (email: string, password: string): Promise<{ user: User | null; error: any }> => {
    try {
      authLog('Starting signInWithPassword', { email });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (error) {
        authError('signInWithPassword failed', error);
        return { user: null, error };
      }
      
      if (data.user) {
        authLog('signInWithPassword success', { userId: data.user.id });
        
        // Log successful login activity
        try {
          await logUserLogin('email', data.user.id);
        } catch (error) {
          console.warn('Failed to log login activity:', error);
        }
        
        // Улучшенный механизм ожидания обновления состояния
        const waitForStateUpdate = () => new Promise<void>((resolve) => {
          const MAX_WAIT_TIME = 5000; // 5 секунд максимум
          const CHECK_INTERVAL = 100; // Проверка каждые 100ms
          const startTime = Date.now();
          
          const checkState = () => {
            // Проверяем обновилось ли состояние
            if (user?.id === data.user.id) {
              console.log('✅ [AuthContext] State updated successfully');
              resolve();
              return;
            }
            
            // Проверяем таймаут
            if (Date.now() - startTime > MAX_WAIT_TIME) {
              console.warn('⚠️ [AuthContext] State update timeout, forcing update');
              setUser(data.user);
              setSession(data.session);
              resolve();
              return;
            }
            
            // Продолжаем проверку
            setTimeout(checkState, CHECK_INTERVAL);
          };
          
          // Начинаем проверку
          checkState();
        });
        
        // Ждем обновления состояния
        await waitForStateUpdate();
      }
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error('💥 [AuthContext] signIn exception:', error);
      return { user: null, error };
    }
  };

  const signOut = async () => {
    // Log logout activity before signing out
    try {
      await logUserLogout(user?.id);
    } catch (error) {
      console.warn('Failed to log logout activity:', error);
    }
    
    // Очищаем кэш профиля перед выходом
    queryClient.removeQueries({ queryKey: ['profile'] });
    
    // Затем выполняем logout
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
      const { data, error } = await supabase.functions.invoke('send-reset-email', {
        body: { email }
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (!error) {
        // Clear recovery mode flag after successful password update
        setIsRecoveryMode(false);
        secureRecovery.log('Recovery mode cleared after password update');
      }
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

  const clearRecoveryMode = () => {
    console.log('🔄 [AuthContext] Clearing recovery mode');
    setIsRecoveryMode(false);
    setRecoveryTokens(null);
  };

  // 🔒 БЕЗОПАСНАЯ функция смены пароля через recovery токены
  const validateRecoveryAndResetPassword = async (newPassword: string) => {
    if (!recoveryTokens || !isRecoveryMode) {
      return { success: false, error: new Error('No valid recovery session') };
    }
    
    try {
      secureRecovery.log('Validating recovery tokens and resetting password');
      
      // Проверяем тип токенов (новый hash формат vs старый query формат)
      if (recoveryTokens.access_token && recoveryTokens.refresh_token) {
        // Новый формат (hash параметры) - КРИТИЧНО: НЕ создаем сессию в приложении!
        secureRecovery.log('Using isolated client for password reset');

        // Создаем временный клиент который НЕ будет обновлять состояние приложения
        const tempClient = createClient(
          getRuntimeSupabaseUrl() || 'https://api.partsbay.ae',
          getRuntimeAnonKey() || supabase.auth.anonKey,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
              detectSessionInUrl: false,
              storage: {
                // Пустой storage чтобы не сохранять сессию
                getItem: () => null,
                setItem: () => {},
                removeItem: () => {}
              }
            }
          }
        );

        // Устанавливаем сессию ТОЛЬКО во временном клиенте
        const { data: sessionData, error: sessionError } = 
          await tempClient.auth.setSession({
            access_token: recoveryTokens.access_token,
            refresh_token: recoveryTokens.refresh_token
          });

        if (sessionError || !sessionData.session) {
          secureRecovery.error('Failed to validate recovery tokens', sessionError);
          return { 
            success: false, 
            error: sessionError || new Error('Invalid recovery tokens') 
          };
        }

        // Меняем пароль через временный клиент
        const { error: updateError } = await tempClient.auth.updateUser({
          password: newPassword
        });

        if (updateError) {
          secureRecovery.error('Password update failed', updateError);
          return { success: false, error: updateError };
        }

        secureRecovery.log('Password updated via isolated client - no session created in main app');
        
      } else if (recoveryTokens.recovery_token) {
        // Старый формат (query параметры) - также используем изолированный клиент
        secureRecovery.log('Using isolated client for old format recovery token');
        
        // Создаем временный клиент для старого формата токенов
        const tempClient = createClient(
          getRuntimeSupabaseUrl() || 'https://api.partsbay.ae',
          getRuntimeAnonKey() || supabase.auth.anonKey,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
              detectSessionInUrl: false,
              storage: {
                // Пустой storage чтобы не сохранять сессию
                getItem: () => null,
                setItem: () => {},
                removeItem: () => {}
              }
            }
          }
        );

        // Верифицируем recovery токен через временный клиент
        const { data: verifyData, error: verifyError } = await tempClient.auth.verifyOtp({
          token_hash: recoveryTokens.recovery_token,
          type: 'recovery'
        });

        if (verifyError || !verifyData.session) {
          secureRecovery.error('Recovery token verification failed', verifyError);
          return { success: false, error: verifyError || new Error('Invalid recovery token') };
        }

        // Меняем пароль через временный клиент
        const { error: updateError } = await tempClient.auth.updateUser({
          password: newPassword
        });

        if (updateError) {
          secureRecovery.error('Password update failed', updateError);
          return { success: false, error: updateError };
        }
        
        secureRecovery.log('Password updated via isolated client for old format token');
        
      } else {
        return { success: false, error: new Error('Unknown recovery token format') };
      }
      
      // НЕ вызываем signOut() - пользователь никогда не был авторизован в приложении!
      
      // Очистить recovery состояние
      setIsRecoveryMode(false);
      setRecoveryTokens(null);
      
      secureRecovery.log('Password reset successful - user must login with new password');
      return { success: true };
      
    } catch (error) {
      secureRecovery.error('Recovery password reset error', error);
      return { success: false, error };
    }
  };

  const value = useMemo<AuthContextType>(() => ({
    // Core unified state
    user, 
    session, 
    loading,
    profile,
    isAdmin,
    isCheckingAdmin,
    isRecoveryMode,
    
    // Core methods
    signIn, 
    signOut,
    signUp,
    updateProfile,
    sendPasswordResetEmail,
    updatePassword,
    signInWithTelegram,
    completeFirstLogin,
    clearRecoveryMode,
    validateRecoveryAndResetPassword,
    
    // Legacy properties for backward compatibility
    isLoading: loading || isCheckingAdmin,
    isProfileLoading: isCheckingAdmin,
    profileError: null,
    authError: null,
    needsFirstLoginCompletion: false,
    status,
    refreshProfile,
    retryProfileLoad,
    clearAuthError,
    forceReauth,
    runDiagnostic
  }), [user, session, loading, profile, isAdmin, isCheckingAdmin, isRecoveryMode]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}