
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { devLog } from "@/utils/logger";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
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
  
  // If profile is still loading but user exists, show minimal loading
  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-optapp-yellow"></div>
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
  
  // Check for role restrictions if provided
  if (allowedRoles && !allowedRoles.includes(profile.user_type)) {
    devLog("ProtectedRoute: User doesn't have required role");
    return <Navigate to="/" replace />;
  }
  
  devLog("ProtectedRoute: User authenticated and authorized, rendering children");
  return <>{children}</>;
};

export default ProtectedRoute;
