
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();
  
  console.log("ProtectedRoute: Auth state:", { 
    user: !!user, 
    profile: !!profile, 
    isLoading,
    userType: profile?.user_type,
    pathname: location.pathname 
  });
  
  // Show loading state while checking authentication
  if (isLoading) {
    console.log("ProtectedRoute: Showing loading state");
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-optapp-yellow"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    console.log("ProtectedRoute: User not authenticated, redirecting to login");
    return <Navigate to={`/login?from=${encodeURIComponent(location.pathname)}`} replace />;
  }
  
  // Check if user is blocked
  if (profile?.verification_status === 'blocked') {
    console.log("ProtectedRoute: User is blocked");
    toast({
      title: "Доступ ограничен",
      description: "Ваш аккаунт заблокирован. Вы можете только просматривать сайт.",
      variant: "destructive",
    });
    return <Navigate to="/" replace />;
  }
  
  // Check for role restrictions if provided
  if (allowedRoles && profile && !allowedRoles.includes(profile.user_type)) {
    console.log("ProtectedRoute: User doesn't have required role");
    return <Navigate to="/" replace />;
  }
  
  console.log("ProtectedRoute: User authenticated and authorized, rendering children");
  return <>{children}</>;
};

export default ProtectedRoute;
