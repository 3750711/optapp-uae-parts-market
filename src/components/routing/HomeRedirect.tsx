import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthWithProfile } from "@/hooks/useAuthWithProfile";
import { devLog } from "@/utils/logger";
import { redirectProtection } from "@/utils/redirectProtection";

interface HomeRedirectProps {
  children: React.ReactNode;
}

const HomeRedirect = ({ children }: HomeRedirectProps) => {
  const { user, profile, isLoading, status } = useAuthWithProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const hasRedirectedRef = useRef(false);
  
  console.log("🚀 HomeRedirect: Auth state check:", { 
    user: !!user, 
    profile: !!profile, 
    isLoading,
    status,
    userType: profile?.user_type,
    verificationStatus: profile?.verification_status,
    currentPath: location.pathname,
    timestamp: new Date().toISOString()
  });
  
  devLog("HomeRedirect: Auth state:", { 
    user: !!user, 
    profile: !!profile, 
    isLoading,
    status,
    userType: profile?.user_type
  });
  
  // Show loading while checking authentication - prevents flicker
  if (status === 'checking' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-optapp-yellow"></div>
      </div>
    );
  }
  
  // If user is not authenticated, show home page
  if (status === 'guest' || !user) {
    console.log("🚀 HomeRedirect: No user, showing home page");
    return <>{children}</>;
  }

  // If user is authenticated, redirect immediately
  if (status === 'authed' && user && profile) {
    console.log("🚀 HomeRedirect: User authenticated, determining redirect");
    
    // Determine redirect target based on user state
    const redirectTarget = 
      profile.user_type !== 'admin' && profile.verification_status !== 'verified' ? "/pending-approval" :
      profile.user_type === 'buyer' ? "/buyer-dashboard" :
      profile.user_type === 'seller' ? "/seller/dashboard" :
      profile.user_type === 'admin' ? "/admin" : null;
    
    // Perform immediate redirect
    if (redirectTarget && redirectProtection.canRedirect(location.pathname, redirectTarget)) {
      console.log("🚀 HomeRedirect: Redirecting to:", redirectTarget);
      
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        setTimeout(() => {
          console.log("🚀 HomeRedirect: Executing redirect to:", redirectTarget);
          navigate(redirectTarget, { replace: true });
        }, 50);
      }
    }
  }
  
  // User is authenticated but staying on home page (or profile still loading)
  console.log("🚀 HomeRedirect: Showing home page content to authenticated user");
  return <>{children}</>;
};

export default HomeRedirect;