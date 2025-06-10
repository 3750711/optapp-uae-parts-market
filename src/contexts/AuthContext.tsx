
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
  
  // Ref для предотвращения повторных вызовов
  const fetchingProfileRef = useRef(false);
  const mountedRef = useRef(true);

  const fetchUserProfile = useCallback(async (userId: string) => {
    // Предотвращаем повторные вызовы
    if (fetchingProfileRef.current || !mountedRef.current) {
      console.log('AuthContext: Skipping profile fetch (already fetching or unmounted)');
      return null;
    }

    fetchingProfileRef.current = true;
    
    try {
      console.log('AuthContext: Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error || !mountedRef.current) {
        console.error('AuthContext: Error fetching profile:', error);
        return null;
      }
      
      if (data && mountedRef.current) {
        setProfile(data);
        
        // Определяем админские права
        const hasAdminAccess = data.user_type === 'admin';
        setIsAdmin(hasAdminAccess);
        
        console.log('AuthContext: Profile loaded, isAdmin:', hasAdminAccess);
        
        // Проверяем first login
        if (data.email.endsWith('@g.com') && !data.first_login_completed) {
          setShowFirstLoginWelcome(true);
        }
        
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('AuthContext: Exception while fetching profile:', error);
      return null;
    } finally {
      fetchingProfileRef.current = false;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user && mountedRef.current) {
      await fetchUserProfile(user.id);
    }
  }, [user, fetchUserProfile]);

  const refreshAdminStatus = useCallback(async () => {
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

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdmin(null);
      setShowFirstLoginWelcome(false);
    } catch (error) {
      console.error('AuthContext: Error during sign out:', error);
    }
  }, []);

  // Главный эффект аутентификации - упрощенный и оптимизированный
  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;
    
    const setupAuth = async () => {
      try {
        console.log('AuthContext: Setting up auth...');
        
        // Получаем текущую сессию
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("AuthContext: Error getting session:", error);
          if (mounted) setIsLoading(false);
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
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("AuthContext: Error setting up auth:", error);
        if (mounted) setIsLoading(false);
      }
    };
    
    setupAuth();
    
    return () => {
      mounted = false;
      mountedRef.current = false;
    };
  }, []); // Только один раз при монтировании

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
