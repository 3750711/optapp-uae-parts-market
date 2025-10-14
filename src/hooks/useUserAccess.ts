import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';

const LAST_ROLE_KEY = 'pb:lastRole';

export function useUserAccess() {
  const { session, loading, profile } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;
  
  // Мемоизация для предотвращения лишних ре-рендеров
  const result = React.useMemo(() => {
    // Priority: profile from AuthContext -> JWT metadata -> sessionStorage
    const r1 = profile?.user_type || profile?.role;
    const r2 = (session?.user?.app_metadata as any)?.role || (session?.user?.user_metadata as any)?.role;
    const r3 = typeof window !== 'undefined' ? sessionStorage.getItem(LAST_ROLE_KEY) || undefined : undefined;
    
    const role = r1 || r2 || r3;
    
    // Cache last known role for faster subsequent loads
    if (role && typeof window !== 'undefined') {
      try { 
        sessionStorage.setItem(LAST_ROLE_KEY, String(role)); 
      } catch {}
    }
    
    // First load only if authentication is still loading AND no role found anywhere
    const isFirstLoad = loading && !r1 && !r2 && !r3;
    
    return { role, isFirstLoad, isAdmin: role === 'admin' };
  }, [profile?.user_type, profile?.role, session?.user?.app_metadata, session?.user?.user_metadata, loading]);
  
  return result;
}