
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useBuyerAuctionProducts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['buyer-auction-products', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Get products where user has price offers
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images (
            id,
            url,
            is_primary
          ),
          product_videos (
            id,
            url
          ),
          price_offers!inner (
            id,
            offered_price,
            status,
            created_at,
            expires_at
          )
        `)
        .eq('price_offers.buyer_id', user.id)
        .in('status', ['active', 'sold'])
        .order('price_offers.created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    },
    enabled: !!user,
  });
};
