
import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getCachedAdminRights, setCachedAdminRights, clearAdminCache } from '@/utils/performanceUtils';
import { normalizeTelegramUsername } from '@/utils/telegramNormalization';
import { ProfileType } from '@/components/profile/types';

interface AuthContextType {
  user: User | null;
  profile: ProfileType | null;
  session: Session | null;
  isAdmin: boolean | null;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithTelegram: (authData: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<ProfileType>) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
  checkTokenValidity: () => Promise<boolean>;
  forceRefreshSession: () => Promise<boolean>;
  isLoading: boolean;
  isProfileLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // Функция создания базового профиля
  const createBasicProfile = useCallback(async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Creating basic profile for user:', userId);
      
      const basicProfile = {
        id: userId,
        email: user.email || '',
        auth_method: 'email',
        user_type: 'buyer' as const,
        email_confirmed: false,
        profile_completed: false
      };

      const { error } = await supabase
        .from('profiles')
        .insert(basicProfile);

      if (error) {
        console.error('Error creating basic profile:', error);
        return;
      }

      // Update state with the new profile
      setProfile(basicProfile as ProfileType);
      setIsAdmin(false);
      console.log('Basic profile created successfully');
    } catch (error) {
      console.error('Error in createBasicProfile:', error);
    }
  }, []);

  // Оптимизированная функция загрузки профиля с кэшированием
  const fetchUserProfile = useCallback(async (userId: string, retryCount = 0) => {
    console.log('🔧 AuthContext: fetchUserProfile called', { userId, retryCount });
    setIsProfileLoading(true);
    try {
      // Проверяем кэш админских прав
      const cachedAdminRights = getCachedAdminRights(userId);
      if (cachedAdminRights !== null) {
        setIsAdmin(cachedAdminRights);
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setIsProfileLoading(false);
        return;
      }

      if (data) {
        console.log('🔧 AuthContext: Profile found', { userType: data.user_type, verificationStatus: data.verification_status });
        setProfile(data);
        const adminStatus = data.user_type === 'admin';
        setIsAdmin(adminStatus);
        // Кэшируем результат
        setCachedAdminRights(userId, adminStatus);
      } else {
        // Profile doesn't exist yet - for new users (especially Telegram users)
        console.log('Profile not found for user:', userId);
        setProfile(null);
        setIsAdmin(false);
        
        // Retry mechanism for new users - wait a bit and try again
        if (retryCount < 3) {
          console.log(`Retrying profile fetch (attempt ${retryCount + 1}/3) in 1 second...`);
          setTimeout(() => {
            fetchUserProfile(userId, retryCount + 1);
          }, 1000);
          return; // Don't set loading to false yet
        } else {
          console.log('Profile still not found after retries. Creating basic profile...');
          // Try to create a basic profile for email users
          await createBasicProfile(userId);
        }
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    } finally {
      console.log('🔧 AuthContext: fetchUserProfile completed');
      setIsProfileLoading(false);
    }
  }, [createBasicProfile]);

  // Функция для обновления профиля
  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  }, [user, fetchUserProfile]);

  // Функция для обновления админского статуса
  const refreshAdminStatus = useCallback(async () => {
    if (user) {
      clearAdminCache();
      await fetchUserProfile(user.id);
    }
  }, [user, fetchUserProfile]);

  // Функция проверки валидности токена
  const checkTokenValidity = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.log('No access token found');
        return false;
      }

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      const tokenExpiry = session.expires_at || 0;
      
      if (now >= tokenExpiry) {
        console.log('Token has expired');
        return false;
      }

      // Test token with a simple request
      const { error } = await supabase.auth.getUser();
      if (error) {
        console.log('Token validation failed:', error.message);
        return false;
      }

      console.log('Token is valid');
      return true;
    } catch (error) {
      console.error('Error checking token validity:', error);
      return false;
    }
  }, []);

  // Функция принудительного обновления сессии
  const forceRefreshSession = useCallback(async () => {
    try {
      console.log('Forcing session refresh...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Failed to refresh session:', error);
        return false;
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        console.log('Session refreshed successfully');
        return true;
      }

      console.log('No session returned from refresh');
      return false;
    } catch (error) {
      console.error('Error during session refresh:', error);
      return false;
    }
  }, []);

  // Мемоизированная функция обновления профиля с безопасностью
  const updateProfile = useCallback(async (updates: Partial<ProfileType>) => {
    if (!user) return { error: 'No user logged in' };

    try {
      // Normalize telegram username if it's being updated
      const normalizedUpdates = { ...updates };
      if (normalizedUpdates.telegram) {
        normalizedUpdates.telegram = normalizeTelegramUsername(normalizedUpdates.telegram);
      }

      // Check if we're trying to update sensitive fields
      const sensitiveFields = ['user_type', 'verification_status', 'is_trusted_seller'];
      const hasSensitiveUpdates = sensitiveFields.some(field => field in normalizedUpdates);

      if (hasSensitiveUpdates) {
        // Use secure RPC function for sensitive updates
        const { data, error } = await supabase.rpc('secure_update_profile', {
          p_user_id: user.id,
          p_updates: normalizedUpdates
        });

        if (error) throw error;
        
        if (!data?.success) {
          throw new Error(data?.message || 'Failed to update profile');
        }
      } else {
        // Use direct update for non-sensitive fields
        const { error } = await supabase
          .from('profiles')
          .update(normalizedUpdates)
          .eq('id', user.id);

        if (error) throw error;
      }

      setProfile(prev => prev ? { ...prev, ...normalizedUpdates } : null);
      
      // Обновляем кэш если изменился user_type
      if (normalizedUpdates.user_type) {
        const adminStatus = normalizedUpdates.user_type === 'admin';
        setIsAdmin(adminStatus);
        setCachedAdminRights(user.id, adminStatus);
      }

      return { error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error };
    }
  }, [user]);

  useEffect(() => {
    console.log('🔧 AuthContext: useEffect triggered');
    
    // Получаем текущую сессию
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔧 AuthContext: Initial session check', { 
        hasSession: !!session, 
        hasUser: !!session?.user,
        userId: session?.user?.id 
      });
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('🔧 AuthContext: User found, fetching profile for:', session.user.id);
        // Используем setTimeout для предотвращения блокировки
        setTimeout(() => {
          fetchUserProfile(session.user.id);
        }, 0);
      } else {
        console.log('🔧 AuthContext: No user found, clearing state');
        setProfile(null);
        setIsAdmin(null);
        setIsLoading(false);
      }
    });

    // Слушаем изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔧 AuthContext: Auth state change', { 
        event, 
        hasSession: !!session, 
        hasUser: !!session?.user,
        userId: session?.user?.id 
      });
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('🔧 AuthContext: User in auth change, fetching profile for:', session.user.id);
        // Используем setTimeout для предотвращения блокировки
        setTimeout(() => {
          fetchUserProfile(session.user.id);
        }, 0);
      } else {
        console.log('🔧 AuthContext: No user in auth change, clearing state');
        setProfile(null);
        setIsAdmin(null);
        clearAdminCache();
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile, createBasicProfile]);

  const signUp = useCallback(async (email: string, password: string, userData?: any) => {
    const redirectUrl = `${window.location.origin}/`;
    
    // Ensure we pass auth_method for email registration
    const enhancedUserData = {
      auth_method: 'email',
      ...userData
    };
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: enhancedUserData
      }
    });
    
    return { error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  }, []);

  const signInWithTelegram = useCallback(async (authData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('telegram-widget-auth', {
        body: { authData }
      });

      if (error) {
        return { error };
      }

      if (!data.success) {
        return { error: new Error(data.error || 'Authentication failed') };
      }

      // Set session using the tokens from the response
      if (data.accessToken && data.refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.accessToken,
          refresh_token: data.refreshToken
        });

        if (sessionError) {
          return { error: sessionError };
        }
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      clearAdminCache();
      // Проверяем есть ли активная сессия перед попыткой выхода
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.signOut();
      }
      // Принудительно очищаем состояние даже если signOut не сработал
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsAdmin(null);
    } catch (error) {
      console.error('Error during sign out:', error);
      // Очищаем состояние даже в случае ошибки
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsAdmin(null);
    }
  }, []);

  // Мемоизируем значение контекста
  const contextValue = useMemo(() => ({
    user,
    profile,
    session,
    isAdmin,
    signUp,
    signIn,
    signInWithTelegram,
    signOut,
    updateProfile,
    refreshProfile,
    refreshAdminStatus,
    checkTokenValidity,
    forceRefreshSession,
    isLoading,
    isProfileLoading
  }), [user, profile, session, isAdmin, signUp, signIn, signInWithTelegram, signOut, updateProfile, refreshProfile, refreshAdminStatus, checkTokenValidity, forceRefreshSession, isLoading, isProfileLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
