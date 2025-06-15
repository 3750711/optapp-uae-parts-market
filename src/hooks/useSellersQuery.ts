
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
        console.log('🔍 Fetching all sellers from profiles...');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id')
        .eq('user_type', 'seller')
        .not('full_name', 'is', null)
        .order('full_name', { ascending: true });

      if (error) {
        console.error('❌ Error fetching sellers from profiles:', error);
        throw error;
      }

      const sellers = data.map(profile => ({
        id: profile.id,
        name: profile.full_name || 'Unnamed Seller',
        opt_id: profile.opt_id || undefined,
      }));
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Loaded sellers from profiles:', sellers.length);
      }
      return sellers;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    gcTime: 1000 * 60 * 10, // 10 minutes in memory
  });
};
