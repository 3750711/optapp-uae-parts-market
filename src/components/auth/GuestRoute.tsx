import { Navigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { devLog } from "@/utils/logger";
import { redirectProtection } from "@/utils/redirectProtection";

interface GuestRouteProps {
  children: React.ReactNode;
}

const GuestRoute = ({ children }: GuestRouteProps) => {
  const { user, profile, loading, status } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  console.log("🔐 GuestRoute: Auth state check:", { 
    user: !!user, 
    profile: !!profile, 
    loading,
    status,
    userType: profile?.user_type,
    verificationStatus: profile?.verification_status,
    timestamp: new Date().toISOString()
  });
  
  devLog("GuestRoute: Auth state:", { 
    user: !!user, 
    profile: !!profile, 
    loading,
    status,
    userType: profile?.user_type
  });
  
  // CRITICAL: Detect state mismatch (profile exists but user doesn't)
  if (!user && profile) {
    console.error("🚨 GuestRoute: CRITICAL STATE MISMATCH - profile exists without user!", {
      profile: !!profile,
      user: !!user,
      timestamp: new Date().toISOString()
    });
    // Force cache clear and return null to prevent showing invalid state
    queryClient.removeQueries({ queryKey: ['profile'] });
    return null;
  }

  // Show loading while checking authentication - prevents flicker
  if (status === 'checking' || loading) {
    console.log("🔐 GuestRoute: Showing loading state", { status, loading, hasUser: !!user });
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-optapp-yellow"></div>
      </div>
    );
  }
  
  // If user is authenticated, redirect to appropriate dashboard  
  if (status === 'authed' && user && profile) {
    console.log("🔐 GuestRoute: User authenticated, redirecting based on verification and role");
    
    // Enforce: any non-admin user who is not verified must go to pending-approval
    if (profile.user_type !== 'admin' && profile.verification_status !== 'verified') {
      console.log("🔐 GuestRoute: Redirecting unverified user to pending approval");
      if (redirectProtection.canRedirect(location.pathname, "/pending-approval")) {
        return <Navigate to="/pending-approval" replace />;
      }
    }
    
    // Redirect authenticated users based on role
    const to = 
      profile.user_type === 'admin' ? '/admin' :
      profile.user_type === 'seller' ? '/seller/dashboard' :
      profile.user_type === 'buyer' ? '/buyer-dashboard' : '/profile';
      
    if (to && redirectProtection.canRedirect(location.pathname, to)) {
      console.log("🔐 GuestRoute: Redirecting", profile.user_type, "to", to);
      return <Navigate to={to} replace />;
    }
  }
  
  // User is not authenticated, show the page
  console.log("🔐 GuestRoute: Showing guest content (user not authenticated)");
  return <>{children}</>;
};

export default GuestRoute;