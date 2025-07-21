
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback } from 'react';

export const useProductRefresh = () => {
  const queryClient = useQueryClient();

  const refreshProduct = useCallback(async (productId: string) => {
    console.log(`🔄 Force refreshing product ${productId}`);
    
    try {
      // Получаем свежие данные напрямую из базы
      const { data: freshProduct, error } = await supabase
        .from('products')
        .select('has_active_offers, max_offer_price, offers_count')
        .eq('id', productId)
        .single();

      if (error) {
        console.error('Error fetching fresh product data:', error);
        return null;
      }

      console.log(`✅ Fresh product data for ${productId}:`, freshProduct);

      // Обновляем все связанные кэши
      const queryKeys = [
        ['products-infinite-optimized'],
        ['catalog-products'],
        ['admin-products'],
        ['batch-offers']
      ];

      for (const queryKey of queryKeys) {
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData) return oldData;

          // Для infinite queries
          if (oldData.pages) {
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                data: page.data?.map((item: any) => 
                  item.id === productId 
                    ? { ...item, ...freshProduct }
                    : item
                ) || []
              }))
            };
          }

          // Для обычных массивов
          if (Array.isArray(oldData)) {
            return oldData.map((item: any) => 
              item.id === productId || item.product_id === productId
                ? { ...item, ...freshProduct }
                : item
            );
          }

          return oldData;
        });
      }

      // Инвалидируем для полного обновления
      queryClient.invalidateQueries({ queryKey: ['products-infinite-optimized'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] });

      return freshProduct;
    } catch (error) {
      console.error('Error in refreshProduct:', error);
      return null;
    }
  }, [queryClient]);

  const refreshMultipleProducts = useCallback(async (productIds: string[]) => {
    console.log(`🔄 Force refreshing multiple products:`, productIds);
    
    const results = await Promise.all(
      productIds.map(id => refreshProduct(id))
    );
    
    return results;
  }, [refreshProduct]);

  return {
    refreshProduct,
    refreshMultipleProducts
  };
};
