
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Простой real-time хук для обновления предложений
export const useSimpleRealTimeOffers = (productId: string, enabled: boolean = true) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !productId) return;

    console.log('🔄 Setting up simple real-time for product:', productId);

    const channel = supabase
      .channel(`offers_${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'price_offers',
          filter: `product_id=eq.${productId}`
        },
        (payload) => {
          console.log('🔄 Real-time update received:', payload);
          
          // Простое обновление кеша
          queryClient.invalidateQueries({ 
            queryKey: ['simple-offers', productId] 
          });
        }
      )
      .subscribe((status) => {
        console.log('🔄 Real-time status:', status);
      });

    return () => {
      console.log('🔄 Cleaning up real-time for product:', productId);
      supabase.removeChannel(channel);
    };
  }, [enabled, productId, queryClient]);
};
