
import { useAuth } from '@/contexts/AuthContext';
import { devLog } from '@/utils/performanceUtils';

export const useAdminGuard = (redirectOnFail: boolean = true) => {
  const { user, profile, isLoading: authLoading, isAdmin, isCheckingAdmin } = useAuth();

  // Simple state calculation without complex effects
  const isLoading = authLoading || isCheckingAdmin;
  const hasUser = !!user;
  const hasProfile = !!profile;
  const hasAdminAccess = isAdmin === true;

  devLog('AdminGuard state:', {
    hasUser,
    hasProfile,
    isLoading,
    hasAdminAccess
  });

  return {
    isAdmin,
    isChecking: isLoading,
    hasAdminAccess,
    needsLogin: !hasUser && !isLoading,
    needsProfile: hasUser && !hasProfile && !isLoading,
    accessDenied: hasUser && hasProfile && !hasAdminAccess && !isLoading
  };
};
