import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { devLog } from "@/utils/logger";
import { redirectProtection } from "@/utils/redirectProtection";

interface GuestRouteProps {
  children: React.ReactNode;
}

const GuestRoute = ({ children }: GuestRouteProps) => {
  const { user, profile, isLoading, isProfileLoading } = useAuth();
  const location = useLocation();
  
  console.log("🔐 GuestRoute: Auth state check:", { 
    user: !!user, 
    profile: !!profile, 
    isLoading,
    isProfileLoading,
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
  
  // Show loading while checking authentication or profile
  if (isLoading || (user && isProfileLoading)) {
    console.log("🔐 GuestRoute: Showing loading state", { isLoading, isProfileLoading, hasUser: !!user });
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
    
    // Enforce: any non-admin user who is not verified must go to pending-approval
    if (profile.user_type !== 'admin' && profile.verification_status !== 'verified') {
      console.log("🔐 GuestRoute: Redirecting unverified user to pending approval");
      if (redirectProtection.canRedirect(location.pathname, "/pending-approval")) {
        return <Navigate to="/pending-approval" replace />;
      }
    }
    
    console.log("🔐 GuestRoute: User verified, checking role redirect");
    devLog("GuestRoute: User verified, redirecting based on role");
    
    // Redirect authenticated users away from guest routes based on role
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
        console.log("🔐 GuestRoute: Redirecting verified buyer to buyer dashboard");
        if (redirectProtection.canRedirect(location.pathname, "/buyer-dashboard")) {
          return <Navigate to="/buyer-dashboard" replace />;
        }
        break;
      default:
        console.log("🔐 GuestRoute: Unknown role - allowing guest access");
        break;
    }
  }
  
  // User is not authenticated, show the page
  console.log("🔐 GuestRoute: Showing guest content (user not authenticated)");
  return <>{children}</>;
};

export default GuestRoute;