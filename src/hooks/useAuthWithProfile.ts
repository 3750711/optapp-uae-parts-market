import { useAuth } from '@/contexts/AuthContext';
import { useOptimizedProfile } from './useOptimizedProfile';

/**
 * Combined hook that provides both auth state and profile data
 * This is for components that need both and want a single hook
 */
export function useAuthWithProfile() {
  const auth = useAuth();
  const profileQuery = useOptimizedProfile();
  
  return {
    // Auth state
    user: auth.user,
    session: auth.session,
    loading: auth.loading,
    
    // Profile data
    profile: profileQuery.data || null,
    isAdmin: profileQuery.data?.user_type === 'admin' || null,
    isProfileLoading: profileQuery.isLoading,
    profileError: profileQuery.error?.message || null,
    
    // Combined loading state
    isLoading: auth.loading || (auth.user && profileQuery.isLoading),
    
    // Auth methods
    signIn: auth.signIn,
    signOut: auth.signOut,
    signUp: auth.signUp,
    updateProfile: auth.updateProfile,
    
    // Legacy compatibility
    status: auth.user ? 'authed' : 'guest',
    authError: null,
    needsFirstLoginCompletion: false,
    
    // Profile methods
    refreshProfile: profileQuery.refetch,
    retryProfileLoad: profileQuery.refetch,
    clearAuthError: () => {},
    forceReauth: auth.signOut,
    runDiagnostic: async () => {},
    completeFirstLogin: auth.completeFirstLogin,
    sendPasswordResetEmail: auth.sendPasswordResetEmail,
    updatePassword: auth.updatePassword,
    signInWithTelegram: auth.signInWithTelegram
  };
}