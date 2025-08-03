import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { devLog } from "@/utils/logger";

interface GuestRouteProps {
  children: React.ReactNode;
}

const GuestRoute = ({ children }: GuestRouteProps) => {
  const { user, profile, isLoading } = useAuth();
  
  devLog("GuestRoute: Auth state:", { 
    user: !!user, 
    profile: !!profile, 
    isLoading,
    userType: profile?.user_type
  });
  
  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-optapp-yellow"></div>
      </div>
    );
  }
  
  // If user is authenticated, check verification status first
  if (user && profile) {
    devLog("GuestRoute: User authenticated, checking verification status");
    
    // Redirect pending users to approval page (except admins)
    if (profile.verification_status === 'pending' && profile.user_type !== 'admin') {
      return <Navigate to="/pending-approval" replace />;
    }
    
    devLog("GuestRoute: User verified, redirecting based on role");
    
    switch (profile.user_type) {
      case 'seller':
        return <Navigate to="/seller/dashboard" replace />;
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'buyer':
      default:
        return <Navigate to="/" replace />;
    }
  }
  
  // User is not authenticated, show the page
  return <>{children}</>;
};

export default GuestRoute;