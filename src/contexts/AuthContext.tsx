
import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getCachedAdminRights, setCachedAdminRights, clearAdminCache } from '@/utils/performanceUtils';

interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  user_type?: 'admin' | 'seller' | 'buyer';
  opt_id?: string;
  telegram?: string;
  rating?: number;
  location?: string;
  verification_status?: string;
  opt_status?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  description_user?: string;
  communication_ability?: number;
  created_at?: string;
  first_login_completed?: boolean;
  fts?: unknown;
  listing_count?: number;
  last_login?: string;
  email_confirmed?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isAdmin: boolean | null;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // Оптимизированная функция загрузки профиля с кэшированием
  const fetchUserProfile = useCallback(async (userId: string) => {
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
        .single();

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
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

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
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user logged in' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      // Обновляем кэш если изменился user_type
      if (updates.user_type) {
        const adminStatus = updates.user_type === 'admin';
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
  }, [fetchUserProfile]);

  const signUp = useCallback(async (email: string, password: string, userData?: any) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData
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
    signOut,
    updateProfile,
    refreshProfile,
    refreshAdminStatus,
    isLoading,
    isProfileLoading
  }), [user, profile, session, isAdmin, signUp, signIn, signOut, updateProfile, refreshProfile, refreshAdminStatus, isLoading, isProfileLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
