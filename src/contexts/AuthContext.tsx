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

  // Enhanced profile fetching with timeout protection
  const fetchUserProfile = useCallback(async (userId: string) => {
    if (!mountedRef.current) return null;

    console.log('🔄 Starting profile fetch for user:', userId);
    const startTime = Date.now();

    try {
      // Add timeout for profile fetching
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 8000)
      );

      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
      
      const elapsed = Date.now() - startTime;
      console.log(`⏱️ Profile fetch completed in ${elapsed}ms`);
      
      if (error) {
        console.error('❌ Profile fetch error:', { userId, error: error.message, elapsed });
        
        // Enhanced JWT error handling
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
          setCachedAdminRights(userId, false);
        }
        return null;
      }
      
      if (data && mountedRef.current) {
        console.log('✅ Profile loaded successfully:', {
          email: data.email,
          userType: data.user_type,
          verificationStatus: data.verification_status,
          elapsed
        });
        
        setProfile(data);
        
        // Enhanced admin rights checking
        const hasAdminAccess = data.user_type === 'admin';
        console.log('🔐 Admin access check:', { userType: data.user_type, hasAdminAccess });
        
        setCachedAdminRights(userId, hasAdminAccess);
        
        if (mountedRef.current) {
          setIsAdmin(hasAdminAccess);
          
          // Preload admin data with timeout
          if (hasAdminAccess) {
            console.log('⚡ Scheduling admin data preload...');
            setTimeout(() => {
              preloadAdminData();
            }, 1000);
          }
          
          // Check first login
          if (data.email?.endsWith('@g.com') && !data.first_login_completed) {
            console.log('👋 First login detected, showing welcome...');
            setShowFirstLoginWelcome(true);
          }
        }
        
        return data;
      }
      
      return null;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error('💥 Profile fetch exception:', { userId, error, elapsed });
      
      if (mountedRef.current) {
        setProfile(null);
        setIsAdmin(false);
        setCachedAdminRights(userId, false);
      }
      return null;
    }
  }, []);

  // Enhanced admin data preloading with timeout
  const preloadAdminData = useCallback(async () => {
    try {
      console.log('🚀 Starting admin data preload...');
      const startTime = Date.now();
      
      // Check cached data first
      const cachedMetrics = queryClient.getQueryData(['admin', 'metrics-optimized']);
      const cachedProductData = queryClient.getQueryData(['admin', 'add-product-data']);
      
      if (cachedMetrics && cachedProductData) {
        console.log('✅ Admin data already cached, skipping preload');
        return;
      }

      // Preload with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Admin data preload timeout')), 10000)
      );

      const preloadPromises = [];

      if (!cachedMetrics) {
        preloadPromises.push(
          queryClient.prefetchQuery({
            queryKey: ['admin', 'metrics-optimized'],
            queryFn: async () => {
              const { data, error } = await supabase.rpc('get_admin_metrics');
              if (error) throw error;
              return data;
            },
            staleTime: 1000 * 60 * 5,
          })
        );
      }

      if (!cachedProductData) {
        preloadPromises.push(
          queryClient.prefetchQuery({
            queryKey: ['admin', 'add-product-data'],
            queryFn: async () => {
              const { data, error } = await supabase.rpc('get_admin_add_product_data');
              if (error) throw error;
              return data;
            },
            staleTime: 1000 * 60 * 15,
          })
        );
      }

      await Promise.race([
        Promise.all(preloadPromises),
        timeoutPromise
      ]);
      
      const elapsed = Date.now() - startTime;
      console.log(`✅ Admin data preloaded successfully in ${elapsed}ms`);
    } catch (error) {
      console.warn('⚠️ Admin data preload failed (non-critical):', error);
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
      devLog('👋 Starting forced sign out...');
      
      // 1. Попытка серверного выхода (но не зависим от результата)
      try {
        await supabase.auth.signOut();
        devLog('✅ Server sign out successful');
      } catch (serverError) {
        devLog('⚠️ Server sign out failed (continuing with local cleanup):', serverError);
      }

      // 2. Принудительная очистка всех данных независимо от серверного результата
      
      // Очищаем состояние авторизации
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdmin(null);
      setShowFirstLoginWelcome(false);
      setIsLoading(false);
      
      // Очищаем кэш React Query
      queryClient.clear();
      
      // Принудительная очистка localStorage от всех ключей Supabase
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('sb-') || 
          key.includes('supabase') || 
          key.includes('auth-token') ||
          key.includes('vfiylfljiixqkjfqubyq')
        )) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          devLog(`🗑️ Removed localStorage key: ${key}`);
        } catch (error) {
          devLog(`⚠️ Failed to remove key ${key}:`, error);
        }
      });

      // Очищаем sessionStorage тоже
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (
          key.startsWith('sb-') || 
          key.includes('supabase') || 
          key.includes('auth-token') ||
          key.includes('vfiylfljiixqkjfqubyq')
        )) {
          sessionKeysToRemove.push(key);
        }
      }
      
      sessionKeysToRemove.forEach(key => {
        try {
          sessionStorage.removeItem(key);
          devLog(`🗑️ Removed sessionStorage key: ${key}`);
        } catch (error) {
          devLog(`⚠️ Failed to remove session key ${key}:`, error);
        }
      });

      devLog('✅ Forced sign out completed successfully');
      
      // 3. Принудительная перезагрузка страницы для полной очистки
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
    } catch (error) {
      devLog('💥 Error during forced sign out (still clearing locally):', error);
      
      // Даже при ошибке принудительно очищаем состояние
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdmin(null);
      setShowFirstLoginWelcome(false);
      setIsLoading(false);
      queryClient.clear();
      
      // Перезагружаем страницу в любом случае
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  }, [queryClient]);

  // Enhanced initialization with better timeout handling
  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;
    
    const setupAuth = async () => {
      try {
        console.log('🔑 Starting enhanced auth setup...');
        const setupStartTime = Date.now();
        
        // Add timeout for auth setup
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth setup timeout')), 10000)
        );

        const authSetupPromise = (async () => {
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          
          console.log('🔐 Session check result:', {
            hasSession: !!currentSession,
            userId: currentSession?.user?.id,
            userEmail: currentSession?.user?.email,
            accessToken: currentSession?.access_token ? 'present' : 'missing',
            error: error?.message,
            elapsed: Date.now() - setupStartTime
          });
          
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
        })();

        try {
          await Promise.race([authSetupPromise, timeoutPromise]);
        } catch (error) {
          console.error('⚠️ Auth setup timeout or error:', error);
          if (mounted) {
            setIsLoading(false);
            // Set safe defaults on timeout
            setIsAdmin(false);
          }
        }
        
        // Enhanced auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            if (!mounted) return;
            
            console.log('🔄 Auth state changed:', {
              event,
              hasSession: !!currentSession,
              userId: currentSession?.user?.id
            });
            
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            
            if (currentSession?.user) {
              // Use setTimeout to prevent blocking
              setTimeout(() => {
                if (mounted) {
                  fetchUserProfile(currentSession.user.id);
                }
              }, 0);
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

  // Memeoized context for preventing unnecessary re-renders
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
