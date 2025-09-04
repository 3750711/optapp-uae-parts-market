import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { profileManager } from "@/utils/profileManager";
import { validateAndCleanupSession, isNetworkError, forceCleanLogout } from "@/utils/authSessionManager";

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

  // isAdmin зависит только от текущего профиля
  const isAdmin = React.useMemo<boolean | null>(() => {
    if (profile === null) return null;
    return profile?.user_type === 'admin';
  }, [profile?.user_type, profile === null]);

  const fetchUserProfile = async (userId: string, { force = false } = {}): Promise<void> => {
    setIsProfileLoading(true);
    setProfileError(null);

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
      setProfile(null);
      setProfileError(err?.message || 'Failed to load profile');
    } finally {
      setIsProfileLoading(false);
    }
  };

  useEffect(() => {
    console.log("🚀 AuthContext: Initializing auth system");
    
    // Migrate from old sessionStorage to new localStorage system
    profileManager.migrateFromSessionStorage();
    
    // First validate and cleanup any old sessions
    validateAndCleanupSession().then(isValid => {
      if (!isValid) {
        console.log("🚨 AuthContext: Invalid session cleaned up, will reload");
        setIsLoading(false);
        return;
      }
      
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
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
              setTimeout(() => {
                void fetchUserProfile(session.user.id);
              }, 0);
            }
          } else {
            console.log("🔧 AuthContext: Clearing user state");
            setUser(null);
            setProfile(null);
            setProfileError(null);
            profileManager.clearAllProfiles();
          }
          
          setIsLoading(false);
        }
      );

      // Check for existing session
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.error("❌ AuthContext: Session check error:", error);
          if (isNetworkError(error)) {
            setAuthError("Network connection issue. Please check your internet connection and try again.");
            forceCleanLogout();
          } else {
            setAuthError("Authentication error. Please log in again.");
          }
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          setSession(session);
          setUser(session.user);
          setTimeout(() => {
            void fetchUserProfile(session.user.id);
          }, 0);
        }
        setIsLoading(false);
      }).catch(error => {
        console.error("❌ AuthContext: Critical session error:", error);
        setAuthError("Critical authentication error. Please clear browser data and try again.");
        forceCleanLogout();
        setIsLoading(false);
      });

      return () => {
        console.log("🧹 AuthContext: Cleaning up auth system");
        subscription.unsubscribe();
      };
    }).catch(error => {
      console.error("❌ AuthContext: Session validation failed:", error);
      setAuthError("Session validation failed. Please log in again.");
      setIsLoading(false);
    });
  }, []);


  const signIn = async (email: string, password: string) => {
    try {
      setAuthError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error("❌ AuthContext: Sign in error:", error);
      
      if (isNetworkError(error)) {
        setAuthError("Network connection issue. Please check your internet connection and try again.");
      } else {
        setAuthError(error.message || "Sign in failed. Please try again.");
      }
      
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
      
      if (isNetworkError(error)) {
        setAuthError("Network connection issue. Please check your internet connection and try again.");
      } else {
        setAuthError(error.message || "Sign up failed. Please try again.");
      }
      
      return { user: null, error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 AuthContext: Starting signOut process');
      
      // Clear profile caches
      profileManager.clearAllProfiles();
      
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
      
      // Update local state and persistent cache
      setProfile(data);
      profileManager.updateProfile(user.id, data);
      
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


  const retryProfileLoad = () => {
    if (user?.id) {
      console.log('🔄 AuthContext: Retrying profile load');
      profileManager.invalidateProfile(user.id);
      void fetchUserProfile(user.id, { force: true });
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const forceReauth = async () => {
    console.log('🔄 AuthContext: Force re-authentication requested');
    setAuthError(null);
    await forceCleanLogout();
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