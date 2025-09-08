import React from 'react';
import { Navigate, useLocation } from "react-router-dom";
import { useAuthWithProfile } from "@/hooks/useAuthWithProfile";
import { useUserAccess } from "@/hooks/useUserAccess";
import EmailVerificationBanner from "./EmailVerificationBanner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  excludedRoles?: string[];
  requireEmailVerification?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  allowedRoles, 
  excludedRoles, 
  requireEmailVerification = false 
}: ProtectedRouteProps) => {
  const { user, profile, isLoading } = useAuthWithProfile();
  const { isFirstLoad } = useUserAccess();
  const location = useLocation();

  // Show loading only on first load
  if (isFirstLoad) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={`/login?from=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Profile checks (only if profile exists)
  if (profile) {
    // Check if user is blocked
    if (profile.verification_status === 'blocked') {
      return <Navigate to="/" replace />;
    }

    // Check pending approval (except for admins)
    if (profile.verification_status === 'pending' && profile.user_type !== 'admin') {
      if (location.pathname !== '/pending-approval') {
        return <Navigate to="/pending-approval" replace />;
      }
    }

    // Check profile completion for non-telegram users
    if (!profile.profile_completed && profile.auth_method !== 'telegram') {
      if (profile.user_type === 'seller' && location.pathname !== '/seller/profile') {
        return <Navigate to="/seller/profile" replace />;
      }
      if (profile.user_type === 'buyer' && location.pathname !== '/profile') {
        return <Navigate to="/profile" replace />;
      }
    }

    // Check allowed roles
    if (allowedRoles && !allowedRoles.includes(profile.user_type || '')) {
      if (profile.verification_status === 'pending') {
        return <Navigate to="/pending-approval" replace />;
      }
      if (profile.user_type === 'seller') {
        return <Navigate to="/seller/dashboard" replace />;
      }
      return <Navigate to="/" replace />;
    }

    // Check excluded roles
    if (excludedRoles && excludedRoles.includes(profile.user_type || '')) {
      if (profile.verification_status === 'pending') {
        return <Navigate to="/pending-approval" replace />;
      }
      if (profile.user_type === 'seller') {
        return <Navigate to="/seller/dashboard" replace />;
      }
      return <Navigate to="/" replace />;
    }

    // Check email verification requirement
    if (requireEmailVerification && !profile.email_confirmed) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
          <div className="container mx-auto px-4 py-8">
            <EmailVerificationBanner />
            <div className="mt-8 text-center">
              <div className="max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Подтверждение email требуется
                </h2>
                <p className="text-gray-600 mb-6">
                  Для доступа к этой странице необходимо подтвердить ваш email адрес.
                </p>
                <button
                  onClick={() => window.history.back()}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Назад
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Show email verification banner for unverified users (but still allow access)
    if (!profile.email_confirmed) {
      return (
        <>
          <div className="sticky top-0 z-50">
            <EmailVerificationBanner />
          </div>
          {children}
        </>
      );
    }
  }

  // If profile is loading, show children with optional loading indicator
  if (isLoading && !profile) {
    return (
      <div className="min-h-screen">
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white shadow-lg rounded-lg p-3 flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-gray-600">Загрузка профиля...</span>
          </div>
        </div>
        {children}
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;