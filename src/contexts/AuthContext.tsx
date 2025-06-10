
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import FirstLoginWelcome from '@/components/auth/FirstLoginWelcome';
import { getCachedAdminRights, setCachedAdminRights, clearAdminCache } from '@/utils/performanceUtils';

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
  
  // Refs to prevent unnecessary re-renders
  const adminCheckTimeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  const fetchUserProfile = useCallback(async (userId: string) => {
    if (!mountedRef.current) return null;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error || !mountedRef.current) {
        console.error('AuthContext: Error fetching user profile:', error);
        return null;
      }
      
      if (data) {
        setProfile(data);
        
        // Check if first login welcome should be shown
        if (data.email.endsWith('@g.com') && !data.first_login_completed) {
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

  // Debounced admin check to prevent excessive calls
  const debouncedAdminCheck = useCallback(async (userId: string, forceRefresh = false) => {
    if (!userId || !mountedRef.current) {
      setIsAdmin(false);
      return false;
    }

    // Clear previous timeout
    if (adminCheckTimeoutRef.current) {
      clearTimeout(adminCheckTimeoutRef.current);
    }

    return new Promise<boolean>((resolve) => {
      adminCheckTimeoutRef.current = setTimeout(async () => {
        if (!mountedRef.current) {
          resolve(false);
          return;
        }

        setIsCheckingAdmin(true);
        
        try {
          // Check cache first
          if (!forceRefresh) {
            const cached = getCachedAdminRights(userId);
            if (cached !== null) {
              setIsAdmin(cached);
              setIsCheckingAdmin(false);
              resolve(cached);
              return;
            }
          }

          // Quick profile check first
          if (profile && String(profile.user_type) === 'admin') {
            setIsAdmin(true);
            setCachedAdminRights(userId, true);
            setIsCheckingAdmin(false);
            resolve(true);
            return;
          }

          if (profile && String(profile.user_type) !== 'admin') {
            setIsAdmin(false);
            setCachedAdminRights(userId, false);
            setIsCheckingAdmin(false);
            resolve(false);
            return;
          }

          // Fallback to RPC only if profile not loaded
          const { data, error } = await supabase.rpc('is_admin');
          
          if (error || !mountedRef.current) {
            console.error('AuthContext: Error checking admin status:', error);
            setIsAdmin(false);
            setIsCheckingAdmin(false);
            resolve(false);
            return;
          }

          const hasAdminAccess = data === true;
          setIsAdmin(hasAdminAccess);
          setCachedAdminRights(userId, hasAdminAccess);
          setIsCheckingAdmin(false);
          resolve(hasAdminAccess);
        } catch (error) {
          console.error('AuthContext: Error in admin check:', error);
          setIsAdmin(false);
          setIsCheckingAdmin(false);
          resolve(false);
        }
      }, 100); // 100ms debounce
    });
  }, [profile]);

  const refreshProfile = useCallback(async () => {
    if (user && mountedRef.current) {
      await fetchUserProfile(user.id);
    }
  }, [user, fetchUserProfile]);

  const refreshAdminStatus = useCallback(async () => {
    if (user && mountedRef.current) {
      await debouncedAdminCheck(user.id, true);
    }
  }, [user, debouncedAdminCheck]);

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
      setIsAdmin(null);
      setShowFirstLoginWelcome(false);
      clearAdminCache();
    } catch (error) {
      console.error('AuthContext: Error during sign out:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Main auth effect - simplified dependencies
  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;
    
    const setupAuth = async () => {
      try {
        // Get initial session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error || !mounted) {
          console.error("AuthContext: Error getting session:", error);
          if (mounted) setIsLoading(false);
          return;
        }
        
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (currentSession?.user) {
            const profileData = await fetchUserProfile(currentSession.user.id);
            if (profileData && mounted) {
              await debouncedAdminCheck(currentSession.user.id);
            }
          }
          
          setIsLoading(false);
        }
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            if (!mounted) return;
            
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            
            if (currentSession?.user) {
              const profileData = await fetchUserProfile(currentSession.user.id);
              if (profileData && mounted) {
                await debouncedAdminCheck(currentSession.user.id);
              }
            } else {
              setProfile(null);
              setIsAdmin(null);
              setShowFirstLoginWelcome(false);
              clearAdminCache();
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
      if (adminCheckTimeoutRef.current) {
        clearTimeout(adminCheckTimeoutRef.current);
      }
    };
  }, []); // Minimal dependencies

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
