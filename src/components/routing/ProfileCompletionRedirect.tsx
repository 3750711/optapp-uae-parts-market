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
  
  // For Telegram users, let TelegramLoginWidget handle the modal instead of redirecting
  // For other auth methods, this logic can be extended later if needed
  if (user && profile && !profile.profile_completed && profile.auth_method !== 'telegram') {
    console.log("🚀 ProfileCompletionRedirect: Incomplete profile detected, redirecting to completion", {
      userId: user.id,
      profileCompleted: profile.profile_completed,
      authMethod: profile.auth_method,
      currentPath: location.pathname,
      timestamp: new Date().toISOString()
    });
    
    // Handle non-Telegram profile completion here if needed
  }
  
  // Allow normal flow for complete profiles or no profile
  return <>{children}</>;
};

export default ProfileCompletionRedirect;