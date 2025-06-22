
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
  forceAuthReinit: () => Promise<void>;
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

  // Упрощенная функция загрузки профиля
  const fetchUserProfile = useCallback(async (userId: string) => {
    if (!mountedRef.current) return null;

    console.log('🔄 Fetching profile for user:', userId);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('❌ Profile fetch error:', error.message);
        
        // Упрощенная обработка JWT ошибок
        if (error.message?.includes('JWT')) {
          console.log('🔄 JWT error detected, refreshing session...');
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError && mountedRef.current) {
            console.log('✅ Session refreshed, retrying profile fetch...');
            return fetchUserProfile(userId);
          }
        }
        
        if (mountedRef.current) {
          setProfile(null);
          setIsAdmin(false);
        }
        return null;
      }
      
      if (data && mountedRef.current) {
        console.log('✅ Profile loaded successfully:', {
          email: data.email,
          userType: data.user_type,
          verificationStatus: data.verification_status
        });
        
        setProfile(data);
        
        // Упрощенная проверка админских прав
        const hasAdminAccess = data.user_type === 'admin';
        setIsAdmin(hasAdminAccess);
        
        // Проверка первого входа
        if (data.email?.endsWith('@g.com') && !data.first_login_completed) {
          console.log('👋 First login detected, showing welcome...');
          setShowFirstLoginWelcome(true);
        }
        
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('💥 Profile fetch exception:', error);
      
      if (mountedRef.current) {
        setProfile(null);
        setIsAdmin(false);
      }
      return null;
    }
  }, []);

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

  const forceAuthReinit = useCallback(async () => {
    console.log('🔄 Force auth reinitialize requested...');
    
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Force reinit session error:', error);
        return;
      }
      
      if (currentSession?.user && mountedRef.current) {
        console.log('✅ Force reinit found session, updating state...');
        setSession(currentSession);
        setUser(currentSession.user);
        await fetchUserProfile(currentSession.user.id);
      }
    } catch (error) {
      console.error('💥 Force auth reinit error:', error);
    }
  }, [fetchUserProfile]);

  const handleFirstLoginComplete = useCallback((completed: boolean) => {
    if (completed) {
      setShowFirstLoginWelcome(false);
      refreshProfile();
    }
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    try {
      console.log('🚀 Starting logout...');
      await supabase.auth.signOut();
    } catch (error) {
      console.error('💥 Error during logout:', error);
    }
  }, []);

  // Упрощенная инициализация без избыточных timeout'ов
  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;
    
    const setupAuth = async () => {
      try {
        console.log('🔑 Starting auth setup...');
        
        // Получаем текущую сессию
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session check error:', error.message);
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
            console.log('👤 User found, fetching profile...');
            await fetchUserProfile(currentSession.user.id);
          } else {
            console.log('👤 No user session, setting defaults...');
            setProfile(null);
            setIsAdmin(false);
          }
          
          setIsLoading(false);
        }
        
        // Упрощенный слушатель изменений аутентификации
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            if (!mounted) return;
            
            console.log('🔄 Auth state changed:', event);
            
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
        console.error('💥 Auth setup error:', error);
        if (mounted) {
          setIsLoading(false);
          setIsAdmin(false);
        }
      }
    };
    
    setupAuth();
    
    return () => {
      mounted = false;
      mountedRef.current = false;
    };
  }, [fetchUserProfile]);

  const contextValue = useMemo(() => ({
    user,
    session,
    profile,
    isLoading,
    isAdmin,
    signOut,
    refreshProfile,
    refreshAdminStatus,
    forceAuthReinit
  }), [user, session, profile, isLoading, isAdmin, signOut, refreshProfile, refreshAdminStatus, forceAuthReinit]);

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
