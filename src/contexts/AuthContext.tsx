import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { handleAuthErrorSoftly, createExponentialBackoff } from "@/utils/authErrorHandler";

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
  refreshProfile: (forceRefresh?: boolean) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  checkTokenValidity: () => Promise<boolean>;
  forceRefreshSession: () => Promise<boolean>;
  signInWithTelegram: (authData: any) => Promise<{ user: User | null; error: any }>;
  refreshAdminStatus: () => Promise<void>;
  retryProfileLoad: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Проверка React dispatcher перед использованием хуков
  const reactInternals = (React as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  if (!reactInternals?.ReactCurrentDispatcher?.current) {
    console.error("❌ AuthContext: React dispatcher is null! Provider called outside React context");
    // Возвращаем fallback компонент
    return <div>Loading...</div>;
  }

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [hydrating, setHydrating] = useState(true);
  
  // Performance optimization: cache profile data and debounce requests
  const profileCacheRef = useRef<{ data: UserProfile | null; timestamp: number; ttl: number }>({
    data: null,
    timestamp: 0,
    ttl: 5 * 60 * 1000 // 5 minutes cache
  });
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const retryConfig = createExponentialBackoff(3, 1000);

  // Single-flight для профиля: исключаем конкурирующие запросы
  const inflightRef = React.useRef<Promise<void> | null>(null);
  const lastProfileFetchAtRef = React.useRef<number>(0);
  const PROFILE_TTL_MS = 2 * 60 * 1000; // 2 минуты

  // isAdmin зависит только от текущего профиля (стабильное значение)
  const isAdmin = React.useMemo<boolean | null>(() => {
    if (profile === null) return null;              // профиль ещё не получен
    return profile?.user_type === 'admin';
  }, [profile?.user_type, profile === null]);

  const fetchUserProfile = async (userId: string, { force = false } = {}): Promise<void> => {
    // Check cache first
    const now = Date.now();
    const cache = profileCacheRef.current;
    if (!force && cache.data && cache.timestamp + cache.ttl > now) {
      console.log('🔄 AuthContext: Using cached profile data');
      setProfile(cache.data);
      return;
    }

    // TTL-кэш из sessionStorage (как было)
    if (!force && typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(`profile_${userId}`);
      const ts = parseInt(sessionStorage.getItem(`profile_${userId}_time`) || '0', 10);
      if (cached && Date.now() - ts < PROFILE_TTL_MS) {
        try {
          const parsed = JSON.parse(cached);
          setProfile(parsed);
          // Update memory cache
          profileCacheRef.current = { data: parsed, timestamp: now, ttl: cache.ttl };
          return;
        } catch {}
      }
    }

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Против дублей: если уже идёт запрос — ждём его
    if (inflightRef.current) {
      await inflightRef.current; 
      return;
    }

    setIsProfileLoading(true);
    setProfileError(null);
    lastProfileFetchAtRef.current = Date.now();

    inflightRef.current = (async () => {
      let attempts = 0;
      while (attempts < 3) {
        try {
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
            
            // Use improved error handling
            if (!handleAuthErrorSoftly(error, 'profile_fetch')) {
              throw error;
            }
            
            attempts++;
            if (attempts < 3) {
              const delay = retryConfig.getDelay(attempts - 1);
              console.log(`🔄 AuthContext: Retrying profile fetch in ${delay}ms (attempt ${attempts}/3)`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            throw error;
          }

          console.log('✅ AuthContext: Profile fetched successfully');
          setProfile(data);
          
          // Update both caches
          profileCacheRef.current = { data, timestamp: now, ttl: cache.ttl };
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`profile_${userId}`, JSON.stringify(data));
            sessionStorage.setItem(`profile_${userId}_time`, String(Date.now()));
          }
          return;
        } catch (err) {
          if (attempts >= 3) {
            throw err;
          }
          attempts++;
        }
      }
    })().catch((err) => {
      if (!handleAuthErrorSoftly(err, 'profile_fetch_final')) {
        setProfile(null);
        setProfileError(err?.message || 'Failed to load profile');
      }
    }).finally(() => {
      setIsProfileLoading(false);
      inflightRef.current = null;
    });

    await inflightRef.current;
  };

  useEffect(() => {
    console.log("🔧 AuthContext: useEffect triggered");
    
    // Проверяем восстановление из bfcache
    const isBfcacheRestore = typeof window !== 'undefined' && 
      (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.type === 'back_forward';

    // Проверяем начальную сессию
    const checkInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log("🔧 AuthContext: Initial session check", {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id
        });
        
        if (error) {
          console.error("❌ AuthContext: Session check error:", error);
          throw error;
        }

        if (session?.user) {
          setSession(session);
          setUser(session.user);
          // При bfcache восстановлении не перезапрашиваем профиль сразу
          await fetchUserProfile(session.user.id, { force: !isBfcacheRestore });
        } else {
          console.log("🔧 AuthContext: No user found, clearing state");
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error("❌ AuthContext: Initial session error:", error);
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        setIsLoading(false);
        setHydrating(false);
      }
    };

    checkInitialSession();

    // Подписка на изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔧 AuthContext: Auth state change", {
        event,
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id
      });

      setSession(session);

      if (session?.user) {
        setUser(session.user);
        // Не дёргаем профиль на TOKEN_REFRESHED — используем текущий
        if (event !== 'TOKEN_REFRESHED') {
          void fetchUserProfile(session.user.id);
        }
      } else {
        console.log("🔧 AuthContext: No user in auth change, clearing state");
        setUser(null);
        setProfile(null);
        setProfileError(null);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Лёгкая фоновая актуализация профиля на возврате вкладки
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && user) {
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
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error("❌ AuthContext: Sign in error:", error);
      return { user: null, error };
    }
  };

  const signUp = async (email: string, password: string, options?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options,
      });
      
      if (error) throw error;
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error("❌ AuthContext: Sign up error:", error);
      return { user: null, error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (error) {
      console.error("❌ AuthContext: Sign out error:", error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error("No authenticated user");
    
    try {
      console.log("📝 AuthContext: Updating profile for user:", user.id, updates);
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);
      
      if (error) throw error;
      
      console.log("✅ AuthContext: Profile updated successfully");
      await refreshProfile();
    } catch (error) {
      console.error("❌ AuthContext: Update profile error:", error);
      throw error;
    }
  };

  const refreshProfile = useCallback(async (forceRefresh = false) => {
    if (!user?.id) return;
    await fetchUserProfile(user.id, { force: forceRefresh });
  }, [user?.id]);

  const sendPasswordResetEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      console.error("❌ AuthContext: Password reset error:", error);
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      return { error };
    } catch (error) {
      console.error("❌ AuthContext: Update password error:", error);
      return { error };
    }
  };

  const checkTokenValidity = async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      return !error && !!session;
    } catch (error) {
      console.error("❌ AuthContext: Token validity check failed:", error);
      return false;
    }
  };

  const forceRefreshSession = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      return !!data.session;
    } catch (error) {
      console.error("❌ AuthContext: Session refresh failed:", error);
      return false;
    }
  };

  const signInWithTelegram = async (authData: any): Promise<{ user: User | null; error: any }> => {
    try {
      // Заглушка для Telegram авторизации - будет реализована позже
      console.log("📱 AuthContext: Telegram auth not implemented yet:", authData);
      return { user: null, error: new Error("Telegram auth not implemented") };
    } catch (error) {
      console.error("❌ AuthContext: Telegram sign in error:", error);
      return { user: null, error };
    }
  };

  const refreshAdminStatus = async (): Promise<void> => {
    if (!user) return;
    // Форс-обновление (ручной вызов, без таймеров)
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    console.error("❌ useAuth: Hook called outside AuthProvider");
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
};
