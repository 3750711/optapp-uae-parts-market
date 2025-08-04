
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
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
  
  devLog("ProtectedRoute: Auth state:", { 
    user: !!user, 
    profile: !!profile, 
    isLoading,
    userType: profile?.user_type,
    pathname: location.pathname 
  });
  
  // Show minimal loading state while checking authentication
  if (isLoading) {
    devLog("ProtectedRoute: Showing loading state");
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-optapp-yellow"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    devLog("ProtectedRoute: User not authenticated, redirecting to login");
    return <Navigate to={`/login?from=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Check for incomplete Telegram profiles (after user is authenticated)
  if (profile && profile.auth_method === 'telegram' && !profile.profile_completed) {
    // Skip redirect if already on completion page
    if (location.pathname !== '/complete-telegram-profile') {
      devLog("ProtectedRoute: Telegram profile incomplete, redirecting to completion");
      return <Navigate to="/complete-telegram-profile" replace />;
    }
  }
  
  // If profile is still loading but user exists, show minimal loading
  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-optapp-yellow mx-auto mb-4"></div>
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
  if (profile.verification_status === 'blocked') {
    devLog("ProtectedRoute: User is blocked");
    toast({
      title: "Доступ ограничен",
      description: "Ваш аккаунт заблокирован. Вы можете только просматривать сайт.",
      variant: "destructive",
    });
    return <Navigate to="/" replace />;
  }

  // Check if user is pending approval (except for admins) - STRICT CHECK
  if (profile.verification_status === 'pending' && profile.user_type !== 'admin') {
    // Allow access only to pending-approval page and logout functionality
    if (location.pathname !== '/pending-approval' && !location.pathname.includes('/auth')) {
      devLog("ProtectedRoute: User is pending approval, redirecting to pending approval");
      return <Navigate to="/pending-approval" replace />;
    }
  }
  
  // Check for role restrictions if provided
  if (allowedRoles && !allowedRoles.includes(profile.user_type)) {
    devLog("ProtectedRoute: User doesn't have required role");
    // Always check verification status before redirecting to role-specific pages
    if (profile.verification_status === 'pending') {
      return <Navigate to="/pending-approval" replace />;
    }
    // Redirect verified sellers to their dashboard, others to home
    if (profile.user_type === 'seller') {
      return <Navigate to="/seller/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }
  
  // Check for excluded roles if provided
  if (excludedRoles && excludedRoles.includes(profile.user_type)) {
    devLog("ProtectedRoute: User role is excluded from this page");
    // Always check verification status before redirecting to role-specific pages
    if (profile.verification_status === 'pending') {
      return <Navigate to="/pending-approval" replace />;
    }
    // Redirect verified sellers to their dashboard, others to home
    if (profile.user_type === 'seller') {
      return <Navigate to="/seller/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }
  
  // Check for email verification if required
  if (requireEmailVerification && !profile.email_confirmed) {
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

  devLog("ProtectedRoute: User authenticated and authorized, rendering children");
  
  // Show email verification banner for unverified users (but still allow access)
  if (user && profile && !profile.email_confirmed) {
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
