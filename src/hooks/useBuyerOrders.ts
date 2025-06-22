
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SimpleAuthContext';

export const useBuyerOrders = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['buyer-orders', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          seller:profiles!orders_seller_id_fkey (
            full_name,
            opt_id,
            telegram
          )
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};
