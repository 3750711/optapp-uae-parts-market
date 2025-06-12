
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useAdminDataPreloader = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAdmin) return;

    // Предзагружаем данные для формы добавления товара
    const preloadAddProductData = async () => {
      try {
        console.log('🔄 Preloading admin add product data...');
        
        // Проверяем, есть ли уже данные в кэше
        const cachedData = queryClient.getQueryData(['admin', 'add-product-data']);
        if (cachedData) {
          console.log('✅ Admin add product data already cached');
          return;
        }

        // Предзагружаем данные
        await queryClient.prefetchQuery({
          queryKey: ['admin', 'add-product-data'],
          queryFn: async () => {
            const { data, error } = await supabase.rpc('get_admin_add_product_data');
            if (error) throw error;
            return data;
          },
          staleTime: 1000 * 60 * 15, // 15 минут
        });

        console.log('✅ Admin add product data preloaded');
      } catch (error) {
        console.warn('⚠️ Failed to preload admin add product data:', error);
      }
    };

    // Предзагружаем с небольшой задержкой, чтобы не блокировать основную загрузку
    const timeoutId = setTimeout(preloadAddProductData, 1000);

    return () => clearTimeout(timeoutId);
  }, [isAdmin, queryClient]);
};
