import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { handleAuthErrorSoftly, createExponentialBackoff } from "@/utils/authErrorHandler";
import { authSessionManager } from "@/utils/authSessionManager";
import { profileManager } from "@/utils/profileManager";

type UserProfile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  isAdmin: boolean | null;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: any }>;
  signUp: (email: string, password: string, options?: any) => Promise<{ user: User | null; error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: (forceRefresh?: boolean) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  checkTokenValidity: () => Promise<boolean>;
  // forceRefreshSession removed - using autoRefreshToken only
  signInWithTelegram: (authData: any) => Promise<{ user: User | null; error: any }>;
  refreshAdminStatus: () => Promise<void>;
  retryProfileLoad: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Проверка React dispatcher перед использованием хуков
  const reactInternals = (React as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  if (!reactInternals?.ReactCurrentDispatcher?.current) {
    console.error("❌ AuthContext: React dispatcher is null! Provider called outside React context");
    return <div>Loading...</div>;
  }

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  // Enhanced auth state management
  const cleanupRef = useRef<(() => void) | null>(null);
  const retryConfig = createExponentialBackoff(3, 1000);

  // Single-flight для профиля: исключаем конкурирующие запросы
  const inflightRef = useRef<Promise<void> | null>(null);

  // isAdmin зависит только от текущего профиля (стабильное значение)
  const isAdmin = React.useMemo<boolean | null>(() => {
    if (profile === null) return null;
    return profile?.user_type === 'admin';
  }, [profile?.user_type, profile === null]);

  const fetchUserProfile = async (userId: string, { force = false } = {}): Promise<void> => {
    // Защита от дублирования запросов
    if (inflightRef.current) {
      await inflightRef.current;
      return;
    }

    setIsProfileLoading(true);
    setProfileError(null);

    inflightRef.current = (async () => {
      try {
        console.log(`👤 AuthContext: Fetching profile for user ${userId} (force: ${force})`);
        
        const profileData = await profileManager.fetchProfile(userId, { force });
        
        if (profileData) {
          setProfile(profileData);
          console.log('✅ AuthContext: Profile loaded successfully');
        } else {
          setProfile(null);
          console.log('👤 AuthContext: No profile found for user');
        }
      } catch (err) {
        console.error('❌ AuthContext: Profile fetch error:', err);
        
        if (!handleAuthErrorSoftly(err, 'profile_fetch')) {
          setProfile(null);
          setProfileError(err?.message || 'Failed to load profile');
        }
      }
    })().finally(() => {
      setIsProfileLoading(false);
      inflightRef.current = null;
    });

    await inflightRef.current;
  };

  useEffect(() => {
    console.log("🚀 AuthContext: Initializing enhanced auth system");
    
    // Migrate from old sessionStorage to new localStorage system
    profileManager.migrateFromSessionStorage();
    
    // Initialize session manager with singleton guard
    cleanupRef.current = authSessionManager.initialize((event, session) => {
      console.log("🔧 AuthContext: Auth state change:", event, !!session);

      // Handle user changes by clearing all profile caches
      const isUserChange = user?.id && session?.user?.id && user.id !== session.user.id;
      if (isUserChange) {
        console.warn('🔄 AuthContext: User change detected, clearing all caches');
        profileManager.clearAllProfiles();
      }

      setSession(session);

      if (session?.user) {
        setUser(session.user);
        
        // Only fetch profile on sign in or initial load, not on token refresh
        if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && !profile)) {
          void fetchUserProfile(session.user.id);
        }
      } else {
        console.log("🔧 AuthContext: Clearing user state");
        setUser(null);
        setProfile(null);
        setProfileError(null);
        profileManager.clearAllProfiles();
      }
      
      setIsLoading(false);
    });

    // Set up cross-tab profile sync
    authSessionManager.on('profile-updated', ({ userId, profile: updatedProfile }) => {
      if (user?.id === userId) {
        console.log('📡 AuthContext: Profile updated from another tab');
        setProfile(updatedProfile);
      }
    });

    // Handle force signout from other tabs
    authSessionManager.on('force-signout', ({ reason }) => {
      console.warn('🚪 AuthContext: Force signout received:', reason);
      setSession(null);
      setUser(null);
      setProfile(null);
      profileManager.clearAllProfiles();
    });

    // Initial session check with token validation
    const checkInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log("🔧 AuthContext: Initial session check", {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          expiresAt: session?.expires_at
        });
        
        if (error) {
          console.error("❌ AuthContext: Session check error:", error);
          throw error;
        }

        if (session?.user) {
          // Validate session token before trusting it
          const now = Math.floor(Date.now() / 1000);
          const expiresAt = session.expires_at || 0;
          
          if (expiresAt > now) {
            console.log("✅ AuthContext: Valid session found");
            
            // Verify token validity with server
            try {
              const { error: userError } = await supabase.auth.getUser();
              if (userError) {
                console.warn("⚠️ AuthContext: Token validation failed");
                throw new Error('Invalid token');
              }
              
              setSession(session);
              setUser(session.user);
              await fetchUserProfile(session.user.id);
            } catch (tokenError) {
              console.warn("⚠️ AuthContext: Session invalid, cleaning up");
              await forceCleanSession();
            }
          } else {
            console.warn("⚠️ AuthContext: Session expired");
            await forceCleanSession();
          }
        } else {
          console.log("🔧 AuthContext: No session found");
          await forceCleanSession();
        }
      } catch (error) {
        console.error("❌ AuthContext: Initial session error:", error);
        await forceCleanSession();
      } finally {
        setIsLoading(false);
      }
    };

    const forceCleanSession = async () => {
      console.log("🧹 AuthContext: Force cleaning session state");
      
      setSession(null);
      setUser(null);
      setProfile(null);
      profileManager.clearAllProfiles();
      
      // Clear all auth-related storage
      if (typeof window !== 'undefined') {
        const localKeys = Object.keys(localStorage);
        const authKeys = localKeys.filter(key => 
          key.startsWith('sb-') || 
          key.startsWith('supabase.auth.token') ||
          key.includes('auth-token') ||
          key.includes('session')
        );
        authKeys.forEach(key => localStorage.removeItem(key));
        
        console.log(`🧹 AuthContext: Cleared ${authKeys.length} auth storage keys`);
      }
    };

    checkInitialSession();

    return () => {
      console.log("🧹 AuthContext: Cleaning up enhanced auth system");
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  // Enhanced visibility and session awakening is handled by authSessionManager

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error("❌ AuthContext: Sign in error:", error);
      return { user: null, error };
    }
  };

  const signUp = async (email: string, password: string, options?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options,
      });
      
      if (error) throw error;
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error("❌ AuthContext: Sign up error:", error);
      return { user: null, error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 AuthContext: Starting enhanced signOut process');
      
      // 1. Broadcast signOut to other tabs FIRST
      authSessionManager.cleanup();
      
      // 2. Clear all auth-related localStorage BEFORE Supabase signOut
      if (typeof window !== 'undefined') {
        const storageKeys = Object.keys(localStorage);
        const authKeys = storageKeys.filter(key => 
          key.startsWith('sb-') || 
          key.startsWith('supabase.auth.token') ||
          key.includes('auth-token') ||
          key.includes('session')
        );
        
        authKeys.forEach(key => localStorage.removeItem(key));
        console.log('🧹 AuthContext: Cleared localStorage auth keys:', authKeys.length);
      }
      
      // 3. Clear profile caches
      profileManager.clearAllProfiles();
      
      // 4. Cancel inflight requests
      inflightRef.current = null;
      
      // 5. Perform Supabase signOut with global scope
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' });
      if (signOutError) {
        console.warn('⚠️ AuthContext: SignOut error, but continuing with cleanup:', signOutError);
      }
      
      // 6. Final cleanup - clear any remaining auth storage
      if (typeof window !== 'undefined') {
        const finalStorageKeys = Object.keys(localStorage);
        const finalAuthKeys = finalStorageKeys.filter(key => 
          key.startsWith('sb-') || 
          key.startsWith('supabase.auth.token') ||
          key.includes('auth-token') ||
          key.includes('session')
        );
        
        finalAuthKeys.forEach(key => localStorage.removeItem(key));
        console.log('🧹 AuthContext: Final cleanup - cleared', finalAuthKeys.length, 'remaining keys');
      }
      
      // 7. Clear React state
      setUser(null);
      setProfile(null);
      setSession(null);
      setProfileError(null);
      
      console.log('✅ AuthContext: SignOut completed successfully');
    } catch (error) {
      console.error("❌ AuthContext: Sign out error:", error);
      
      // Even if signOut fails, aggressively clear all local data for security
      setUser(null);
      setProfile(null);
      setSession(null);
      setProfileError(null);
      profileManager.clearAllProfiles();
      
      if (typeof window !== 'undefined') {
        // Force clear ALL localStorage auth keys
        const localKeys = Object.keys(localStorage);
        const authKeys = localKeys.filter(key => 
          key.startsWith('sb-') || 
          key.startsWith('supabase.auth.token') ||
          key.includes('auth-token') ||
          key.includes('session')
        );
        authKeys.forEach(key => localStorage.removeItem(key));
        
        console.log('🧹 AuthContext: Force cleared all auth data on error');
      }
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.id) throw new Error("User not authenticated");
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Update local state and persistent cache
      setProfile(data);
      profileManager.updateProfile(user.id, data);
      
      // Broadcast to other tabs
      authSessionManager.broadcastProfileUpdate(user.id, data);
      
      console.log('✅ AuthContext: Profile updated successfully');
    } catch (error) {
      console.error('❌ AuthContext: Profile update failed:', error);
      throw error;
    }
  };

  const refreshProfile = async (forceRefresh = false) => {
    if (user?.id) {
      if (forceRefresh) {
        profileManager.invalidateProfile(user.id);
      }
      await fetchUserProfile(user.id, { force: forceRefresh });
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      console.error("❌ AuthContext: Password reset error:", error);
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      return { error };
    } catch (error) {
      console.error("❌ AuthContext: Update password error:", error);
      return { error };
    }
  };

  const checkTokenValidity = useCallback(async (): Promise<boolean> => {
    // Use cached session for token validity check to avoid network overhead
    if (session) {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at || 0;
      
      // If token expires within 5 minutes, consider it invalid to trigger refresh
      return expiresAt > (now + 300);
    }
    
    return false;
  }, [session]);

  // ❌ Removed forceRefreshSession - rely only on autoRefreshToken

  const signInWithTelegram = async (authData: any): Promise<{ user: User | null; error: any }> => {
    try {
      // Заглушка для Telegram авторизации - будет реализована позже
      console.log("📱 AuthContext: Telegram auth not implemented yet:", authData);
      return { user: null, error: new Error("Telegram auth not implemented") };
    } catch (error) {
      console.error("❌ AuthContext: Telegram sign in error:", error);
      return { user: null, error };
    }
  };

  const refreshAdminStatus = async (): Promise<void> => {
    if (!user) return;
    // Форс-обновление (ручной вызов, без таймеров)
    await fetchUserProfile(user.id, { force: true });
  };

  const retryProfileLoad = () => {
    if (user?.id) {
      console.log('🔄 AuthContext: Retrying profile load');
      profileManager.invalidateProfile(user.id);
      void fetchUserProfile(user.id, { force: true });
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    isProfileLoading,
    isAdmin,
    profileError,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
    sendPasswordResetEmail,
    updatePassword,
    checkTokenValidity,
    // forceRefreshSession removed
    signInWithTelegram,
    refreshAdminStatus,
    retryProfileLoad,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    console.error("❌ useAuth: Hook called outside AuthProvider");
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
};