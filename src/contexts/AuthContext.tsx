
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
      console.log("Attempting to fetch profile for user:", userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      console.log("Fetched profile data:", data);
      
      if (data) {
        setProfile(data);
      } else {
        console.error('No profile data found for user:', userId);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  useEffect(() => {
    const setupAuth = async () => {
      try {
        setIsLoading(true);
        
        // First, set up the auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            console.log("Auth state changed:", event);
            
            // Update local session state
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            
            // Handle profile fetch after session change
            if (currentSession?.user) {
              // Use setTimeout to avoid potential auth deadlocks
              setTimeout(() => {
                fetchUserProfile(currentSession.user.id);
              }, 100);
            } else {
              setProfile(null);
            }
          }
        );

        // Then check for existing session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Fetch user profile with delay to avoid potential auth conflicts
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id);
          }, 100);
        }
        
        return () => subscription.unsubscribe();
      } catch (error) {
        console.error("Error setting up auth:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    setupAuth();
  }, []);

  const signOut = async () => {
    setIsLoading(true);
    
    try {
      await supabase.auth.signOut();
      
      // Clear all states after logout
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('Error during sign out:', error);
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
