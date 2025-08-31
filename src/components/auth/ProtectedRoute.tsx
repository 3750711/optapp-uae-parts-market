
import React from 'react';
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { devLog } from "@/utils/logger";
import EmailVerificationBanner from "./EmailVerificationBanner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  excludedRoles?: string[];
  requireEmailVerification?: boolean;
}

const ProtectedRoute = ({ children, allowedRoles, excludedRoles, requireEmailVerification = false }: ProtectedRouteProps) => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();
  
  // Development mode check for reduced logging
  const isDevelopment = import.meta.env.DEV;
  
  // Мемоизируем вычисления для оптимизации производительности
  const authChecks = React.useMemo(() => {
    return {
      hasUser: !!user,
      hasProfile: !!profile,
      userType: profile?.user_type,
      verificationStatus: profile?.verification_status,
      profileCompleted: profile?.profile_completed,
      authMethod: profile?.auth_method,
      isEmailConfirmed: profile?.email_confirmed
    };
  }, [user, profile]);

  // ✅ ИСПРАВЛЕНИЕ: Защита от дублирования toast с useRef
  const didToast = React.useRef(false);
  React.useEffect(() => {
    // Показываем toast только для заблокированных пользователей
    if (authChecks.verificationStatus === 'blocked' && authChecks.hasProfile && !didToast.current) {
      didToast.current = true;
      toast.error("Доступ ограничен. Ваш аккаунт заблокирован.");
    }
  }, [authChecks.verificationStatus, authChecks.hasProfile]);
  
  // Detailed logging for debugging (reduced in production)
  if (isDevelopment) {
    console.log('🔒 ProtectedRoute: Detailed auth check:', {
      path: location.pathname,
      hasUser: authChecks.hasUser,
      hasProfile: authChecks.hasProfile,
      userType: authChecks.userType,
      verificationStatus: authChecks.verificationStatus,
      profileCompleted: authChecks.profileCompleted,
      emailConfirmed: authChecks.isEmailConfirmed,
      allowedRoles,
      excludedRoles,
      requireEmailVerification,
      isLoading,
      timestamp: new Date().toISOString()
    });
  }
  
  if (isDevelopment) {
    console.log('🔍 ProtectedRoute: Auth state:', {
      user: !!user,
      profile: !!profile,
      isLoading,
      userType: profile?.user_type,
      pathname: location.pathname,
      profileCompleted: authChecks.profileCompleted
    });
  }
  
  // Show minimal loading state while checking authentication
  if (isLoading) {
    devLog("ProtectedRoute: Showing loading state");
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // КРИТИЧНО: Проверка завершенности профиля (переносим из ProfileCompletionRedirect)
  if (authChecks.hasUser && authChecks.hasProfile && !authChecks.profileCompleted && authChecks.authMethod !== 'telegram') {
    console.log("🔄 ProtectedRoute: Incomplete profile detected, redirecting to completion", {
      userId: user?.id,
      profileCompleted: authChecks.profileCompleted,
      authMethod: authChecks.authMethod,
      currentPath: location.pathname,
      timestamp: new Date().toISOString()
    });
    
    // Для неполных профилей продавцов - перенаправляем на заполнение профиля продавца
    if (authChecks.userType === 'seller' && location.pathname !== '/seller/profile') {
      return <Navigate to="/seller/profile" replace />;
    }
    
    // Для неполных профилей покупателей - перенаправляем на профиль
    if (authChecks.userType === 'buyer' && location.pathname !== '/profile') {
      return <Navigate to="/profile" replace />;
    }
  }
  
  // Redirect to login if not authenticated
  if (!authChecks.hasUser) {
    devLog("ProtectedRoute: User not authenticated, redirecting to login");
    return <Navigate to={`/login?from=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // For Telegram users with incomplete profiles, let TelegramLoginWidget handle the modal
  // No redirect needed here as the modal will handle profile completion
  
  // If profile is still loading but user exists, show minimal loading
  if (!authChecks.hasProfile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Настройка профиля...
          </h2>
          <p className="text-gray-600">
            Подождите, мы создаем ваш профиль
          </p>
        </div>
      </div>
    );
  }
  
  // Check if user is blocked
  if (authChecks.verificationStatus === 'blocked') {
    devLog("ProtectedRoute: User is blocked");
    return <Navigate to="/" replace />;
  }

  // PRIORITY 2: Check if user is pending approval (except for admins) - STRICT CHECK
  if (authChecks.verificationStatus === 'pending' && authChecks.userType !== 'admin') {
    // Allow access only to pending-approval page
    if (location.pathname !== '/pending-approval') {
      devLog("ProtectedRoute: User is pending approval, redirecting to pending approval");
      return <Navigate to="/pending-approval" replace />;
    }
  }
  
  // Check for role restrictions if provided
  if (allowedRoles && !allowedRoles.includes(authChecks.userType || '')) {
    devLog("ProtectedRoute: User doesn't have required role");
    // Always check verification status before redirecting to role-specific pages
    if (authChecks.verificationStatus === 'pending') {
      return <Navigate to="/pending-approval" replace />;
    }
    // Redirect verified sellers to their dashboard, others to home
    if (authChecks.userType === 'seller') {
      return <Navigate to="/seller/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }
  
  // Check for excluded roles if provided
  if (excludedRoles && excludedRoles.includes(authChecks.userType || '')) {
    devLog("ProtectedRoute: User role is excluded from this page");
    // Always check verification status before redirecting to role-specific pages
    if (authChecks.verificationStatus === 'pending') {
      return <Navigate to="/pending-approval" replace />;
    }
    // Redirect verified sellers to their dashboard, others to home
    if (authChecks.userType === 'seller') {
      return <Navigate to="/seller/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }
  
  // Check for email verification if required
  if (requireEmailVerification && !authChecks.isEmailConfirmed) {
    devLog("ProtectedRoute: Email verification required but not confirmed");
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

  if (isDevelopment) {
    console.log('🔍 ProtectedRoute: User authenticated and authorized, rendering children');
  }
  
  // Show email verification banner for unverified users (but still allow access)
  if (authChecks.hasUser && authChecks.hasProfile && !authChecks.isEmailConfirmed) {
    return (
      <>
        <div className="sticky top-0 z-50">
          <EmailVerificationBanner />
        </div>
        {children}
      </>
    );
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
