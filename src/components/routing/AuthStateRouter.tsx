import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { determineAuthStatus, getRedirectPath, shouldRedirect } from "@/utils/authStateUtils";

interface AuthStateRouterProps {
  children: React.ReactNode;
  allowedStatuses?: string[];
  redirectTo?: string;
}

const AuthStateRouter = ({ children, allowedStatuses, redirectTo }: AuthStateRouterProps) => {
  const { user, profile, isLoading, session } = useAuth();
  const location = useLocation();
  
  const authState = { user, profile, session, isLoading };
  const authStatus = determineAuthStatus(authState);
  const currentPath = location.pathname;
  
  // Show loading while checking authentication
  if (authStatus === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If specific statuses are allowed, check them
  if (allowedStatuses && !allowedStatuses.includes(authStatus)) {
    const defaultRedirectPath = getRedirectPath(authStatus);
    return <Navigate to={redirectTo || defaultRedirectPath || '/'} replace />;
  }
  
  // Check if we should redirect based on auth status
  if (shouldRedirect(authStatus, currentPath)) {
    const redirectPath = getRedirectPath(authStatus);
    if (redirectPath) {
      return <Navigate to={redirectPath} replace />;
    }
  }
  
  return <>{children}</>;
};

export default AuthStateRouter;