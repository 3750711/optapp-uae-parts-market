
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { devLog } from '@/utils/performanceUtils';

export const useAdminGuard = (redirectOnFail: boolean = true) => {
  const { user, profile, isLoading: authLoading, isAdmin, isCheckingAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [hasRedirected, setHasRedirected] = useState(false);

  const checkAccess = useCallback(() => {
    // Ждем завершения загрузки авторизации
    if (authLoading || isCheckingAdmin) {
      return;
    }

    // Если нет пользователя, редирект на логин
    if (!user) {
      devLog("AdminGuard: No user, redirecting to login");
      if (redirectOnFail && !hasRedirected) {
        setHasRedirected(true);
        navigate('/login', { replace: true });
      }
      return;
    }

    // Ждем загрузки профиля
    if (!profile) {
      devLog("AdminGuard: Waiting for profile to load...");
      return;
    }

    // Проверяем админские права (уже кешированные в контексте)
    if (isAdmin === false && redirectOnFail && !hasRedirected) {
      devLog("AdminGuard: User does not have admin access, redirecting to profile");
      setHasRedirected(true);
      
      toast({
        title: "Доступ запрещен",
        description: "У вас нет прав администратора",
        variant: "destructive",
      });
      
      setTimeout(() => {
        navigate('/profile', { replace: true });
      }, 1000);
    }
  }, [user, profile, isAdmin, authLoading, isCheckingAdmin, redirectOnFail, hasRedirected, navigate, toast]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Сброс флага редиректа при смене пользователя
  useEffect(() => {
    setHasRedirected(false);
  }, [user?.id]);

  return {
    isAdmin,
    isChecking: authLoading || isCheckingAdmin,
    hasAdminAccess: isAdmin === true,
  };
};
