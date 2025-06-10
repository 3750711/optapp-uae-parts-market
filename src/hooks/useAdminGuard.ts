
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { getCachedAdminRights, setCachedAdminRights, clearAdminCache, debounce, devLog, devError } from '@/utils/performanceUtils';

export const useAdminGuard = (redirectOnFail: boolean = true) => {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // Debounced admin check to prevent excessive calls
  const debouncedAdminCheck = useCallback(
    debounce(async (userId: string) => {
      try {
        devLog("AdminGuard: Checking admin access for user:", userId);
        
        // First check cache
        const cached = getCachedAdminRights(userId);
        if (cached !== null) {
          devLog("AdminGuard: Using cached admin rights:", cached);
          setIsAdmin(cached);
          setIsChecking(false);
          return;
        }
        
        // Check admin rights via RPC
        const { data, error } = await supabase.rpc('is_admin');
        
        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          const hasAdminAccess = data === true || profile?.user_type === 'admin';
          setIsAdmin(hasAdminAccess);
          
          // Cache the result
          setCachedAdminRights(userId, hasAdminAccess);
          
          if (!hasAdminAccess && redirectOnFail) {
            devLog("AdminGuard: User does not have admin access, redirecting to profile");
            toast({
              title: "Доступ запрещен",
              description: "У вас нет прав администратора",
              variant: "destructive",
            });
            
            setTimeout(() => {
              navigate('/profile', { replace: true });
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Admin check failed:', error);
        setIsAdmin(false);
        if (redirectOnFail) {
          toast({
            title: "Ошибка проверки прав",
            description: "Не удалось проверить права доступа",
            variant: "destructive",
          });
          navigate('/profile', { replace: true });
        }
      } finally {
        setIsChecking(false);
      }
    }, 300), // 300ms debounce
    [profile, redirectOnFail, toast, navigate]
  );

  useEffect(() => {
    const checkAdminAccess = async () => {
      // Wait for auth to load
      if (authLoading) {
        return;
      }

      // If no user, not admin
      if (!user) {
        setIsAdmin(false);
        setIsChecking(false);
        if (redirectOnFail) {
          navigate('/login', { replace: true });
        }
        return;
      }

      // Wait for profile to load
      if (!profile) {
        devLog("AdminGuard: Waiting for profile to load...");
        return;
      }

      // Check admin access with debounce
      debouncedAdminCheck(user.id);
    };

    checkAdminAccess();
  }, [user, profile, authLoading, redirectOnFail, navigate, debouncedAdminCheck]);

  // Clear cache on logout
  useEffect(() => {
    if (!user) {
      clearAdminCache();
    }
  }, [user]);

  return {
    isAdmin,
    isChecking: isChecking || authLoading,
    hasAdminAccess: isAdmin === true,
  };
};
