
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import FirstLoginWelcome from '@/components/auth/FirstLoginWelcome';
import { useQuery } from '@tanstack/react-query';

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
  const [isLoading, setIsLoading] = useState(true);
  const [showFirstLoginWelcome, setShowFirstLoginWelcome] = useState(false);
  
  const mountedRef = useRef(true);

  // Используем React Query для кэширования профиля
  const { 
    data: profile, 
    isLoading: profileLoading, 
    refetch: refetchProfile 
  } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error || !data) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      // Проверяем first login для пользователей @g.com
      if (data.email.endsWith('@g.com') && !data.first_login_completed) {
        setShowFirstLoginWelcome(true);
      }
      
      return data;
    },
    enabled: !!user?.id && mountedRef.current,
    staleTime: 1000 * 60 * 5, // 5 минут кэш
    gcTime: 1000 * 60 * 10, // 10 минут в памяти
  });

  // Вычисляем админские права напрямую из профиля
  const isAdmin = useMemo(() => {
    return profile?.user_type === 'admin' ? true : false;
  }, [profile?.user_type]);

  const refreshProfile = useCallback(async () => {
    if (user && mountedRef.current) {
      await refetchProfile();
    }
  }, [user, refetchProfile]);

  const refreshAdminStatus = useCallback(async () => {
    // Просто перезагружаем профиль
    await refreshProfile();
  }, [refreshProfile]);

  const handleFirstLoginComplete = useCallback((completed: boolean) => {
    if (completed) {
      setShowFirstLoginWelcome(false);
      refreshProfile();
    }
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    
    try {
      await supabase.auth.signOut();
      
      setUser(null);
      setSession(null);
      setShowFirstLoginWelcome(false);
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Упрощенная инициализация авторизации
  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;
    
    const setupAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error || !mounted) {
          console.error("Error getting session:", error);
          if (mounted) setIsLoading(false);
          return;
        }
        
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setIsLoading(false);
        }
        
        // Устанавливаем listener для изменений авторизации
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            if (!mounted) return;
            
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            
            if (!currentSession?.user) {
              setShowFirstLoginWelcome(false);
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error setting up auth:", error);
        if (mounted) setIsLoading(false);
      }
    };
    
    setupAuth();
    
    return () => {
      mounted = false;
      mountedRef.current = false;
    };
  }, []);

  // Общее состояние загрузки - только при первичной инициализации
  const totalLoading = isLoading;

  const contextValue = useMemo(() => ({
    user,
    session,
    profile: profile || null,
    isLoading: totalLoading,
    isAdmin,
    signOut,
    refreshProfile,
    refreshAdminStatus
  }), [user, session, profile, totalLoading, isAdmin, signOut, refreshProfile, refreshAdminStatus]);

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
