
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import FirstLoginWelcome from '@/components/auth/FirstLoginWelcome';
import { getCachedAdminRights, setCachedAdminRights, clearAdminCache } from '@/utils/performanceUtils';
import { useQueryClient } from '@tanstack/react-query';

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
const CACHE_DURATION = 5 * 60 * 1000; // Уменьшили до 5 минут

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
  const queryClient = useQueryClient();

  // Быстрая проверка из localStorage при инициализации
  const quickCheckFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY);
      const timestamp = localStorage.getItem(PROFILE_CACHE_TIMESTAMP_KEY);
      
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < CACHE_DURATION) {
          const profileData = JSON.parse(cached);
          const adminRights = getCachedAdminRights(profileData.id);
          
          if (adminRights !== null) {
            setProfile(profileData);
            setIsAdmin(adminRights);
            return true; // Данные найдены в кэше
          }
        }
      }
    } catch (error) {
      console.warn('Failed to quick check cache:', error);
    }
    return false;
  }, []);

  // Функция для кэширования профиля
  const cacheProfile = useCallback((profileData: Profile) => {
    try {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profileData));
      localStorage.setItem(PROFILE_CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.warn('Failed to cache profile:', error);
    }
  }, []);

  // Функция для очистки кэша профиля
  const clearProfileCache = useCallback(() => {
    try {
      localStorage.removeItem(PROFILE_CACHE_KEY);
      localStorage.removeItem(PROFILE_CACHE_TIMESTAMP_KEY);
      clearAdminCache();
    } catch (error) {
      console.warn('Failed to clear profile cache:', error);
    }
  }, []);

  // Оптимизированная функция проверки админ прав
  const checkAdminRights = useCallback((userId: string, userType: string): boolean | null => {
    // Сначала проверяем кэш
    const cachedRights = getCachedAdminRights(userId);
    if (cachedRights !== null) {
      return cachedRights;
    }
    
    // Проверяем по типу пользователя
    const hasAdminAccess = userType === 'admin';
    
    // Кэшируем результат
    setCachedAdminRights(userId, hasAdminAccess);
    
    return hasAdminAccess;
  }, []);

  // Предзагрузка данных для админ панели
  const preloadAdminData = useCallback(async () => {
    try {
      console.log('🔄 Preloading admin add product data...');
      
      // Проверяем, есть ли уже данные в кэше
      const cachedData = queryClient.getQueryData(['admin', 'add-product-data']);
      if (cachedData) {
        console.log('✅ Admin add product data already cached');
        return;
      }

      // Предзагружаем данные
      await queryClient.prefetchQuery({
        queryKey: ['admin', 'add-product-data'],
        queryFn: async () => {
          const { data, error } = await supabase.rpc('get_admin_add_product_data');
          if (error) throw error;
          return data;
        },
        staleTime: 1000 * 60 * 15, // 15 минут
      });

      console.log('✅ Admin add product data preloaded');
    } catch (error) {
      console.warn('⚠️ Failed to preload admin add product data:', error);
    }
  }, [queryClient]);

  // Оптимизированная функция загрузки профиля
  const fetchUserProfile = useCallback(async (userId: string, forceRefresh = false) => {
    if (fetchingRef.current || !mountedRef.current) {
      return null;
    }

    fetchingRef.current = true;
    
    try {
      // Оптимизированный запрос - только необходимые поля
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, user_type, opt_id, verification_status, opt_status, first_login_completed, phone, telegram, location, avatar_url, company_name')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        if (mountedRef.current) {
          setProfile(null);
          setIsAdmin(false);
        }
        return null;
      }
      
      if (data && mountedRef.current) {
        setProfile(data);
        cacheProfile(data);
        
        // Проверяем админские права
        const hasAdminAccess = checkAdminRights(data.id, data.user_type);
        setIsAdmin(hasAdminAccess);
        
        // Предзагружаем данные для админ панели, если пользователь админ
        if (hasAdminAccess) {
          // Предзагружаем с небольшой задержкой, чтобы не блокировать основную загрузку
          setTimeout(preloadAdminData, 1000);
        }
        
        // Проверяем first login
        if (data.email.endsWith('@g.com') && !data.first_login_completed) {
          setShowFirstLoginWelcome(true);
        }
        
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Exception while fetching profile:', error);
      if (mountedRef.current) {
        setProfile(null);
        setIsAdmin(false);
      }
      return null;
    } finally {
      fetchingRef.current = false;
    }
  }, [cacheProfile, checkAdminRights, preloadAdminData]);

  const refreshProfile = useCallback(async () => {
    if (user && mountedRef.current) {
      await fetchUserProfile(user.id, true);
    }
  }, [user, fetchUserProfile]);

  const refreshAdminStatus = useCallback(async () => {
    if (user && mountedRef.current) {
      setIsLoading(true);
      clearAdminCache();
      await fetchUserProfile(user.id, true);
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
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdmin(null);
      setShowFirstLoginWelcome(false);
      setIsLoading(false);
      clearProfileCache();
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  }, [clearProfileCache]);

  // Основная логика инициализации auth с уменьшенным timeout
  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;
    
    // Уменьшенный timeout до 2 секунд
    initTimeoutRef.current = setTimeout(() => {
      if (mounted && mountedRef.current) {
        console.warn('Auth initialization timeout reached');
        setIsLoading(false);
      }
    }, 2000);
    
    const setupAuth = async () => {
      try {
        // Быстрая проверка кэша
        const cachedDataFound = quickCheckFromCache();
        
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
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
            // Если нет кэшированных данных, загружаем профиль
            if (!cachedDataFound) {
              await fetchUserProfile(currentSession.user.id);
            }
          } else {
            setProfile(null);
            setIsAdmin(false);
            clearProfileCache();
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
        console.error("Error setting up auth:", error);
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
  }, [fetchUserProfile, clearProfileCache, quickCheckFromCache]);

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
