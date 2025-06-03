
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchUserProfile(userId: string) {
    try {
      console.log("AuthContext: Attempting to fetch profile for user:", userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('AuthContext: Error fetching user profile:', error);
        return;
      }
      
      console.log("AuthContext: Fetched profile data:", data);
      
      if (data) {
        setProfile(data);
      } else {
        console.error('AuthContext: No profile data found for user:', userId);
      }
    } catch (error) {
      console.error('AuthContext: Exception while fetching profile:', error);
    }
  }

  const refreshProfile = async () => {
    if (user) {
      console.log("AuthContext: Refreshing profile for user:", user.id);
      await fetchUserProfile(user.id);
    }
  };

  useEffect(() => {
    const setupAuth = async () => {
      try {
        setIsLoading(true);
        console.log("AuthContext: Setting up authentication");
        
        // First, set up the auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            console.log("AuthContext: Auth state changed:", event, currentSession?.user?.id);
            
            // Update local session state
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            
            // Handle profile fetch after session change
            if (currentSession?.user) {
              console.log("AuthContext: User authenticated, fetching profile");
              // Use setTimeout to avoid potential auth deadlocks
              setTimeout(() => {
                fetchUserProfile(currentSession.user.id);
              }, 100);
            } else {
              console.log("AuthContext: User not authenticated, clearing profile");
              setProfile(null);
            }
            
            // Only set isLoading to false after we've handled the auth state change
            setIsLoading(false);
          }
        );

        // Then check for existing session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("AuthContext: Error getting session:", error);
        } else {
          console.log("AuthContext: Initial session check:", currentSession?.user?.id);
        }
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          console.log("AuthContext: Initial user found, fetching profile");
          // Fetch user profile with delay to avoid potential auth conflicts
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id);
          }, 100);
        }
        
        // Set loading to false after initial session check
        setIsLoading(false);
        
        return () => {
          console.log("AuthContext: Cleaning up auth subscription");
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("AuthContext: Error setting up auth:", error);
        // Ensure we set loading to false even if there's an error
        setIsLoading(false);
      }
    };
    
    setupAuth();
  }, []);

  const signOut = async () => {
    setIsLoading(true);
    
    try {
      console.log("AuthContext: Signing out user");
      await supabase.auth.signOut();
      
      // Clear all states after logout
      setUser(null);
      setSession(null);
      setProfile(null);
      console.log("AuthContext: Sign out successful");
    } catch (error) {
      console.error('AuthContext: Error during sign out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      isLoading, 
      signOut,
      refreshProfile 
    }}>
      {children}
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
