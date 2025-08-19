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
    currentPath: location.pathname,
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
  
  // If user is not authenticated, show home page
  if (!user) {
    console.log("🚀 HomeRedirect: No user, showing home page");
    return <>{children}</>;
  }

  // ✅ ИСПРАВЛЕНИЕ: Устранение фликера - показываем спиннер пока профиль загружается
  if (user && !profile) {
    console.log("🚀 HomeRedirect: User exists but profile loading, showing spinner");
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-optapp-yellow"></div>
      </div>
    );
  }
  
  console.log("🚀 HomeRedirect: User authenticated, determining redirect", {
    userType: profile.user_type,
    verificationStatus: profile.verification_status,
    authMethod: profile.auth_method,
    profileCompleted: profile.profile_completed,
    optId: profile.opt_id
  });
  
  // Determine redirect target based on user state
  let redirectTarget: string | null = null;
  
  // Non-admins who are not verified must go to pending-approval
  if (profile.user_type !== 'admin' && profile.verification_status !== 'verified') {
    redirectTarget = "/pending-approval";
    console.log("🚀 HomeRedirect: Unverified user -> pending-approval");
  } else if (profile.verification_status === 'verified') {
    // Verified users go to their respective dashboards
    switch (profile.user_type) {
      case 'buyer':
        redirectTarget = "/buyer-dashboard";
        console.log("🚀 HomeRedirect: Verified buyer -> buyer-dashboard");
        break;
      case 'seller':
        redirectTarget = "/seller/dashboard";
        console.log("🚀 HomeRedirect: Verified seller -> seller/dashboard");
        break;
      case 'admin':
        redirectTarget = "/admin";
        console.log("🚀 HomeRedirect: Verified admin -> admin");
        break;
      default:
        console.log("🚀 HomeRedirect: Unknown user type, staying on home page");
        break;
    }
  }
  
  // Perform redirect if needed
  if (redirectTarget && redirectProtection.canRedirect(location.pathname, redirectTarget)) {
    console.log("🚀 HomeRedirect: Redirecting to:", redirectTarget);
    return <Navigate to={redirectTarget} replace />;
  }
  
  // User is authenticated but staying on home page
  console.log("🚀 HomeRedirect: Showing home page content to authenticated user");
  return <>{children}</>;
};

export default HomeRedirect;