
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import FirstLoginWelcome from '@/components/auth/FirstLoginWelcome';
import { devLog, devError, getCachedAdminRights, setCachedAdminRights, clearAdminCache } from '@/utils/performanceUtils';

type Profile = Database['public']['Tables']['profiles']['Row'];

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean | null;
  isCheckingAdmin: boolean;
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
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const [showFirstLoginWelcome, setShowFirstLoginWelcome] = useState(false);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      devLog("AuthContext: Fetching profile for user:", userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('AuthContext: Error fetching user profile:', error);
        return null;
      }
      
      devLog("AuthContext: Fetched profile data:", data);
      
      if (data) {
        setProfile(data);
        
        // Check if first login welcome should be shown
        if (data.email.endsWith('@g.com') && !data.first_login_completed) {
          devLog("AuthContext: First login detected for @g.com user");
          setShowFirstLoginWelcome(true);
        }
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('AuthContext: Exception while fetching profile:', error);
      return null;
    }
  }, []);

  // Оптимизированная проверка админских прав с кешированием
  const checkAdminRights = useCallback(async (userId: string, forceRefresh = false) => {
    if (!userId) {
      setIsAdmin(false);
      return false;
    }

    setIsCheckingAdmin(true);
    
    try {
      // Проверяем кеш, если не принудительное обновление
      if (!forceRefresh) {
        const cached = getCachedAdminRights(userId);
        if (cached !== null) {
          devLog("AuthContext: Using cached admin rights:", cached);
          setIsAdmin(cached);
          setIsCheckingAdmin(false);
          return cached;
        }
      }

      // Проверяем по профилю (быстрее чем RPC)
      if (profile?.user_type === 'admin') {
        setIsAdmin(true);
        setCachedAdminRights(userId, true);
        setIsCheckingAdmin(false);
        return true;
      }

      // Если профиль есть и не админ, кешируем результат
      if (profile && profile.user_type !== 'admin') {
        setIsAdmin(false);
        setCachedAdminRights(userId, false);
        setIsCheckingAdmin(false);
        return false;
      }

      // Fallback к RPC только если профиль еще не загружен
      devLog("AuthContext: Checking admin via RPC for user:", userId);
      const { data, error } = await supabase.rpc('is_admin');
      
      if (error) {
        console.error('AuthContext: Error checking admin status:', error);
        setIsAdmin(false);
        setIsCheckingAdmin(false);
        return false;
      }

      const hasAdminAccess = data === true;
      setIsAdmin(hasAdminAccess);
      setCachedAdminRights(userId, hasAdminAccess);
      setIsCheckingAdmin(false);
      return hasAdminAccess;
    } catch (error) {
      console.error('AuthContext: Error in admin check:', error);
      setIsAdmin(false);
      setIsCheckingAdmin(false);
      return false;
    }
  }, [profile]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      devLog("AuthContext: Refreshing profile for user:", user.id);
      await fetchUserProfile(user.id);
    }
  }, [user, fetchUserProfile]);

  const refreshAdminStatus = useCallback(async () => {
    if (user) {
      devLog("AuthContext: Force refreshing admin status");
      await checkAdminRights(user.id, true);
    }
  }, [user, checkAdminRights]);

  const handleFirstLoginComplete = useCallback((completed: boolean) => {
    if (completed) {
      setShowFirstLoginWelcome(false);
      refreshProfile();
    }
  }, [refreshProfile]);

  useEffect(() => {
    let mounted = true;
    
    const setupAuth = async () => {
      try {
        devLog("AuthContext: Setting up authentication");
        
        // Get initial session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("AuthContext: Error getting session:", error);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }
        
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (currentSession?.user) {
            devLog("AuthContext: Initial user found, fetching profile");
            const profileData = await fetchUserProfile(currentSession.user.id);
            if (profileData) {
              // Проверяем админские права после загрузки профиля
              await checkAdminRights(currentSession.user.id);
            }
          }
          
          setIsLoading(false);
        }
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            if (!mounted) return;
            
            devLog("AuthContext: Auth state changed:", event, currentSession?.user?.id);
            
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            
            if (currentSession?.user) {
              devLog("AuthContext: User authenticated, fetching profile");
              const profileData = await fetchUserProfile(currentSession.user.id);
              if (profileData) {
                // Проверяем админские права после загрузки профиля
                await checkAdminRights(currentSession.user.id);
              }
            } else {
              devLog("AuthContext: User not authenticated, clearing data");
              setProfile(null);
              setIsAdmin(null);
              setShowFirstLoginWelcome(false);
              clearAdminCache();
            }
          }
        );

        return () => {
          devLog("AuthContext: Cleaning up auth subscription");
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
    };
  }, [fetchUserProfile, checkAdminRights]);

  // Проверяем админские права когда профиль обновляется
  useEffect(() => {
    if (user && profile && isAdmin === null && !isCheckingAdmin) {
      checkAdminRights(user.id);
    }
  }, [user, profile, isAdmin, isCheckingAdmin, checkAdminRights]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    
    try {
      devLog("AuthContext: Signing out user");
      await supabase.auth.signOut();
      
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdmin(null);
      setShowFirstLoginWelcome(false);
      clearAdminCache();
      devLog("AuthContext: Sign out successful");
    } catch (error) {
      console.error('AuthContext: Error during sign out:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    session,
    profile,
    isLoading,
    isAdmin,
    isCheckingAdmin,
    signOut,
    refreshProfile,
    refreshAdminStatus
  }), [user, session, profile, isLoading, isAdmin, isCheckingAdmin, signOut, refreshProfile, refreshAdminStatus]);

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
