
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

  // Безопасная функция загрузки профиля с обработкой ошибок
  const fetchUserProfile = useCallback(async (userId: string) => {
    if (fetchingRef.current || !mountedRef.current) {
      console.log('AuthContext: Skipping profile fetch (already fetching or unmounted)');
      return null;
    }

    fetchingRef.current = true;
    console.log('AuthContext: Starting profile fetch for user:', userId);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('AuthContext: Error fetching profile:', error);
        
        // В случае ошибки устанавливаем безопасные значения
        if (mountedRef.current) {
          setProfile(null);
          setIsAdmin(false);
        }
        return null;
      }
      
      if (data && mountedRef.current) {
        console.log('AuthContext: Profile loaded successfully:', {
          userId: data.id,
          userType: data.user_type,
          fullName: data.full_name
        });
        
        setProfile(data);
        
        const hasAdminAccess = data.user_type === 'admin';
        setIsAdmin(hasAdminAccess);
        
        console.log('AuthContext: Admin status set to:', hasAdminAccess);
        
        // Проверяем first login
        if (data.email.endsWith('@g.com') && !data.first_login_completed) {
          setShowFirstLoginWelcome(true);
        }
        
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('AuthContext: Exception while fetching profile:', error);
      
      // В случае исключения устанавливаем безопасные значения
      if (mountedRef.current) {
        setProfile(null);
        setIsAdmin(false);
      }
      return null;
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user && mountedRef.current) {
      await fetchUserProfile(user.id);
    }
  }, [user, fetchUserProfile]);

  const refreshAdminStatus = useCallback(async () => {
    console.log('AuthContext: Manual admin status refresh triggered');
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
      console.log('AuthContext: Starting sign out');
      await supabase.auth.signOut();
      
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdmin(null);
      setShowFirstLoginWelcome(false);
      setIsLoading(false);
      
      console.log('AuthContext: Sign out completed');
    } catch (error) {
      console.error('AuthContext: Error during sign out:', error);
    }
  }, []);

  // Основная логика инициализации auth
  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;
    
    console.log('AuthContext: Starting auth initialization');
    
    // Timeout для предотвращения бесконечной загрузки
    initTimeoutRef.current = setTimeout(() => {
      if (mounted && mountedRef.current) {
        console.warn('AuthContext: Initialization timeout reached, forcing isLoading = false');
        setIsLoading(false);
      }
    }, 15000);
    
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
          }
          
          // Важно: устанавливаем isLoading в false только после завершения всех операций
          setIsLoading(false);
          
          // Очищаем timeout, так как инициализация завершена
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
              // Не сбрасываем isLoading здесь, так как это может быть просто обновление токена
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
