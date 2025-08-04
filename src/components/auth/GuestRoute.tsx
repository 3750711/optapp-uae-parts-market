import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { devLog } from "@/utils/logger";
import { redirectProtection } from "@/utils/redirectProtection";

interface GuestRouteProps {
  children: React.ReactNode;
}

const GuestRoute = ({ children }: GuestRouteProps) => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();
  
  console.log("🔐 GuestRoute: Auth state check:", { 
    user: !!user, 
    profile: !!profile, 
    isLoading,
    userType: profile?.user_type,
    verificationStatus: profile?.verification_status,
    timestamp: new Date().toISOString()
  });
  
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
    console.log("🔐 GuestRoute: User authenticated, checking verification and redirect", {
      userType: profile.user_type,
      verificationStatus: profile.verification_status,
      authMethod: profile.auth_method,
      profileCompleted: profile.profile_completed,
      optId: profile.opt_id,
      timestamp: new Date().toISOString()
    });
    
    devLog("GuestRoute: User authenticated, checking verification status");
    
    // Skip profile completion check - handled globally by ProfileCompletionRedirect
    
    // PRIORITY 2: Redirect pending users to approval page (except admins)
    if (profile.verification_status === 'pending' && profile.user_type !== 'admin') {
      console.log("🔐 GuestRoute: Redirecting to pending approval");
      if (redirectProtection.canRedirect(location.pathname, "/pending-approval")) {
        return <Navigate to="/pending-approval" replace />;
      }
    }
    
    console.log("🔐 GuestRoute: User verified, checking role redirect");
    devLog("GuestRoute: User verified, redirecting based on role");
    
    // Only redirect sellers and admins away from guest routes
    // Buyers should be allowed to access guest content (like login/register pages)
    switch (profile.user_type) {
      case 'seller':
        console.log("🔐 GuestRoute: Redirecting seller to dashboard");
        if (redirectProtection.canRedirect(location.pathname, "/seller/dashboard")) {
          return <Navigate to="/seller/dashboard" replace />;
        }
        break;
      case 'admin':
        console.log("🔐 GuestRoute: Redirecting admin to admin panel");
        if (redirectProtection.canRedirect(location.pathname, "/admin")) {
          return <Navigate to="/admin" replace />;
        }
        break;
      case 'buyer':
      default:
        // Buyers can access guest routes (they might want to logout, etc.)
        console.log("🔐 GuestRoute: Buyer authenticated but allowing guest access");
        break;
    }
  }
  
  // User is not authenticated, show the page
  console.log("🔐 GuestRoute: Showing guest content (user not authenticated)");
  return <>{children}</>;
};

export default GuestRoute;