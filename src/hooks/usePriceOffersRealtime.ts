
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PriceOffer } from '@/types/price-offer';

export const usePriceOffersRealtime = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    console.log('🔄 Setting up real-time subscription for price offers');

    const channel = supabase
      .channel('price_offers_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'price_offers',
        },
        (payload) => {
          console.log('📡 Real-time price offer update:', payload);
          
          const updatedOffer = payload.new as PriceOffer;
          const productId = updatedOffer.product_id;
          
          // Use selective invalidation instead of removing all queries
          queryClient.invalidateQueries({ queryKey: ['user-offer'] });
          queryClient.invalidateQueries({ queryKey: ['competitive-offers'] });
          queryClient.invalidateQueries({ queryKey: ['product-offers'] });
          queryClient.invalidateQueries({ queryKey: ['buyer-price-offers'] });
          queryClient.invalidateQueries({ queryKey: ['seller-price-offers'] });
          queryClient.invalidateQueries({ queryKey: ['admin-price-offers'] });
          queryClient.invalidateQueries({ queryKey: ['buyer-offers'] });
          queryClient.invalidateQueries({ queryKey: ['buyer-offer-counts'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'price_offers',
        },
        (payload) => {
          console.log('📡 Real-time price offer created:', payload);
          
          // Use selective invalidation for new offers
          queryClient.invalidateQueries({ queryKey: ['competitive-offers'] });
          queryClient.invalidateQueries({ queryKey: ['product-offers'] });
          queryClient.invalidateQueries({ queryKey: ['seller-price-offers'] });
          queryClient.invalidateQueries({ queryKey: ['admin-price-offers'] });
          queryClient.invalidateQueries({ queryKey: ['buyer-offers'] });
          queryClient.invalidateQueries({ queryKey: ['buyer-offer-counts'] });
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up real-time subscription for price offers');
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
};
