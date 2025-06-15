
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

interface AccessValidationResult {
  hasAccess: boolean;
  userType: string | null;
  isLoading: boolean;
  error: Error | null;
}

export const useServerAccessValidation = (requiredRole: 'admin' | 'seller' | 'buyer' | null = null) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Серверная проверка прав доступа
  const { data: serverValidation, isLoading, error } = useQuery({
    queryKey: ['access-validation', user?.id, requiredRole],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Вызываем серверную функцию для проверки прав
      const { data, error } = await supabase.rpc('validate_user_access', {
        p_user_id: user.id,
        p_required_role: requiredRole
      });

      if (error) {
        console.error('❌ Server access validation error:', error);
        throw error;
      }

      console.log('✅ Server access validation result:', data);
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 10 * 60 * 1000, // 10 минут
    retry: (failureCount, error) => {
      // Не повторяем запрос при ошибках авторизации
      if (error.message.includes('not authenticated') || 
          error.message.includes('access denied')) {
        return false;
      }
      return failureCount < 2;
    }
  });

  // Проверяем результат и принимаем соответствующие действия
  useEffect(() => {
    if (serverValidation && !serverValidation.has_access) {
      toast({
        title: "Доступ запрещен",
        description: "У вас нет прав для доступа к этой странице",
        variant: "destructive",
      });
      
      // Перенаправляем на соответствующую страницу
      if (profile?.user_type === 'seller') {
        navigate('/seller/dashboard');
      } else if (profile?.user_type === 'buyer') {
        navigate('/');
      } else {
        navigate('/login');
      }
    }
  }, [serverValidation, profile, toast, navigate]);

  // Логирование для отладки
  useEffect(() => {
    if (error) {
      console.error('🔒 Access validation error:', error);
    }
  }, [error]);

  const result: AccessValidationResult = {
    hasAccess: serverValidation?.has_access ?? false,
    userType: serverValidation?.user_type ?? profile?.user_type ?? null,
    isLoading,
    error
  };

  return result;
};

// Хук специально для админских страниц
export const useAdminAccessValidation = () => {
  return useServerAccessValidation('admin');
};

// Хук специально для продавцов
export const useSellerAccessValidation = () => {
  return useServerAccessValidation('seller');
};

// Компонент-обертка для защищенных страниц
export const AccessGuard: React.FC<{ 
  children: React.ReactNode; 
  requiredRole: 'admin' | 'seller' | 'buyer';
}> = ({ children, requiredRole }) => {
  const { hasAccess, isLoading } = useServerAccessValidation(requiredRole);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-optapp-yellow"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Доступ запрещен</h2>
          <p className="text-gray-600">У вас нет прав для просмотра этой страницы</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
