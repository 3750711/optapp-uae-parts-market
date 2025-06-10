
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const useAdminGuard = (redirectOnFail: boolean = true) => {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      // Если AuthContext еще загружается, ждем
      if (authLoading) {
        return;
      }

      // Если пользователь не авторизован
      if (!user) {
        setIsAdmin(false);
        setIsChecking(false);
        if (redirectOnFail) {
          navigate('/login', { replace: true });
        }
        return;
      }

      // Если профиль еще не загружен, ждем его загрузки
      if (!profile) {
        console.log("AdminGuard: Waiting for profile to load...");
        return;
      }

      try {
        console.log("AdminGuard: Checking admin access for user:", user.id);
        
        // Проверяем права администратора через RPC функцию
        const { data, error } = await supabase.rpc('is_admin');
        
        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data === true);
        }

        // Дополнительная проверка через профиль
        const hasAdminAccess = data === true || profile?.user_type === 'admin';
        setIsAdmin(hasAdminAccess);

        if (!hasAdminAccess && redirectOnFail) {
          console.log("AdminGuard: User does not have admin access, redirecting to profile");
          toast({
            title: "Доступ запрещен",
            description: "У вас нет прав администратора",
            variant: "destructive",
          });
          
          // Используем navigate вместо window.location.href
          setTimeout(() => {
            navigate('/profile', { replace: true });
          }, 1000);
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
    };

    checkAdminAccess();
  }, [user, profile, authLoading, redirectOnFail, toast, navigate]);

  return {
    isAdmin,
    isChecking: isChecking || authLoading,
    hasAdminAccess: isAdmin === true,
  };
};
