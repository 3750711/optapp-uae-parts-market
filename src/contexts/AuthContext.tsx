import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { checkSessionSoft } from '@/auth/authSessionManager';
import { decodeJwt } from '@/auth/jwtHelpers';

type AuthStatus = 'checking' | 'guest' | 'authed' | 'error';

type Profile = {
  id: string;
  email: string;
  user_type: 'admin' | 'seller' | 'buyer';
  verification_status?: string;
  preferred_locale?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  profile_completed?: boolean;
  first_login_completed?: boolean;
  full_name?: string;
  company_name?: string;
  location?: string;
  description_user?: string;
  telegram?: string;
  telegram_id?: string;
  opt_id?: string;
  opt_status?: string;
  auth_method?: string;
  email_confirmed?: boolean;
  accepted_terms?: boolean;
  accepted_privacy?: boolean;
  avatar_url?: string;
  is_trusted_seller?: boolean;
  created_at?: string;
  updated_at?: string;
};

type AuthContextType = {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean | null;
  // Backward compatibility properties
  isLoading: boolean;
  isProfileLoading: boolean;
  profileError: string | null;
  authError: string | null;
  needsFirstLoginCompletion: boolean;
  // Core methods
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: any }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, options?: any) => Promise<{ user: User | null; error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: (forceRefresh?: boolean) => Promise<void>;
  // Additional methods for backward compatibility
  sendPasswordResetEmail: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  signInWithTelegram: (authData: any) => Promise<{ user: User | null; error: any }>;
  retryProfileLoad: () => void;
  clearAuthError: () => void;
  forceReauth: () => Promise<void>;
  completeFirstLogin: () => Promise<void>;
  runDiagnostic: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);
export const useAuth = () => useContext(AuthContext)!;

async function fetchProfileReliable(userId: string, abort: AbortSignal): Promise<Profile | null> {
  const tryOnce = async () => {
    const { data, error } = await supabase.from('profiles')
      .select('*')
      .eq('id', userId).single();
    if (error) throw error;
    return data as Profile;
  };
  
  const delays = [0, 300, 800];
  for (const delay of delays) {
    if (abort.aborted) throw new DOMException('aborted', 'AbortError');
    if (delay) await new Promise(r => setTimeout(r, delay));
    try { 
      return await tryOnce(); 
    } catch (error) {
      // Continue to next retry unless this is the last attempt
      if (delay === 800) throw error;
    }
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const profileAbortRef = useRef<AbortController | null>(null);

  // isAdmin зависит только от текущего профиля
  const isAdmin = useMemo<boolean | null>(() => {
    if (profile === null) return null;
    return profile?.user_type === 'admin';
  }, [profile?.user_type, profile === null]);

  // helper: безопасно загрузить профиль с таймаутом
  const loadProfile = async (uid: string) => {
    profileAbortRef.current?.abort();
    const ctrl = new AbortController();
    profileAbortRef.current = ctrl;
    const timeout = setTimeout(() => ctrl.abort(), 5000); // 5s верхняя граница
    
    setIsProfileLoading(true);
    setProfileError(null);
    
    try {
      if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
        console.debug('[AUTH] Loading profile for user:', uid);
      }
      
      const p = await fetchProfileReliable(uid, ctrl.signal);
      if (p) {
        setProfile(p);
        if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
          console.debug('[AUTH] Profile loaded successfully');
        }
      } else {
        setProfile(null);
        setProfileError('Profile not found');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.warn('[AUTH] Profile load failed:', error);
        setProfileError(error.message || 'Failed to load profile');
      }
      // Don't break auth state on profile load failure
    } finally { 
      setIsProfileLoading(false);
      clearTimeout(timeout); 
    }
  };

  // Подписка СНАЧАЛА, затем чтение текущей сессии
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
        console.debug('[AUTH] event:', event, !!newSession);
      }

      if (event === 'SIGNED_IN') {
        setSession(newSession);
        setUser(newSession!.user);
        setStatus('authed');
        await loadProfile(newSession!.user.id);        // ← грузим профиль ТОЛЬКО здесь
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        // профиль НЕ перезагружаем
        return;
      }

      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setUser(null); 
        setSession(null); 
        setProfile(null);
        setStatus('guest');
        return;
      }

      if (event === 'INITIAL_SESSION') {
        // не дергаем ни коннекты, ни профили; статус решит первичная инициализация ниже
        return;
      }
    });

    // первичная инициализация
    (async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      const verdict = checkSessionSoft(s);
      
      if (!s || !verdict.ok) {
        setUser(null); 
        setSession(null); 
        setProfile(null);
        setStatus('guest');                                // нормальная гостевая ветка
        if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
          console.debug('[AUTH] No valid session, setting guest status');
        }
        return;
      }
      
      setSession(s);
      setUser(s.user);
      setStatus('authed');
      await loadProfile(s.user.id);
      
      if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
        console.debug('[AUTH] Session restored, user authenticated');
      }
    })();

    return () => { 
      try { 
        subscription.unsubscribe(); 
      } catch {} 
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setAuthError(null);
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error; 
      return { user: data.user, error: null };
    } catch (error) {
      setAuthError(error.message || 'Sign in failed');
      return { user: null, error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut(); 
    // остальное почистит onAuthStateChange
  };

  const signUp = async (email: string, password: string, options?: any) => {
    try {
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
      return { user: null, error };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user?.id) throw new Error("User not authenticated");
    
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();
      
    if (error) throw error;
    
    // Update local state
    setProfile(data);
  };

  const refreshProfile = async (forceRefresh = false) => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  };

  // Additional methods for backward compatibility
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
      loadProfile(user.id);
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
      
      await refreshProfile(); // Refresh to get updated profile
      console.log('✅ AuthContext: First login setup completed');
      
    } catch (error) {
      console.error('❌ AuthContext: Error completing first login:', error);
      setAuthError('Failed to complete setup. Please try again.');
    }
  };

  const runDiagnostic = async () => {
    console.log('🔍 AuthContext: Running authentication diagnostic');
    // Add diagnostic implementation here if needed
  };

  const value = useMemo<AuthContextType>(() => ({
    status, 
    user, 
    session, 
    profile, 
    isAdmin,
    isLoading: status === 'checking',
    isProfileLoading,
    profileError,
    authError,
    needsFirstLoginCompletion: false, // Always disabled as per old logic
    signIn, 
    signOut,
    signUp,
    updateProfile,
    refreshProfile,
    sendPasswordResetEmail,
    updatePassword,
    signInWithTelegram,
    retryProfileLoad,
    clearAuthError,
    forceReauth,
    completeFirstLogin,
    runDiagnostic
  }), [status, user, session, profile, isAdmin, isProfileLoading, profileError, authError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}