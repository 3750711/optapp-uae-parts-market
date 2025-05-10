
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
      // Увеличиваем задержку перед запросом профиля
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
    // Устанавливаем слушатель изменений авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event);
        
        // Обновляем локальное состояние сессии
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Увеличиваем задержку для загрузки профиля для избежания конфликтов с другими запросами
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id);
          }, 1500);
        } else {
          setProfile(null);
        }
      }
    );

    // Проверяем существующую сессию при загрузке с большей задержкой для избежания конфликтов
    const checkSession = async () => {
      try {
        // Добавляем небольшую задержку для избежания конфликтов
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          setIsLoading(false);
          return;
        }
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Увеличиваем задержку для загрузки профиля
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id);
          }, 1500);
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setIsLoading(true);
    
    try {
      // Добавляем задержку перед выходом для избежания конфликтов
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await supabase.auth.signOut();
      
      // Очищаем все состояния после выхода
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('Ошибка при выходе из системы:', error);
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
