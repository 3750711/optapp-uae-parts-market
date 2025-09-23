import React from 'react';
import { AuthSessionProvider, useAuthSession } from './AuthSessionContext';
import { AuthProfileProvider, useAuthProfile } from './AuthProfileContext';
import { AuthActionsProvider, useAuthActions } from './AuthActionsContext';

// Unified hook that combines all auth contexts
export const useAuth = () => {
  const session = useAuthSession();
  const profile = useAuthProfile();
  const actions = useAuthActions();

  return {
    // Core state
    user: session.user,
    session: session.session,
    loading: session.loading,
    status: session.status,
    
    // Profile state
    profile: profile.profile,
    isAdmin: profile.isAdmin,
    isCheckingAdmin: profile.isCheckingAdmin,
    
    // Actions
    signIn: actions.signIn,
    signOut: actions.signOut,
    signUp: actions.signUp,
    updateProfile: actions.updateProfile,
    sendPasswordResetEmail: actions.sendPasswordResetEmail,
    updatePassword: actions.updatePassword,
    signInWithTelegram: actions.signInWithTelegram,
    completeFirstLogin: actions.completeFirstLogin,
    
    // Legacy compatibility
    isLoading: session.loading,
    isProfileLoading: profile.isCheckingAdmin,
    profileError: profile.profileError,
    authError: null,
    needsFirstLoginCompletion: false,
    refreshProfile: profile.refreshProfile,
    retryProfileLoad: () => {},
    clearAuthError: () => {},
    forceReauth: actions.signOut,
    runDiagnostic: async () => {},
    
    // Recovery mode (simplified for now)
    isRecoveryMode: false,
    clearRecoveryMode: () => {},
    validateRecoveryAndResetPassword: async () => ({ success: false }),
  };
};

export function OptimizedAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthSessionProvider>
      <AuthActionsProvider>
        <AuthProfileProvider>
          {children}
        </AuthProfileProvider>
      </AuthActionsProvider>
    </AuthSessionProvider>
  );
}