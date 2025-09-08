import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

const LAST_ROLE_KEY = 'pb:lastRole';

export function useUserAccess() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;
  
  // Priority: cached profile -> JWT metadata -> sessionStorage
  const cached = queryClient.getQueryData(['profile', userId ?? '']) as any;
  const r1 = cached?.user_type || cached?.role;
  const r2 = (session?.user?.app_metadata as any)?.role || (session?.user?.user_metadata as any)?.role;
  const r3 = typeof window !== 'undefined' ? sessionStorage.getItem(LAST_ROLE_KEY) || undefined : undefined;
  
  const role = r1 || r2 || r3;
  
  // Cache last known role for faster subsequent loads
  if (role && typeof window !== 'undefined') {
    try { 
      sessionStorage.setItem(LAST_ROLE_KEY, String(role)); 
    } catch {}
  }
  
  // First load only if no role found anywhere
  const isFirstLoad = !r1 && !r2 && !r3;
  
  return { role, isFirstLoad, isAdmin: role === 'admin' };
}