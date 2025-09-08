import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'seller' | 'buyer';
}

export function Protected({ children, requiredRole }: ProtectedProps) {
  const { status, profile } = useAuth();

  if (status === 'checking') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (status === 'guest') {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && profile?.user_type !== requiredRole) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}