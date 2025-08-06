import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { devLog } from '@/utils/logger';

interface PendingApprovalWrapperProps {
  children: React.ReactNode;
}

const PendingApprovalWrapper: React.FC<PendingApprovalWrapperProps> = ({ children }) => {
  const { user, profile, isLoading } = useAuth();

  devLog("PendingApprovalWrapper: Auth state:", { 
    user: !!user, 
    profile: !!profile, 
    isLoading,
    verificationStatus: profile?.verification_status,
    userType: profile?.user_type
  });

  // Show loading state while checking authentication
  if (isLoading) {
    devLog("PendingApprovalWrapper: Showing loading state");
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-optapp-yellow"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    devLog("PendingApprovalWrapper: User not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // If profile is still loading but user exists, show minimal loading
  if (!profile) {
    devLog("PendingApprovalWrapper: Profile still loading");
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-optapp-yellow mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Загрузка профиля...
          </h2>
          <p className="text-gray-600">
            Подождите, мы загружаем ваш профиль
          </p>
        </div>
      </div>
    );
  }

  // For Telegram users with incomplete profiles, let TelegramLoginWidget handle the modal
  // No redirect needed here as the modal will handle profile completion

  // PRIORITY 2: Check if user should be redirected from this page based on status
  if (profile.verification_status === 'verified') {
    devLog("PendingApprovalWrapper: User is verified, redirecting based on role");
    // Redirect verified users based on their role
    if (profile.user_type === 'seller') {
      return <Navigate to="/seller/dashboard" replace />;
    } else if (profile.user_type === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (profile.user_type === 'buyer') {
      return <Navigate to="/buyer-dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  if (profile.verification_status === 'blocked') {
    devLog("PendingApprovalWrapper: User is blocked, redirecting to home");
    return <Navigate to="/" replace />;
  }

  // PRIORITY 3: Only allow pending users or admins to see this page
  if (profile.verification_status !== 'pending' && profile.user_type !== 'admin') {
    devLog("PendingApprovalWrapper: User not pending approval, redirecting to home");
    return <Navigate to="/" replace />;
  }

  devLog("PendingApprovalWrapper: User authorized for pending approval page");
  return <>{children}</>;
};

export default PendingApprovalWrapper;