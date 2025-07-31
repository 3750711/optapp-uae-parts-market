
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
          
          // Force remove all relevant caches
          queryClient.removeQueries({ queryKey: ['user-offer'] });
          queryClient.removeQueries({ queryKey: ['competitive-offers'] });
          queryClient.removeQueries({ queryKey: ['product-offers'] });
          queryClient.removeQueries({ queryKey: ['buyer-price-offers'] });
          queryClient.removeQueries({ queryKey: ['seller-price-offers'] });
          queryClient.removeQueries({ queryKey: ['admin-price-offers'] });
          queryClient.removeQueries({ queryKey: ['buyer-offers'] });
          queryClient.removeQueries({ queryKey: ['buyer-offer-counts'] });
          
          // Force refetch after cache clear with slight delay
          setTimeout(() => {
            queryClient.refetchQueries({ queryKey: ['seller-price-offers'] });
            queryClient.refetchQueries({ queryKey: ['buyer-price-offers'] });
            queryClient.refetchQueries({ queryKey: ['admin-price-offers'] });
          }, 100);
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
          
          // Force remove all relevant caches for new offers
          queryClient.removeQueries({ queryKey: ['competitive-offers'] });
          queryClient.removeQueries({ queryKey: ['product-offers'] });
          queryClient.removeQueries({ queryKey: ['seller-price-offers'] });
          queryClient.removeQueries({ queryKey: ['admin-price-offers'] });
          queryClient.removeQueries({ queryKey: ['buyer-offers'] });
          queryClient.removeQueries({ queryKey: ['buyer-offer-counts'] });
          
          // Force refetch after cache clear
          setTimeout(() => {
            queryClient.refetchQueries({ queryKey: ['seller-price-offers'] });
            queryClient.refetchQueries({ queryKey: ['admin-price-offers'] });
          }, 100);
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up real-time subscription for price offers');
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
};
