
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/SimpleAuthContext';

export const useAdminAccess = () => {
  const { user, profile, isLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setHasAccess(!!user && profile?.user_type === 'admin');
    }
  }, [user, profile, isLoading]);

  return {
    hasAccess,
    isLoading,
    user,
    profile,
    isAdmin: hasAccess // Add for backward compatibility
  };
};
