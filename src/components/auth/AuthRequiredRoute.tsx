
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RestrictedAccessNotice from '@/components/home/RestrictedAccessNotice';

interface AuthRequiredRouteProps {
  children: React.ReactNode;
}

const AuthRequiredRoute: React.FC<AuthRequiredRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not authenticated, show restricted access notice
  if (!user) {
    return <RestrictedAccessNotice />;
  }

  // If user is authenticated, render the page content
  return <>{children}</>;
};

export default AuthRequiredRoute;
