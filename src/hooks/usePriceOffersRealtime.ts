
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
          
          // Invalidate all relevant caches
          queryClient.invalidateQueries({ queryKey: ['user-offer', productId] });
          queryClient.invalidateQueries({ queryKey: ['competitive-offers', productId] });
          queryClient.invalidateQueries({ queryKey: ['product-offers', productId] });
          queryClient.invalidateQueries({ queryKey: ['buyer-price-offers'] });
          queryClient.invalidateQueries({ queryKey: ['seller-price-offers'] });
          queryClient.invalidateQueries({ queryKey: ['admin-price-offers'] });
          queryClient.invalidateQueries({ queryKey: ['buyer-offers'] });
          queryClient.invalidateQueries({ queryKey: ['buyer-offer-counts'] });
          
          // Optimistically update the cache with new data
          queryClient.setQueryData(['user-offer', productId], (oldData: any) => {
            if (oldData && oldData.id === updatedOffer.id) {
              return updatedOffer;
            }
            return oldData;
          });
          
          // Force refetch for immediate UI consistency
          queryClient.refetchQueries({ queryKey: ['seller-price-offers'] });
          queryClient.refetchQueries({ queryKey: ['admin-price-offers'] });
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
          
          const newOffer = payload.new as PriceOffer;
          const productId = newOffer.product_id;
          
          // Invalidate relevant caches for new offers
          queryClient.invalidateQueries({ queryKey: ['competitive-offers', productId] });
          queryClient.invalidateQueries({ queryKey: ['product-offers', productId] });
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
