
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import FirstLoginWelcome from '@/components/auth/FirstLoginWelcome';
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [showFirstLoginWelcome, setShowFirstLoginWelcome] = useState(false);
  
  const mountedRef = useRef(true);
  const initTimeoutRef = useRef<NodeJS.Timeout>();
  const queryClient = useQueryClient();

  // Упрощенная функция загрузки профиля
  const fetchUserProfile = useCallback(async (userId: string) => {
    if (!mountedRef.current) return null;

    try {
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
        
        // Простая проверка админских прав
        const hasAdminAccess = data.user_type === 'admin';
        setIsAdmin(hasAdminAccess);
        
        // Предзагружаем данные для админов с задержкой
        if (hasAdminAccess) {
          setTimeout(() => {
            preloadAdminData();
          }, 1000);
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
    }
  }, []);

  // Предзагрузка админских данных
  const preloadAdminData = useCallback(async () => {
    try {
      // Проверяем, есть ли уже данные в кэше
      const cachedData = queryClient.getQueryData(['admin', 'add-product-data']);
      if (cachedData) {
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
    } catch (error) {
      console.warn('Failed to preload admin data:', error);
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
      await fetchUserProfile(user.id);
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
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  }, []);

  // Упрощенная инициализация auth с увеличенным timeout до 5 секунд
  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;
    
    // Увеличенный timeout до 5 секунд для медленных соединений
    initTimeoutRef.current = setTimeout(() => {
      if (mounted && mountedRef.current) {
        console.warn('Auth initialization timeout reached (5s)');
        setIsLoading(false);
      }
    }, 5000);
    
    const setupAuth = async () => {
      try {
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
            await fetchUserProfile(currentSession.user.id);
          } else {
            setProfile(null);
            setIsAdmin(false);
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
