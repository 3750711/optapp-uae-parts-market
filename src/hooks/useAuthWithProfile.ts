import { useAuth } from '@/contexts/AuthContext';

/**
 * Combined hook that provides both auth state and profile data
 * This is for components that need both and want a single hook
 */
export function useAuthWithProfile() {
  const auth = useAuth();
  
  return {
    // Auth state
    user: auth.user,
    session: auth.session,
    loading: auth.loading,
    
    // Profile data - используем из AuthContext (уже загружен!)
    profile: auth.profile,
    isAdmin: auth.isAdmin,
    isProfileLoading: auth.isCheckingAdmin,
    profileError: null,
    
    // Combined loading state
    isLoading: auth.loading || auth.isCheckingAdmin,
    
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
    refreshProfile: async () => {}, // Profile refreshes automatically via AuthContext
    retryProfileLoad: async () => {},
    clearAuthError: () => {},
    forceReauth: auth.signOut,
    runDiagnostic: async () => {},
    completeFirstLogin: auth.completeFirstLogin,
    sendPasswordResetEmail: auth.sendPasswordResetEmail,
    updatePassword: auth.updatePassword,
    signInWithTelegram: auth.signInWithTelegram
  };
}