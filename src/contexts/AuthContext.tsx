
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import FirstLoginWelcome from '@/components/auth/FirstLoginWelcome';
import { devLog } from '@/utils/performanceUtils';

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
  
  // Refs to prevent unnecessary re-renders
  const mountedRef = useRef(true);

  const fetchUserProfile = useCallback(async (userId: string) => {
    if (!mountedRef.current) return null;
    
    try {
      devLog('AuthContext: Fetching user profile and admin status for:', userId);
      
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
        
        // Напрямую определяем админские права из профиля
        const hasAdminAccess = data.user_type === 'admin';
        setIsAdmin(hasAdminAccess);
        
        devLog('AuthContext: Profile loaded, isAdmin:', hasAdminAccess);
        
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

  const refreshProfile = useCallback(async () => {
    if (user && mountedRef.current) {
      await fetchUserProfile(user.id);
    }
  }, [user, fetchUserProfile]);

  const refreshAdminStatus = useCallback(async () => {
    if (user && mountedRef.current) {
      // Просто перезагружаем профиль, админский статус установится автоматически
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
    setIsLoading(true);
    
    try {
      await supabase.auth.signOut();
      
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdmin(null);
      setShowFirstLoginWelcome(false);
    } catch (error) {
      console.error('AuthContext: Error during sign out:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Main auth effect - simplified and optimized
  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;
    
    const setupAuth = async () => {
      try {
        devLog('AuthContext: Setting up auth...');
        
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
            devLog('AuthContext: User found, fetching profile...');
            await fetchUserProfile(currentSession.user.id);
          } else {
            devLog('AuthContext: No user found');
            setIsAdmin(false);
          }
          
          setIsLoading(false);
        }
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            if (!mounted) return;
            
            devLog('AuthContext: Auth state changed:', event);
            
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
  }, []); // Minimal dependencies

  // Memoize context value to prevent unnecessary re-renders
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
