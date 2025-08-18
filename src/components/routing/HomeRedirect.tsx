import React from "react";
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
  
  // Add timeout protection against infinite loading
  const [loadingTimeout, setLoadingTimeout] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.warn("🚨 HomeRedirect: Loading timeout reached, forcing render");
        setLoadingTimeout(true);
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timer);
  }, [isLoading]);
  
  // Show loading while checking authentication (with timeout protection)
  if (isLoading && !loadingTimeout) {
    console.log("🚀 HomeRedirect: Still loading auth state...");
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-optapp-yellow mx-auto"></div>
          <p className="text-sm text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }
  
  // Simplified redirect logic to prevent loops
  if (user && profile) {
    console.log("🚀 HomeRedirect: User authenticated, determining redirect", {
      userType: profile.user_type,
      verificationStatus: profile.verification_status,
      profileCompleted: profile.profile_completed,
      currentPath: location.pathname
    });
    
    // Only redirect if we're on the exact home path "/"
    if (location.pathname === "/") {
      const targetPath = getRedirectPath(profile);
      if (targetPath && redirectProtection.canRedirect(location.pathname, targetPath)) {
        console.log("🚀 HomeRedirect: Redirecting to:", targetPath);
        return <Navigate to={targetPath} replace />;
      }
    }
  }
  
  // Show home page content
  console.log("🚀 HomeRedirect: Showing home page content");
  return <>{children}</>;
};

// Helper function to determine redirect path
const getRedirectPath = (profile: any): string | null => {
  // Non-admins who are not verified go to pending approval
  if (profile.user_type !== 'admin' && profile.verification_status !== 'verified') {
    return "/pending-approval";
  }
  
  // Verified users get redirected based on role
  if (profile.verification_status === 'verified') {
    switch (profile.user_type) {
      case 'admin':
        return "/admin";
      case 'seller':
        return "/seller/dashboard";
      case 'buyer':
        return "/buyer-dashboard";
      default:
        return null;
    }
  }
  
  return null;
};

export default HomeRedirect;