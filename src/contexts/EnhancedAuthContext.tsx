import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type UserProfile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  isAdmin: boolean | null;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: any }>;
  signUp: (email: string, password: string, options?: any) => Promise<{ user: User | null; error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  checkTokenValidity: () => Promise<boolean>;
  forceRefreshSession: () => Promise<boolean>;
  signInWithTelegram: (authData: any) => Promise<{ user: User | null; error: any }>;
  refreshAdminStatus: () => Promise<void>;
  retryProfileLoad: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Telemetry system
const logAuthEvent = (event: string, data?: any) => {
  const timestamp = Date.now();
  const logData = { event, timestamp, ...data };
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 Auth Telemetry [${event}]:`, logData);
  }
  
  // В production можно отправлять в Sentry/другую систему
  if (typeof window !== 'undefined') {
    const events = JSON.parse(localStorage.getItem('auth_events') || '[]');
    events.push(logData);
    // Храним только последние 50 событий
    if (events.length > 50) events.splice(0, events.length - 50);
    localStorage.setItem('auth_events', JSON.stringify(events));
  }
};

// BroadcastChannel для координации между вкладками
const authChannel = typeof window !== 'undefined' ? new BroadcastChannel('auth') : null;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const reactInternals = (React as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  if (!reactInternals?.ReactCurrentDispatcher?.current) {
    console.error("❌ AuthContext: React dispatcher is null! Provider called outside React context");
    return <div>Loading...</div>;
  }

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [refreshWarning, setRefreshWarning] = useState<string | null>(null);

  // Рефы для защиты от refresh-циклов и дублей
  const inflightRef = useRef<Promise<void> | null>(null);
  const lastProfileFetchAtRef = useRef<number>(0);
  const refreshCountRef = useRef<number>(0);
  const refreshWindowRef = useRef<number>(Date.now());
  const currentUserIdRef = useRef<string | null>(null);
  const isTabLeaderRef = useRef<boolean>(true);

  const PROFILE_TTL_MS = 2 * 60 * 1000; // 2 минуты
  const REFRESH_CYCLE_LIMIT = 3; // максимум 3 refresh за минуту
  const REFRESH_WINDOW_MS = 60 * 1000; // окно в 1 минуту

  // Инвариант: при смене user.id немедленно сбрасываем profile
  useEffect(() => {
    const newUserId = user?.id || null;
    if (currentUserIdRef.current !== newUserId) {
      if (currentUserIdRef.current !== null && newUserId !== null) {
        logAuthEvent('user_id_change', { 
          from: currentUserIdRef.current, 
          to: newUserId 
        });
        // Критически важно: сброс профиля при смене пользователя
        setProfile(null);
        setProfileError(null);
      }
      currentUserIdRef.current = newUserId;
    }
  }, [user?.id]);

  // Защита от refresh-циклов
  const trackRefreshEvent = () => {
    const now = Date.now();
    
    // Новое окно времени?
    if (now - refreshWindowRef.current > REFRESH_WINDOW_MS) {
      refreshCountRef.current = 0;
      refreshWindowRef.current = now;
    }
    
    refreshCountRef.current++;
    
    if (refreshCountRef.current > REFRESH_CYCLE_LIMIT) {
      const warning = `Обнаружена проблема с сетью или временем устройства. Автообновление приостановлено.`;
      setRefreshWarning(warning);
      logAuthEvent('refresh_loop_warning', { 
        count: refreshCountRef.current,
        timeWindow: REFRESH_WINDOW_MS 
      });
      return false; // Блокируем дальнейшие refresh
    }
    
    return true;
  };

  const isAdmin = React.useMemo<boolean | null>(() => {
    if (profile === null) return null;
    const adminStatus = profile?.user_type === 'admin';
    logAuthEvent('is_admin_change', { 
      isAdmin: adminStatus,
      userId: user?.id 
    });
    return adminStatus;
  }, [profile?.user_type, profile === null, user?.id]);

  // BroadcastChannel listener
  useEffect(() => {
    if (!authChannel) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'PROFILE_UPDATED':
          if (data.userId === user?.id && !isTabLeaderRef.current) {
            // Получаем обновленный профиль от лидер-вкладки
            setProfile(data.profile);
            logAuthEvent('profile_fetch', { 
              source: 'broadcast', 
              userId: data.userId 
            });
          }
          break;
        case 'AUTH_STATE_CHANGE':
          if (data.event === 'SIGNED_OUT') {
            setUser(null);
            setProfile(null);
            setSession(null);
          }
          break;
        case 'LEADER_ELECTION':
          // Простая лидер-выборка: первая вкладка становится лидером
          if (data.timestamp < Date.now() - 1000) {
            isTabLeaderRef.current = false;
          }
          break;
      }
    };

    authChannel.addEventListener('message', handleMessage);
    
    // Объявляем себя лидером при старте
    authChannel.postMessage({
      type: 'LEADER_ELECTION',
      data: { timestamp: Date.now() }
    });

    return () => {
      authChannel.removeEventListener('message', handleMessage);
    };
  }, [user?.id]);

  const fetchUserProfile = async (userId: string, { force = false } = {}): Promise<void> => {
    const startTime = Date.now();
    
    // TTL-кэш проверка
    if (!force && typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(`profile_${userId}`);
      const ts = parseInt(sessionStorage.getItem(`profile_${userId}_time`) || '0', 10);
      if (cached && Date.now() - ts < PROFILE_TTL_MS) {
        try {
          const parsed = JSON.parse(cached);
          setProfile(parsed);
          logAuthEvent('profile_fetch', { 
            source: 'cache', 
            dur_ms: Date.now() - startTime,
            userId 
          });
          return;
        } catch {}
      }
    }

    // Single-flight защита
    if (inflightRef.current) {
      await inflightRef.current;
      return;
    }

    // Если не лидер-вкладка, ждем от лидера (кроме force)
    if (!force && !isTabLeaderRef.current) {
      return;
    }

    setIsProfileLoading(true);
    setProfileError(null);
    lastProfileFetchAtRef.current = Date.now();

    inflightRef.current = (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setProfile(null);
          return;
        }
        throw error;
      }

      setProfile(data);
      
      // Кэширование
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`profile_${userId}`, JSON.stringify(data));
        sessionStorage.setItem(`profile_${userId}_time`, String(Date.now()));
      }

      // Broadcast другим вкладкам
      if (authChannel && isTabLeaderRef.current) {
        authChannel.postMessage({
          type: 'PROFILE_UPDATED',
          data: { userId, profile: data }
        });
      }

      logAuthEvent('profile_fetch', { 
        source: 'network', 
        dur_ms: Date.now() - startTime,
        userId 
      });

    })().catch((err) => {
      setProfile(null);
      setProfileError(err?.message || 'Failed to load profile');
      logAuthEvent('profile_fetch', { 
        source: 'network', 
        error: err?.message,
        dur_ms: Date.now() - startTime,
        userId 
      });
    }).finally(() => {
      setIsProfileLoading(false);
      inflightRef.current = null;
    });

    await inflightRef.current;
  };

  useEffect(() => {
    console.log("🔧 Enhanced AuthContext: useEffect triggered");
    
    const isBfcacheRestore = typeof window !== 'undefined' && 
      (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.type === 'back_forward';

    const checkInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log("🔧 Enhanced AuthContext: Initial session check", {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id
        });
        
        if (error) {
          console.error("❌ Enhanced AuthContext: Session check error:", error);
          throw error;
        }

        if (session?.user) {
          setSession(session);
          setUser(session.user);
          await fetchUserProfile(session.user.id, { force: !isBfcacheRestore });
        } else {
          console.log("🔧 Enhanced AuthContext: No user found, clearing state");
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error("❌ Enhanced AuthContext: Initial session error:", error);
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkInitialSession();

    // Auth state subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔧 Enhanced AuthContext: Auth state change", {
        event,
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id
      });

      // Обработка TOKEN_REFRESHED с защитой от циклов
      if (event === 'TOKEN_REFRESHED') {
        if (!trackRefreshEvent()) {
          return; // Блокируем если превышен лимит
        }
        logAuthEvent('token_refresh', { userId: session?.user?.id });
      }

      setSession(session);

      if (session?.user) {
        setUser(session.user);
        // Не перезапрашиваем профиль на TOKEN_REFRESHED
        if (event !== 'TOKEN_REFRESHED') {
          void fetchUserProfile(session.user.id);
        }
      } else {
        console.log("🔧 Enhanced AuthContext: No user in auth change, clearing state");
        setUser(null);
        setProfile(null);
        setProfileError(null);
        
        // Broadcast logout другим вкладкам
        if (authChannel) {
          authChannel.postMessage({
            type: 'AUTH_STATE_CHANGE',
            data: { event: 'SIGNED_OUT' }
          });
        }
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Visibility change обработка
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && user && isTabLeaderRef.current) {
        const age = Date.now() - lastProfileFetchAtRef.current;
        if (age > PROFILE_TTL_MS) {
          void fetchUserProfile(user.id);
        }
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [user?.id]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      logAuthEvent('sign_in_success', { userId: data.user?.id });
      return { user: data.user, error: null };
    } catch (error) {
      console.error("❌ Enhanced AuthContext: Sign in error:", error);
      logAuthEvent('sign_in_error', { error: (error as Error)?.message });
      return { user: null, error };
    }
  };

  const signUp = async (email: string, password: string, options?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          ...options,
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) throw error;
      
      logAuthEvent('sign_up_success', { userId: data.user?.id });
      return { user: data.user, error: null };
    } catch (error) {
      console.error("❌ Enhanced AuthContext: Sign up error:", error);
      logAuthEvent('sign_up_error', { error: (error as Error)?.message });
      return { user: null, error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      logAuthEvent('sign_out_success');
    } catch (error) {
      console.error("❌ Enhanced AuthContext: Sign out error:", error);
      logAuthEvent('sign_out_error', { error: (error as Error)?.message });
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error("No authenticated user");
    
    try {
      console.log("📝 Enhanced AuthContext: Updating profile for user:", user.id, updates);
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);
      
      if (error) throw error;
      
      console.log("✅ Enhanced AuthContext: Profile updated successfully");
      await refreshProfile();
      logAuthEvent('profile_update_success', { userId: user.id });
    } catch (error) {
      console.error("❌ Enhanced AuthContext: Update profile error:", error);
      logAuthEvent('profile_update_error', { 
        userId: user.id, 
        error: (error as Error)?.message 
      });
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    await fetchUserProfile(user.id, { force: true });
  };

  const sendPasswordResetEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      console.error("❌ Enhanced AuthContext: Password reset error:", error);
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      return { error };
    } catch (error) {
      console.error("❌ Enhanced AuthContext: Update password error:", error);
      return { error };
    }
  };

  const checkTokenValidity = async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      return !error && !!session;
    } catch (error) {
      console.error("❌ Enhanced AuthContext: Token validity check failed:", error);
      return false;
    }
  };

  const forceRefreshSession = async (): Promise<boolean> => {
    try {
      if (!trackRefreshEvent()) {
        return false;
      }
      
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      return !!data.session;
    } catch (error) {
      console.error("❌ Enhanced AuthContext: Session refresh failed:", error);
      return false;
    }
  };

  const signInWithTelegram = async (authData: any): Promise<{ user: User | null; error: any }> => {
    try {
      console.log("📱 Enhanced AuthContext: Telegram auth not implemented yet:", authData);
      return { user: null, error: new Error("Telegram auth not implemented") };
    } catch (error) {
      console.error("❌ Enhanced AuthContext: Telegram sign in error:", error);
      return { user: null, error };
    }
  };

  const refreshAdminStatus = async (): Promise<void> => {
    if (!user) return;
    await fetchUserProfile(user.id, { force: true });
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    isProfileLoading,
    isAdmin,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
    sendPasswordResetEmail,
    updatePassword,
    checkTokenValidity,
    forceRefreshSession,
    signInWithTelegram,
    refreshAdminStatus,
    profileError,
    retryProfileLoad: () => user && fetchUserProfile(user.id, { force: true }),
  };

  // Показываем предупреждение о refresh-циклах если есть
  return (
    <>
      {refreshWarning && (
        <div className="fixed top-0 left-0 right-0 bg-destructive text-destructive-foreground p-2 text-center z-50">
          ⚠️ {refreshWarning}
          <button 
            onClick={() => setRefreshWarning(null)}
            className="ml-4 text-destructive-foreground underline"
          >
            Закрыть
          </button>
        </div>
      )}
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    console.error("❌ useAuth: Hook called outside AuthProvider");
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
};