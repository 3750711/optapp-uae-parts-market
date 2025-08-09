import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { devLog } from "@/utils/logger";
import { redirectProtection } from "@/utils/redirectProtection";

interface HomeRedirectProps {
  children: React.ReactNode;
}

const HomeRedirect = ({ children }: HomeRedirectProps) => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();
  
  console.log("🚀 HomeRedirect: Auth state check:", { 
    user: !!user, 
    profile: !!profile, 
    isLoading,
    userType: profile?.user_type,
    verificationStatus: profile?.verification_status,
    timestamp: new Date().toISOString()
  });
  
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
    console.log("🚀 HomeRedirect: User authenticated, checking redirect logic", {
      userType: profile.user_type,
      verificationStatus: profile.verification_status,
      authMethod: profile.auth_method,
      profileCompleted: profile.profile_completed,
      optId: profile.opt_id,
      timestamp: new Date().toISOString()
    });
    
    devLog("HomeRedirect: User authenticated, redirecting based on role");
    
    // PRIORITY: Redirect verified buyers to their dashboard immediately
    if (profile.user_type === 'buyer' && profile.verification_status === 'verified') {
      console.log("🚀 HomeRedirect: Redirecting verified buyer to dashboard");
      if (redirectProtection.canRedirect(location.pathname, "/buyer-dashboard")) {
        return <Navigate to="/buyer-dashboard" replace />;
      }
    }
    
    // Enforce: any non-admin user who is not verified must go to pending-approval
    if (profile.user_type !== 'admin' && profile.verification_status !== 'verified') {
      console.log("🚀 HomeRedirect: Redirecting unverified user to pending approval");
      if (redirectProtection.canRedirect(location.pathname, "/pending-approval")) {
        return <Navigate to="/pending-approval" replace />;
      }
    }
    
    // Secondary: buyers with completed profiles (fallback)
    if (profile.user_type === 'buyer' && profile.profile_completed) {
      console.log("🚀 HomeRedirect: Redirecting buyer (profile completed) to dashboard");
      if (redirectProtection.canRedirect(location.pathname, "/buyer-dashboard")) {
        return <Navigate to="/buyer-dashboard" replace />;
      }
    }
    
    // For verified users, redirect based on role
    if (profile.verification_status === 'verified') {
      console.log("🚀 HomeRedirect: User verified, checking role redirect");
      switch (profile.user_type) {
        case 'seller':
          console.log("🚀 HomeRedirect: Redirecting seller to dashboard");
          if (redirectProtection.canRedirect(location.pathname, "/seller/dashboard")) {
            return <Navigate to="/seller/dashboard" replace />;
          }
          break;
        case 'admin':
          console.log("🚀 HomeRedirect: Redirecting admin to admin panel");
          if (redirectProtection.canRedirect(location.pathname, "/admin")) {
            return <Navigate to="/admin" replace />;
          }
          break;
        case 'buyer':
          console.log("🚀 HomeRedirect: Redirecting buyer to dashboard");
          if (redirectProtection.canRedirect(location.pathname, "/buyer-dashboard")) {
            return <Navigate to="/buyer-dashboard" replace />;
          }
          break;
        default:
          console.log("🚀 HomeRedirect: User staying on home page");
          break;
      }
    } else {
      // Non-verified users are redirected to pending approval above
    }
  }
  
  // User is not authenticated or is a buyer - show the home page
  console.log("🚀 HomeRedirect: Showing home page content");
  return <>{children}</>;
};

export default HomeRedirect;