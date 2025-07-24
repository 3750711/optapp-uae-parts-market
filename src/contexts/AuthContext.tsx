
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

  // Мемоизированная функция обновления профиля
  const updateProfile = useCallback(async (updates: Partial<ProfileType>) => {
    if (!user) return { error: 'No user logged in' };

    try {
      // Normalize telegram username if it's being updated
      const normalizedUpdates = { ...updates };
      if (normalizedUpdates.telegram) {
        normalizedUpdates.telegram = normalizeTelegramUsername(normalizedUpdates.telegram);
      }

      const { error } = await supabase
        .from('profiles')
        .update(normalizedUpdates)
        .eq('id', user.id);

      if (error) throw error;

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
    // Получаем текущую сессию
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Используем setTimeout для предотвращения блокировки
        setTimeout(() => {
          fetchUserProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
        setIsAdmin(null);
        setIsLoading(false);
      }
    });

    // Слушаем изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Используем setTimeout для предотвращения блокировки
        setTimeout(() => {
          fetchUserProfile(session.user.id);
        }, 0);
      } else {
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
    isLoading,
    isProfileLoading
  }), [user, profile, session, isAdmin, signUp, signIn, signInWithTelegram, signOut, updateProfile, refreshProfile, refreshAdminStatus, isLoading, isProfileLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
