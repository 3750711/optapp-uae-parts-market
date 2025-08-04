import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { devLog } from "@/utils/logger";

interface HomeRedirectProps {
  children: React.ReactNode;
}

const HomeRedirect = ({ children }: HomeRedirectProps) => {
  const { user, profile, isLoading } = useAuth();
  
  devLog("HomeRedirect: Auth state:", { 
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
  
  // If user is authenticated, redirect based on their role
  if (user && profile) {
    devLog("HomeRedirect: User authenticated, redirecting based on role");
    
    // Check if user is pending approval (except for admins)
    if (profile.verification_status === 'pending' && profile.user_type !== 'admin') {
      return <Navigate to="/pending-approval" replace />;
    }
    
    // For verified users, redirect based on role
    if (profile.verification_status === 'verified') {
      switch (profile.user_type) {
        case 'seller':
          return <Navigate to="/seller/dashboard" replace />;
        case 'admin':
          return <Navigate to="/admin" replace />;
        case 'buyer':
        default:
          // Verified buyers stay on home page
          break;
      }
    } else {
      // Unverified users (including completed profiles) stay on home page
      // This allows them to browse while waiting for approval
    }
  }
  
  // User is not authenticated or is a buyer - show the home page
  return <>{children}</>;
};

export default HomeRedirect;