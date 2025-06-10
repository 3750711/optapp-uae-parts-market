
import React, { createContext, useContext, useEffect, useState } from 'react';
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
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFirstLoginWelcome, setShowFirstLoginWelcome] = useState(false);

  async function fetchUserProfile(userId: string) {
    try {
      console.log("AuthContext: Fetching profile for user:", userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('AuthContext: Error fetching user profile:', error);
        return null;
      }
      
      console.log("AuthContext: Fetched profile data:", data);
      
      if (data) {
        setProfile(data);
        
        // Check if first login welcome should be shown
        if (data.email.endsWith('@g.com') && !data.first_login_completed) {
          console.log("AuthContext: First login detected for @g.com user");
          setShowFirstLoginWelcome(true);
        }
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('AuthContext: Exception while fetching profile:', error);
      return null;
    }
  }

  const refreshProfile = async () => {
    if (user) {
      console.log("AuthContext: Refreshing profile for user:", user.id);
      await fetchUserProfile(user.id);
    }
  };

  const handleFirstLoginComplete = (completed: boolean) => {
    if (completed) {
      setShowFirstLoginWelcome(false);
      refreshProfile();
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const setupAuth = async () => {
      try {
        console.log("AuthContext: Setting up authentication");
        
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
            console.log("AuthContext: Initial user found, fetching profile");
            await fetchUserProfile(currentSession.user.id);
          }
          
          setIsLoading(false);
        }
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            if (!mounted) return;
            
            console.log("AuthContext: Auth state changed:", event, currentSession?.user?.id);
            
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            
            if (currentSession?.user) {
              console.log("AuthContext: User authenticated, fetching profile");
              await fetchUserProfile(currentSession.user.id);
            } else {
              console.log("AuthContext: User not authenticated, clearing profile");
              setProfile(null);
              setShowFirstLoginWelcome(false);
            }
          }
        );

        return () => {
          console.log("AuthContext: Cleaning up auth subscription");
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
  }, []);

  const signOut = async () => {
    setIsLoading(true);
    
    try {
      console.log("AuthContext: Signing out user");
      await supabase.auth.signOut();
      
      setUser(null);
      setSession(null);
      setProfile(null);
      setShowFirstLoginWelcome(false);
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
