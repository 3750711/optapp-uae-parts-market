
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
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFirstLoginWelcome, setShowFirstLoginWelcome] = useState(false);
  
  const mountedRef = useRef(true);
  const queryClient = useQueryClient();

  // Простая функция загрузки профиля
  const fetchUserProfile = useCallback(async (userId: string) => {
    if (!mountedRef.current) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Profile fetch error:', error.message);
        
        // Простая обработка JWT ошибок
        if (error.message?.includes('JWT')) {
          await supabase.auth.refreshSession();
          return fetchUserProfile(userId);
        }
        
        if (mountedRef.current) {
          setProfile(null);
        }
        return null;
      }
      
      if (data && mountedRef.current) {
        setProfile(data);
        
        // Проверка первого входа
        if (data.email?.endsWith('@g.com') && !data.first_login_completed) {
          setShowFirstLoginWelcome(true);
        }
        
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Profile fetch exception:', error);
      if (mountedRef.current) {
        setProfile(null);
      }
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user && mountedRef.current) {
      await fetchUserProfile(user.id);
    }
  }, [user, fetchUserProfile]);

  const handleFirstLoginComplete = useCallback((completed: boolean) => {
    if (completed) {
      setShowFirstLoginWelcome(false);
      refreshProfile();
    }
  }, [refreshProfile]);

  // Простая функция выхода
  const signOut = useCallback(async () => {
    try {
      // Очищаем состояние сразу для лучшего UX
      setUser(null);
      setSession(null);
      setProfile(null);
      setShowFirstLoginWelcome(false);
      
      // Очищаем кэш запросов
      queryClient.clear();
      
      // Выходим из Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
      }
      
      // Перенаправляем на главную
      window.location.href = '/';
    } catch (error) {
      console.error('Logout exception:', error);
      // В случае ошибки все равно перенаправляем
      window.location.href = '/';
    }
  }, [queryClient]);

  // Простая инициализация авторизации
  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;
    
    const initAuth = async () => {
      try {
        // Проверяем текущую сессию
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error.message);
        }
        
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (currentSession?.user) {
            fetchUserProfile(currentSession.user.id);
          } else {
            setProfile(null);
          }
          
          setIsLoading(false);
        }
        
        // Устанавливаем слушатель изменений авторизации
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, currentSession) => {
            if (!mounted) return;
            
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            
            if (currentSession?.user) {
              fetchUserProfile(currentSession.user.id);
            } else {
              setProfile(null);
              setShowFirstLoginWelcome(false);
            }
          }
        );

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    initAuth();
    
    return () => {
      mounted = false;
      mountedRef.current = false;
    };
  }, [fetchUserProfile]);

  // Мемоизированное значение контекста
  const contextValue = useMemo(() => ({
    user,
    session,
    profile,
    isLoading,
    signOut,
    refreshProfile
  }), [user, session, profile, isLoading, signOut, refreshProfile]);

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
