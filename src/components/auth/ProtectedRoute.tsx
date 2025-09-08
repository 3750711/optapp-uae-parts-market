
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
  const { user, profile, status } = useAuth();
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
      status,
      timestamp: new Date().toISOString()
    });
  }
  
  if (isDevelopment) {
    console.log('🔍 ProtectedRoute: Auth state:', {
      user: !!user,
      profile: !!profile,
      status,
      userType: profile?.user_type,
      pathname: location.pathname,
      profileCompleted: authChecks.profileCompleted
    });
  }
  
  // Add timeout for checking status to prevent infinite loading
  const [checkingTimeout, setCheckingTimeout] = React.useState(false);
  React.useEffect(() => {
    if (status === 'checking') {
      const timer = setTimeout(() => {
        setCheckingTimeout(true);
      }, 10000); // 10 second timeout - increased for slower connections
      return () => clearTimeout(timer);
    }
    setCheckingTimeout(false);
  }, [status]);

  // Show minimal loading state while checking authentication
  if (status === 'checking' && !checkingTimeout) {
    devLog("ProtectedRoute: Showing loading state");
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If checking timed out, show error with retry option
  if (status === 'checking' && checkingTimeout) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Ошибка загрузки</h2>
          <p className="text-gray-600 mb-4">Не удалось загрузить профиль</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
          >
            Обновить страницу
          </button>
        </div>
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
  if (status === 'guest') {
    devLog("ProtectedRoute: User not authenticated, redirecting to login");
    return <Navigate to={`/login?from=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // For Telegram users with incomplete profiles, let TelegramLoginWidget handle the modal
  // No redirect needed here as the modal will handle profile completion
  
  // If profile is still loading but user exists, show error after timeout
  if (!authChecks.hasProfile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Ошибка профиля</h2>
          <p className="text-gray-600 mb-4">Не удалось загрузить профиль пользователя</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
          >
            Обновить страницу
          </button>
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
