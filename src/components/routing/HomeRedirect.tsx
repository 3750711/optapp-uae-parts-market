import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { devLog } from "@/utils/logger";
import { determineAuthStatus, getRedirectPath, shouldRedirect } from "@/utils/authStateUtils";

interface HomeRedirectProps {
  children: React.ReactNode;
}

const HomeRedirect = ({ children }: HomeRedirectProps) => {
  const { user, profile, isLoading, session } = useAuth();
  
  const authState = { user, profile, session, isLoading };
  const authStatus = determineAuthStatus(authState);
  const currentPath = window.location.pathname;
  
  devLog("HomeRedirect: Auth state:", { 
    user: !!user, 
    profile: !!profile, 
    isLoading,
    userType: profile?.user_type,
    authStatus,
    currentPath
  });
  
  // Show loading while checking authentication
  if (authStatus === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Check if we should redirect based on auth status
  if (shouldRedirect(authStatus, currentPath)) {
    const redirectPath = getRedirectPath(authStatus);
    if (redirectPath) {
      devLog("HomeRedirect: Redirecting to:", redirectPath);
      return <Navigate to={redirectPath} replace />;
    }
  }
  
  // For buyers and unauthenticated users on home page, show children
  if (authStatus === 'authenticated_buyer' || authStatus === 'unauthenticated') {
    return <>{children}</>;
  }
  
  // For other authenticated users that shouldn't be on home page, 
  // redirect them to their appropriate dashboard
  if (authStatus === 'authenticated_seller' || authStatus === 'authenticated_admin') {
    const redirectPath = getRedirectPath(authStatus);
    if (redirectPath) {
      return <Navigate to={redirectPath} replace />;
    }
  }
  
  // Default fallback - show children
  return <>{children}</>;
};

export default HomeRedirect;