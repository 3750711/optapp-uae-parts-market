
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAdminGuard = (redirectOnFail: boolean = true) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsChecking(false);
        if (redirectOnFail) {
          window.location.href = '/login';
        }
        return;
      }

      try {
        // Проверяем права администратора через RPC функцию
        const { data, error } = await supabase.rpc('is_admin');
        
        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data === true);
        }

        // Дополнительная проверка через профиль
        if (profile?.user_type !== 'admin' && data !== true) {
          setIsAdmin(false);
          if (redirectOnFail) {
            toast({
              title: "Доступ запрещен",
              description: "У вас нет прав администратора",
              variant: "destructive",
            });
            setTimeout(() => {
              window.location.href = '/profile';
            }, 2000);
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
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkAdminAccess();
  }, [user, profile, redirectOnFail, toast]);

  return {
    isAdmin,
    isChecking,
    hasAdminAccess: isAdmin === true,
  };
};
