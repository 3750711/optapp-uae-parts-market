
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdminAddProductData {
  brands: Array<{ id: string; name: string }>;
  models: Array<{ id: string; brand_id: string; name: string }>;
  sellers: Array<{ id: string; full_name: string; opt_id: string }>;
  timestamp: number;
}

export const useOptimizedAdminAddProductData = () => {
  return useQuery({
    queryKey: ['admin', 'add-product-data'],
    queryFn: async (): Promise<AdminAddProductData> => {
      console.log('🔄 Fetching admin add product data with single RPC call...');
      const startTime = performance.now();
      
      const { data, error } = await supabase.rpc('get_admin_add_product_data');
      
      if (error) {
        console.error('❌ Error fetching admin add product data:', error);
        throw error;
      }

      const endTime = performance.now();
      console.log(`✅ Admin add product data loaded in ${(endTime - startTime).toFixed(2)}ms`);
      
      return data as AdminAddProductData;
    },
    staleTime: 1000 * 60 * 15, // 15 минут агрессивный кэш
    gcTime: 1000 * 60 * 30, // 30 минут в памяти
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Не перезапрашиваем при маунте если данные свежие
  });
};
