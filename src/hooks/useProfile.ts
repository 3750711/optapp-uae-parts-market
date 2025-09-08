import { useOptimizedProfile } from './useOptimizedProfile';

/**
 * Simple profile hook that delegates to useOptimizedProfile
 * This provides a cleaner API for components that just need profile data
 */
export function useProfile() {
  const result = useOptimizedProfile();
  
  return {
    profile: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
    // Legacy compatibility
    isAdmin: result.data?.user_type === 'admin' || null,
    isProfileLoading: result.isLoading,
    profileError: result.error?.message || null
  };
}