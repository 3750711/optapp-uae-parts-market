import React, { memo, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ProfileLoadingFallback from "./ProfileLoadingFallback";

interface FastProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const FastProtectedRoute = memo(({ children, allowedRoles }: FastProtectedRouteProps) => {
  const { user, profile, isLoading, isProfileLoading, profileError, retryProfileLoad } = useAuth();
  const location = useLocation();
  const [profileTimeout, setProfileTimeout] = useState(false);

  // Таймаут для определения зависания загрузки профиля
  useEffect(() => {
    if (user && !profile && isProfileLoading) {
      const timeoutId = setTimeout(() => {
        setProfileTimeout(true);
      }, 15000); // 15 секунд

      return () => {
        clearTimeout(timeoutId);
        setProfileTimeout(false);
      };
    } else {
      setProfileTimeout(false);
    }
  }, [user, profile, isProfileLoading]);
  
  // Ultra-fast loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Quick auth check
  if (!user) {
    return <Navigate to={`/login?from=${encodeURIComponent(location.pathname)}`} replace />;
  }
  
  // Profile loading check with timeout and error handling
  if (!profile) {
    // Показываем fallback UI если есть ошибка или таймаут
    if (profileError || profileTimeout) {
      return (
        <ProfileLoadingFallback
          onRetry={retryProfileLoad}
          error={profileError || (profileTimeout ? "Загрузка профиля занимает слишком много времени" : null)}
          isLoading={isProfileLoading}
        />
      );
    }

    // Обычный лоадер для быстрой загрузки
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Block unverified users (except admins)
  if (profile.user_type !== 'admin' && profile.verification_status !== 'verified') {
    return <Navigate to="/pending-approval" replace />;
  }
  
  // Quick role check for seller dashboard
  if (allowedRoles && !allowedRoles.includes(profile.user_type)) {
    if (profile.user_type === 'seller') {
      return <Navigate to="/seller/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
});

FastProtectedRoute.displayName = "FastProtectedRoute";

export default FastProtectedRoute;