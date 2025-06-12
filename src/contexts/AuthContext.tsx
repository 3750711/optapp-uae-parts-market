
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import FirstLoginWelcome from '@/components/auth/FirstLoginWelcome';

type Profile = Database['public']['Tables']['profiles']['Row'];

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Ключи для localStorage
const PROFILE_CACHE_KEY = 'auth_profile_cache';
const PROFILE_CACHE_TIMESTAMP_KEY = 'auth_profile_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [showFirstLoginWelcome, setShowFirstLoginWelcome] = useState(false);
  
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);
  const initTimeoutRef = useRef<NodeJS.Timeout>();

  // Функция для кэширования профиля
  const cacheProfile = useCallback((profileData: Profile) => {
    try {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profileData));
      localStorage.setItem(PROFILE_CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.warn('Failed to cache profile:', error);
    }
  }, []);

  // Функция для получения кэшированного профиля
  const getCachedProfile = useCallback((): Profile | null => {
    try {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY);
      const timestamp = localStorage.getItem(PROFILE_CACHE_TIMESTAMP_KEY);
      
      if (!cached || !timestamp) return null;
      
      const age = Date.now() - parseInt(timestamp);
      if (age > CACHE_DURATION) {
        localStorage.removeItem(PROFILE_CACHE_KEY);
        localStorage.removeItem(PROFILE_CACHE_TIMESTAMP_KEY);
        return null;
      }
      
      return JSON.parse(cached);
    } catch (error) {
      console.warn('Failed to get cached profile:', error);
      return null;
    }
  }, []);

  // Функция для очистки кэша профиля
  const clearProfileCache = useCallback(() => {
    try {
      localStorage.removeItem(PROFILE_CACHE_KEY);
      localStorage.removeItem(PROFILE_CACHE_TIMESTAMP_KEY);
    } catch (error) {
      console.warn('Failed to clear profile cache:', error);
    }
  }, []);

  // Оптимизированная функция загрузки профиля с кэшированием
  const fetchUserProfile = useCallback(async (userId: string, forceRefresh = false) => {
    if (fetchingRef.current || !mountedRef.current) {
      return null;
    }

    // Проверяем кэш, если не принудительное обновление
    if (!forceRefresh) {
      const cachedProfile = getCachedProfile();
      if (cachedProfile && cachedProfile.id === userId) {
        console.log('Using cached profile');
        if (mountedRef.current) {
          setProfile(cachedProfile);
          setIsAdmin(cachedProfile.user_type === 'admin');
        }
        return cachedProfile;
      }
    }

    fetchingRef.current = true;
    console.log('Fetching fresh profile for user:', userId);
    
    try {
      // Оптимизированный запрос - загружаем только необходимые поля
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, user_type, opt_id, verification_status, opt_status, first_login_completed, phone, telegram, location, avatar_url, company_name')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('AuthContext: Error fetching profile:', error);
        
        if (mountedRef.current) {
          setProfile(null);
          setIsAdmin(false);
        }
        return null;
      }
      
      if (data && mountedRef.current) {
        console.log('AuthContext: Profile loaded successfully');
        
        setProfile(data);
        cacheProfile(data); // Кэшируем профиль
        
        const hasAdminAccess = data.user_type === 'admin';
        setIsAdmin(hasAdminAccess);
        
        // Проверяем first login
        if (data.email.endsWith('@g.com') && !data.first_login_completed) {
          setShowFirstLoginWelcome(true);
        }
        
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('AuthContext: Exception while fetching profile:', error);
      
      if (mountedRef.current) {
        setProfile(null);
        setIsAdmin(false);
      }
      return null;
    } finally {
      fetchingRef.current = false;
    }
  }, [getCachedProfile, cacheProfile]);

  const refreshProfile = useCallback(async () => {
    if (user && mountedRef.current) {
      await fetchUserProfile(user.id, true); // Принудительное обновление
    }
  }, [user, fetchUserProfile]);

  const refreshAdminStatus = useCallback(async () => {
    console.log('AuthContext: Manual admin status refresh triggered');
    if (user && mountedRef.current) {
      setIsLoading(true);
      await fetchUserProfile(user.id, true); // Принудительное обновление
      setIsLoading(false);
    }
  }, [user, fetchUserProfile]);

  const handleFirstLoginComplete = useCallback((completed: boolean) => {
    if (completed) {
      setShowFirstLoginWelcome(false);
      refreshProfile();
    }
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    try {
      console.log('AuthContext: Starting sign out');
      await supabase.auth.signOut();
      
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdmin(null);
      setShowFirstLoginWelcome(false);
      setIsLoading(false);
      
      // Очищаем кэш при выходе
      clearProfileCache();
      
      console.log('AuthContext: Sign out completed');
    } catch (error) {
      console.error('AuthContext: Error during sign out:', error);
    }
  }, [clearProfileCache]);

  // Основная логика инициализации auth с уменьшенным timeout
  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;
    
    console.log('AuthContext: Starting auth initialization');
    
    // Уменьшенный timeout до 7 секунд
    initTimeoutRef.current = setTimeout(() => {
      if (mounted && mountedRef.current) {
        console.warn('AuthContext: Initialization timeout reached, forcing isLoading = false');
        setIsLoading(false);
      }
    }, 7000);
    
    const setupAuth = async () => {
      try {
        console.log('AuthContext: Getting current session...');
        
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("AuthContext: Error getting session:", error);
          if (mounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
            setIsAdmin(false);
            setIsLoading(false);
          }
          return;
        }
        
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (currentSession?.user) {
            console.log('AuthContext: User found, fetching profile...');
            await fetchUserProfile(currentSession.user.id);
          } else {
            console.log('AuthContext: No user found');
            setProfile(null);
            setIsAdmin(false);
            clearProfileCache(); // Очищаем кэш если нет пользователя
          }
          
          setIsLoading(false);
          
          if (initTimeoutRef.current) {
            clearTimeout(initTimeoutRef.current);
          }
        }
        
        // Устанавливаем слушатель изменений auth состояния
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            if (!mounted) return;
            
            console.log('AuthContext: Auth state changed:', event);
            
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            
            if (currentSession?.user) {
              await fetchUserProfile(currentSession.user.id);
            } else {
              setProfile(null);
              setIsAdmin(false);
              setShowFirstLoginWelcome(false);
              clearProfileCache();
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("AuthContext: Error setting up auth:", error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    setupAuth();
    
    return () => {
      mounted = false;
      mountedRef.current = false;
      
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [fetchUserProfile, clearProfileCache]);

  // Мемоизируем контекст для предотвращения лишних ре-рендеров
  const contextValue = useMemo(() => ({
    user,
    session,
    profile,
    isLoading,
    isAdmin,
    signOut,
    refreshProfile,
    refreshAdminStatus
  }), [user, session, profile, isLoading, isAdmin, signOut, refreshProfile, refreshAdminStatus]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <FirstLoginWelcome 
        isOpen={showFirstLoginWelcome}
        onClose={handleFirstLoginComplete}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
