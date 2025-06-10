
import { useAuth } from '@/contexts/AuthContext';
import { devLog } from '@/utils/performanceUtils';

export const useAdminGuard = (redirectOnFail: boolean = true) => {
  const { user, profile, isLoading, isAdmin } = useAuth();

  // Simple state calculation without complex effects
  const hasUser = !!user;
  const hasProfile = !!profile;
  const hasAdminAccess = isAdmin === true;

  devLog('AdminGuard state:', {
    hasUser,
    hasProfile,
    isLoading,
    hasAdminAccess,
    userType: profile?.user_type
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
