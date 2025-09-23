import React, { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logUserLogin, logUserLogout } from '@/utils/activityLogger';

type ProfileUpdate = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  company_name?: string;
  location?: string;
  description_user?: string;
  telegram?: string;
  preferred_locale?: string;
  first_login_completed?: boolean;
  profile_completed?: boolean;
  accepted_terms?: boolean;
  accepted_privacy?: boolean;
};

type AuthActionsContextType = {
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: any }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, options?: any) => Promise<{ user: User | null; error: any }>;
  updateProfile: (updates: ProfileUpdate) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  signInWithTelegram: (authData: any) => Promise<{ user: User | null; error: any; telegramData?: any }>;
  completeFirstLogin: () => Promise<void>;
};

const AuthActionsContext = createContext<AuthActionsContextType | null>(null);

export const useAuthActions = () => {
  const context = useContext(AuthActionsContext);
  if (!context) {
    throw new Error('useAuthActions must be used within AuthActionsProvider');
  }
  return context;
};

export function AuthActionsProvider({ children }: { children: React.ReactNode }) {
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      
      if (data.user && !error) {
        await logUserLogin(data.user.id, 'email');
      }
      
      return { user: data.user, error };
    } catch (error) {
      console.error('[AuthActions] Sign in error:', error);
      return { user: null, error };
    }
  };

  const signOut = async () => {
    try {
      await logUserLogout();
      const { error } = await supabase.auth.signOut();
      if (error) console.error('[AuthActions] Sign out error:', error);
    } catch (error) {
      console.error('[AuthActions] Sign out error:', error);
    }
  };

  const signUp = async (email: string, password: string, options?: any) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          ...options,
        }
      });
      
      return { user: data.user, error };
    } catch (error) {
      console.error('[AuthActions] Sign up error:', error);
      return { user: null, error };
    }
  };

  const updateProfile = async (updates: ProfileUpdate) => {
    const { error } = await supabase.auth.updateUser({
      data: updates
    });
    
    if (error) {
      console.error('[AuthActions] Profile update error:', error);
      throw error;
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  const signInWithTelegram = async (authData: any) => {
    // Placeholder - implement Telegram auth logic
    return { user: null, error: new Error('Telegram auth not implemented') };
  };

  const completeFirstLogin = async () => {
    await updateProfile({ first_login_completed: true });
  };

  return (
    <AuthActionsContext.Provider value={{
      signIn,
      signOut,
      signUp,
      updateProfile,
      sendPasswordResetEmail,
      updatePassword,
      signInWithTelegram,
      completeFirstLogin,
    }}>
      {children}
    </AuthActionsContext.Provider>
  );
}