import React, { memo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface FastProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const FastProtectedRoute = memo(({ children, allowedRoles }: FastProtectedRouteProps) => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();
  
  // Ultra-fast loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Quick auth check
  if (!user) {
    return <Navigate to={`/login?from=${encodeURIComponent(location.pathname)}`} replace />;
  }
  
  // Quick profile check
  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Block unverified users (except admins)
  if (profile.user_type !== 'admin' && profile.verification_status !== 'verified') {
    return <Navigate to="/pending-approval" replace />;
  }
  
  // Quick role check for seller dashboard
  if (allowedRoles && !allowedRoles.includes(profile.user_type)) {
    if (profile.user_type === 'seller') {
      return <Navigate to="/seller/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
});

FastProtectedRoute.displayName = "FastProtectedRoute";

export default FastProtectedRoute;