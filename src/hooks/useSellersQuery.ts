
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Seller {
  id: string;
  name: string;
  opt_id?: string;
}

export const useSellersQuery = () => {
  return useQuery({
    queryKey: ['admin-products-sellers'],
    queryFn: async (): Promise<Seller[]> => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Fetching all unique sellers...');
      }

      const { data, error } = await supabase
        .from('products')
        .select('seller_id, seller_name, optid_created')
        .not('seller_id', 'is', null)
        .not('seller_name', 'is', null);

      if (error) {
        console.error('❌ Error fetching sellers:', error);
        throw error;
      }

      // Extract unique sellers
      const uniqueSellers = new Map();
      data?.forEach(product => {
        if (product.seller_id && product.seller_name) {
          uniqueSellers.set(product.seller_id, {
            id: product.seller_id,
            name: product.seller_name,
            opt_id: product.optid_created
          });
        }
      });

      const sellers = Array.from(uniqueSellers.values()).sort((a: Seller, b: Seller) => 
        a.name.localeCompare(b.name)
      );
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Loaded sellers:', sellers.length);
      }
      return sellers;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    gcTime: 1000 * 60 * 10, // 10 minutes in memory
  });
};
