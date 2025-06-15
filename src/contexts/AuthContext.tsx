import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import FirstLoginWelcome from '@/components/auth/FirstLoginWelcome';
import { useQueryClient } from '@tanstack/react-query';
import { getCachedAdminRights, setCachedAdminRights } from '@/utils/performanceUtils';
import { devLog, devError, prodError } from '@/utils/logger';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [showFirstLoginWelcome, setShowFirstLoginWelcome] = useState(false);
  
  const mountedRef = useRef(true);
  const queryClient = useQueryClient();

  // Улучшенная функция загрузки профиля
  const fetchUserProfile = useCallback(async (userId: string) => {
    if (!mountedRef.current) return null;

    try {
      devLog('📥 Fetching user profile for:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        prodError(new Error('Error fetching profile'), { userId, error: error.message });
        
        // Если ошибка связана с JWT, попробуем обновить сессию
        if (error.message?.includes('JWT')) {
          devLog('🔄 JWT error detected, refreshing session...');
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError && mountedRef.current) {
            // Повторная попытка загрузки профиля
            return fetchUserProfile(userId);
          }
        }
        
        if (mountedRef.current) {
          setProfile(null);
          setIsAdmin(false);
          setCachedAdminRights(userId, false);
        }
        return null;
      }
      
      if (data && mountedRef.current) {
        devLog('✅ Profile loaded successfully:', {
          email: data.email,
          userType: data.user_type,
          verificationStatus: data.verification_status
        });
        setProfile(data);
        
        // Проверяем админские права напрямую из профиля
        const hasAdminAccess = data.user_type === 'admin';
        setCachedAdminRights(userId, hasAdminAccess);
        
        if (mountedRef.current) {
          setIsAdmin(hasAdminAccess);
          
          // Предзагружаем данные для админов
          if (hasAdminAccess) {
            setTimeout(() => {
              preloadAdminData();
            }, 1000);
          }
          
          // Проверяем first login
          if (data.email?.endsWith('@g.com') && !data.first_login_completed) {
            setShowFirstLoginWelcome(true);
          }
        }
        
        return data;
      }
      
      return null;
    } catch (error) {
      prodError(new Error('Exception while fetching profile'), { userId, error });
      if (mountedRef.current) {
        setProfile(null);
        setIsAdmin(false);
        setCachedAdminRights(userId, false);
      }
      return null;
    }
  }, []);

  // Предзагрузка админских данных
  const preloadAdminData = useCallback(async () => {
    try {
      devLog('🚀 Preloading admin data...');
      
      // Проверяем, есть ли уже данные в кэше
      const cachedMetrics = queryClient.getQueryData(['admin', 'metrics-optimized']);
      const cachedProductData = queryClient.getQueryData(['admin', 'add-product-data']);
      
      if (cachedMetrics && cachedProductData) {
        devLog('✅ Admin data already cached');
        return;
      }

      // Предзагружаем метрики
      if (!cachedMetrics) {
        await queryClient.prefetchQuery({
          queryKey: ['admin', 'metrics-optimized'],
          queryFn: async () => {
            const { data, error } = await supabase.rpc('get_admin_metrics');
            if (error) throw error;
            return data;
          },
          staleTime: 1000 * 60 * 5, // 5 минут
        });
      }

      // Предзагружаем данные для добавления продуктов
      if (!cachedProductData) {
        await queryClient.prefetchQuery({
          queryKey: ['admin', 'add-product-data'],
          queryFn: async () => {
            const { data, error } = await supabase.rpc('get_admin_add_product_data');
            if (error) throw error;
            return data;
          },
          staleTime: 1000 * 60 * 15, // 15 минут
        });
      }
      
      devLog('✅ Admin data preloaded successfully');
    } catch (error) {
      devError('⚠️ Failed to preload admin data:', error);
    }
  }, [queryClient]);

  const refreshProfile = useCallback(async () => {
    if (user && mountedRef.current) {
      await fetchUserProfile(user.id);
    }
  }, [user, fetchUserProfile]);

  const refreshAdminStatus = useCallback(async () => {
    if (user && mountedRef.current) {
      setIsLoading(true);
      await refreshProfile();
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user, refreshProfile]);

  const handleFirstLoginComplete = useCallback((completed: boolean) => {
    if (completed) {
      setShowFirstLoginWelcome(false);
      refreshProfile();
    }
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    try {
      devLog('👋 Signing out user...');
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdmin(null);
      setShowFirstLoginWelcome(false);
      setIsLoading(false);
      
      // Очищаем кэш при выходе
      queryClient.clear();
      devLog('✅ User signed out successfully');
    } catch (error) {
      prodError(new Error('Error during sign out'), { error });
    }
  }, [queryClient]);

  // Улучшенная инициализация auth
  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;
    
    const setupAuth = async () => {
      try {
        devLog('🔑 Setting up auth...');
        
        // Получаем текущую сессию
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        devLog('🔐 Session check result:', {
          hasSession: !!currentSession,
          userId: currentSession?.user?.id,
          userEmail: currentSession?.user?.email,
          accessToken: currentSession?.access_token ? 'present' : 'missing',
          error: error?.message
        });
        
        if (error) {
          prodError(new Error("Error getting session"), { error: error.message });
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
            await fetchUserProfile(currentSession.user.id);
          } else {
            setProfile(null);
            setIsAdmin(false);
          }
          
          setIsLoading(false);
        }
        
        // Устанавливаем слушатель изменений auth состояния
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            if (!mounted) return;
            
            devLog('🔄 Auth state changed:', {
              event,
              hasSession: !!currentSession,
              userId: currentSession?.user?.id
            });
            
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            
            if (currentSession?.user) {
              await fetchUserProfile(currentSession.user.id);
            } else {
              setProfile(null);
              setIsAdmin(false);
              setShowFirstLoginWelcome(false);
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        prodError(new Error("Error setting up auth"), { error });
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    setupAuth();
    
    return () => {
      mounted = false;
      mountedRef.current = false;
    };
  }, [fetchUserProfile]);

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
