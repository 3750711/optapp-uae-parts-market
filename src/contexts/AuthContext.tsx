import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { 
  isNetworkError, 
  retryAuthOperation, 
  checkFirstLoginCompletion 
} from "@/utils/authSessionManager";
import { quickAuthDiagnostic, logAuthState } from "@/utils/authDiagnostics";

type UserProfile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  isAdmin: boolean | null;
  profileError: string | null;
  authError: string | null;
  needsFirstLoginCompletion: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: any }>;
  signUp: (email: string, password: string, options?: any) => Promise<{ user: User | null; error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: (forceRefresh?: boolean) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  signInWithTelegram: (authData: any) => Promise<{ user: User | null; error: any }>;
  retryProfileLoad: () => void;
  clearAuthError: () => void;
  forceReauth: () => Promise<void>;
  completeFirstLogin: () => Promise<void>;
  runDiagnostic: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [needsFirstLoginCompletion, setNeedsFirstLoginCompletion] = useState(false);

  // isAdmin зависит только от текущего профиля
  const isAdmin = React.useMemo<boolean | null>(() => {
    if (profile === null) return null;
    return profile?.user_type === 'admin';
  }, [profile?.user_type, profile === null]);

  const fetchUserProfile = async (userId: string): Promise<void> => {
    setIsProfileLoading(true);
    setProfileError(null);

    try {
      console.log(`👤 AuthContext: Fetching profile for user ${userId}`);
      
      const { data, error } = await retryAuthOperation(async () => {
        return await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
      });
      
      if (error) {
        if (isNetworkError(error)) {
          console.warn('🌐 AuthContext: Network error fetching profile, will retry later:', error);
          setProfileError('Network error. Profile will load when connection is restored.');
        } else {
          console.error('❌ AuthContext: Profile fetch error:', error);
          setProfile(null);
          setProfileError(error.message || 'Failed to load profile');
        }
      } else if (data) {
        setProfile(data);
        console.log('✅ AuthContext: Profile loaded successfully');
        
        // DISABLED: Check if first login completion is needed
        console.log('🔄 AuthContext: First login completion check disabled');
        setNeedsFirstLoginCompletion(false); // Always set to false (disabled)
      } else {
        setProfile(null);
        console.log('👤 AuthContext: No profile found for user');
      }
    } catch (err) {
      if (isNetworkError(err)) {
        console.warn('🌐 AuthContext: Network error during profile fetch:', err);
        setProfileError('Connection issue. Please check your internet connection.');
      } else {
        console.error('❌ AuthContext: Profile fetch error:', err);
        setProfile(null);
        setProfileError(err?.message || 'Failed to load profile');
      }
    } finally {
      setIsProfileLoading(false);
    }
  };

  useEffect(() => {
    console.log("🚀 AuthContext: Initializing simplified auth system");
    
    // Initialize auth system asynchronously to wait for client readiness
    const initAuthSystem = async () => {
      try {
        // Wait for client to be ready
        const client = await import('@/lib/supabaseClient').then(m => m.getSupabaseClient());
        
        // Set up auth state listener
        const { data: { subscription } } = client.auth.onAuthStateChange(
          (event, session) => {
            console.log("🔧 AuthContext: Auth state change:", event, !!session);
            
            // Clear any previous auth errors on successful auth events
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              setAuthError(null);
            }

            setSession(session);

            if (session?.user) {
              setUser(session.user);
              
              // Fetch profile for new sessions or sign-ins
              if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                fetchUserProfile(session.user.id);
              }
            } else {
              console.log("🔧 AuthContext: Clearing user state");
              setUser(null);
              setProfile(null);
              setProfileError(null);
            }
            
            setIsLoading(false);
          }
        );

        // Check for existing session
        const { data: { session }, error } = await client.auth.getSession();
        if (error) {
          console.error("❌ AuthContext: Session check error:", error);
          setAuthError("Authentication error. Please log in again.");
        } else if (session?.user) {
          setSession(session);
          setUser(session.user);
          fetchUserProfile(session.user.id);
        }
        
        setIsLoading(false);

        return () => {
          console.log("🧹 AuthContext: Cleaning up auth system");
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("❌ AuthContext: Critical session error:", error);
        setAuthError("Critical authentication error. Please clear browser data and try again.");
        setIsLoading(false);
      }
    };

    // Start initialization and store cleanup function
    let cleanup: (() => void) | undefined;
    initAuthSystem().then(cleanupFn => {
      cleanup = cleanupFn;
    });

    // Return cleanup function
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setAuthError(null);
      console.log('🔓 AuthContext: Attempting sign in with URL:', supabase.supabaseUrl);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error("❌ AuthContext: Sign in error:", error);
      setAuthError(error.message || "Sign in failed. Please try again.");
      return { user: null, error };
    }
  };

  const signUp = async (email: string, password: string, options?: any) => {
    try {
      setAuthError(null);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          ...options,
        },
      });
      
      if (error) throw error;
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error("❌ AuthContext: Sign up error:", error);
      setAuthError(error.message || "Sign up failed. Please try again.");
      return { user: null, error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 AuthContext: Starting signOut process');
      
      // Perform Supabase signOut
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("❌ AuthContext: SignOut error:", error);
      }
      
      // Clear React state
      setUser(null);
      setProfile(null);
      setSession(null);
      setProfileError(null);
      setAuthError(null);
      
      console.log('✅ AuthContext: SignOut completed successfully');
    } catch (error) {
      console.error("❌ AuthContext: Sign out error:", error);
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
      
      // Update local state
      setProfile(data);
      
      console.log('✅ AuthContext: Profile updated successfully');
    } catch (error) {
      console.error('❌ AuthContext: Profile update failed:', error);
      throw error;
    }
  };

  const refreshProfile = async (forceRefresh = false) => {
    if (user?.id) {
      await fetchUserProfile(user.id);
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

  const signInWithTelegram = async (authData: any): Promise<{ user: User | null; error: any }> => {
    try {
      console.log("📱 AuthContext: Telegram auth not implemented yet:", authData);
      return { user: null, error: new Error("Telegram auth not implemented") };
    } catch (error) {
      console.error("❌ AuthContext: Telegram sign in error:", error);
      return { user: null, error };
    }
  };

  const retryProfileLoad = () => {
    if (user?.id) {
      console.log('🔄 AuthContext: Retrying profile load');
      fetchUserProfile(user.id);
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const forceReauth = async () => {
    console.log('🔄 AuthContext: Force re-authentication requested');
    setAuthError(null);
    await signOut();
  };

  const completeFirstLogin = async () => {
    if (!user?.id) {
      console.error('❌ AuthContext: Cannot complete first login without user');
      return;
    }
    
    try {
      console.log('🔄 AuthContext: Completing first login setup');
      
      // Update profile to mark first login as completed
      const { error } = await supabase
        .from('profiles')
        .update({ 
          first_login_completed: true,
          profile_completed: true 
        })
        .eq('id', user.id);
        
      if (error) {
        console.error('❌ AuthContext: Failed to complete first login:', error);
        throw error;
      }
      
      setNeedsFirstLoginCompletion(false);
      await refreshProfile(); // Refresh to get updated profile
      console.log('✅ AuthContext: First login setup completed');
      
    } catch (error) {
      console.error('❌ AuthContext: Error completing first login:', error);
      setAuthError('Failed to complete setup. Please try again.');
    }
  };

  const runDiagnostic = async () => {
    console.log('🔍 AuthContext: Running authentication diagnostic');
    logAuthState('Manual diagnostic');
    
    try {
      const result = await quickAuthDiagnostic();
      console.log('🔍 Diagnostic result:', result);
      
      if (result.status === 'critical') {
        setAuthError(`Authentication issues detected: ${result.issues.join(', ')}`);
      } else if (result.status === 'degraded') {
        console.warn('⚠️ Auth degraded:', result.issues);
      }
    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
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
    authError,
    needsFirstLoginCompletion,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
    sendPasswordResetEmail,
    updatePassword,
    signInWithTelegram,
    retryProfileLoad,
    clearAuthError,
    forceReauth,
    completeFirstLogin,
    runDiagnostic,
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