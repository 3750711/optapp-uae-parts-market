import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileCompletionRedirectProps {
  children: React.ReactNode;
}

const ProfileCompletionRedirect = ({ children }: ProfileCompletionRedirectProps) => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();
  
  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-optapp-yellow"></div>
      </div>
    );
  }
  
  // Global rule: If user exists and profile is incomplete, redirect to completion page
  if (user && profile && !profile.profile_completed) {
    console.log("🚀 ProfileCompletionRedirect: Incomplete profile detected, redirecting to completion", {
      userId: user.id,
      profileCompleted: profile.profile_completed,
      authMethod: profile.auth_method,
      currentPath: location.pathname,
      timestamp: new Date().toISOString()
    });
    
    // Only redirect if not already on the completion page
    if (location.pathname !== '/complete-telegram-profile') {
      return <Navigate to="/complete-telegram-profile" replace />;
    }
  }
  
  // Allow normal flow for complete profiles or no profile
  return <>{children}</>;
};

export default ProfileCompletionRedirect;