import React, { createContext, useContext, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from './AuthSessionContext';

type AuthProfileContextType = {
  profile: any;
  isAdmin: boolean;
  isCheckingAdmin: boolean;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
};

const AuthProfileContext = createContext<AuthProfileContextType | null>(null);

export const useAuthProfile = () => {
  const context = useContext(AuthProfileContext);
  if (!context) {
    throw new Error('useAuthProfile must be used within AuthProfileProvider');
  }
  return context;
};

export function AuthProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthSession();
  const queryClient = useQueryClient();

  // Optimized profile query with AbortController
  const profileQuery = useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user?.id,
    queryFn: async ({ signal }) => {
      if (!user?.id) throw new Error('No user ID available');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .abortSignal(signal)
        .single();
      
      if (error) throw error;
      return data;
    },
    staleTime: 300000, // 5 minutes
    gcTime: 300000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    networkMode: 'online',
    retry: (failureCount, error: any) => {
      // Don't retry on abort or 4xx errors
      if (error?.name === 'AbortError' || (error?.status >= 400 && error?.status < 500)) {
        return false;
      }
      return failureCount < 1;
    },
  });

  const profile = profileQuery.data || null;
  const isAdmin = profile?.user_type === 'admin';
  const isCheckingAdmin = !!user && profileQuery.isLoading;

  // Clear profile cache if user disappears
  useEffect(() => {
    if (!user && profileQuery.data) {
      console.warn('[AuthProfile] Clearing stale profile data');
      queryClient.removeQueries({ queryKey: ['profile'] });
    }
  }, [user, profileQuery.data, queryClient]);

  const refreshProfile = async () => {
    if (user?.id) {
      await queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
    }
  };

  return (
    <AuthProfileContext.Provider value={{
      profile,
      isAdmin,
      isCheckingAdmin,
      profileError: profileQuery.error?.message || null,
      refreshProfile,
    }}>
      {children}
    </AuthProfileContext.Provider>
  );
}