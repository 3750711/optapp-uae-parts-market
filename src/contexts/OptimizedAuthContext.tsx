
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
  const [showFirstLoginWelcome, setShowFirstLoginWelcome] = useState(false);
  
  const mountedRef = useRef(true);

  // Вычисляем админские права напрямую из профиля
  const isAdmin = useMemo(() => {
    return profile?.user_type === 'admin' ? true : false;
  }, [profile?.user_type]);

  const fetchUserProfile = useCallback(async (userId: string) => {
    if (!mountedRef.current) return null;
    
    try {
      console.log('OptimizedAuthContext: Fetching user profile for:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error || !mountedRef.current) {
        console.error('OptimizedAuthContext: Error fetching user profile:', error);
        return null;
      }
      
      if (data && mountedRef.current) {
        setProfile(data);
        
        // Проверяем first login для пользователей @g.com
        if (data.email.endsWith('@g.com') && !data.first_login_completed) {
          setShowFirstLoginWelcome(true);
        }
        
        console.log('OptimizedAuthContext: Profile loaded, user_type:', data.user_type);
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('OptimizedAuthContext: Exception while fetching profile:', error);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user && mountedRef.current) {
      await fetchUserProfile(user.id);
    }
  }, [user, fetchUserProfile]);

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
      setProfile(null);
      setShowFirstLoginWelcome(false);
    } catch (error) {
      console.error('OptimizedAuthContext: Error during sign out:', error);
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
        console.log('OptimizedAuthContext: Setting up auth...');
        
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error || !mounted) {
          console.error("OptimizedAuthContext: Error getting session:", error);
          if (mounted) setIsLoading(false);
          return;
        }
        
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (currentSession?.user) {
            console.log('OptimizedAuthContext: User found, fetching profile...');
            await fetchUserProfile(currentSession.user.id);
          } else {
            console.log('OptimizedAuthContext: No user found');
          }
          
          setIsLoading(false);
        }
        
        // Устанавливаем listener для изменений авторизации
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            if (!mounted) return;
            
            console.log('OptimizedAuthContext: Auth state changed:', event);
            
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            
            if (currentSession?.user) {
              await fetchUserProfile(currentSession.user.id);
            } else {
              setProfile(null);
              setShowFirstLoginWelcome(false);
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("OptimizedAuthContext: Error setting up auth:", error);
        if (mounted) setIsLoading(false);
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
