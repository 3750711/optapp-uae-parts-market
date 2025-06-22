
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/SimpleAuthContext";
import { useProfile } from "@/contexts/ProfileProvider";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const location = useLocation();
  
  const isLoading = authLoading || profileLoading;
  
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
        <Loader2 className="h-8 w-8 animate-spin text-optapp-yellow" />
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    console.log("ProtectedRoute: User not authenticated, redirecting to login");
    return <Navigate to={`/login?from=${encodeURIComponent(location.pathname)}`} replace />;
  }
  
  // If profile is still loading but user exists, show minimal loading
  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-optapp-yellow" />
      </div>
    );
  }
  
  // Check if user is blocked
  if (profile.verification_status === 'blocked') {
    console.log("ProtectedRoute: User is blocked");
    toast({
      title: "Доступ ограничен",
      description: "Ваш аккаунт заблокирован. Вы можете только просматривать сайт.",
      variant: "destructive",
    });
    return <Navigate to="/" replace />;
  }
  
  // Check for role restrictions if provided
  if (allowedRoles && !allowedRoles.includes(profile.user_type)) {
    console.log("ProtectedRoute: User doesn't have required role");
    return <Navigate to="/" replace />;
  }
  
  console.log("ProtectedRoute: User authenticated and authorized, rendering children");
  return <>{children}</>;
};

export default ProtectedRoute;
