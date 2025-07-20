
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
          
          // Принудительно обновляем кеш с задержкой для обеспечения получения новых данных
          setTimeout(() => {
            queryClient.invalidateQueries({ 
              queryKey: ['simple-offers', productId] 
            });
            
            // Также принудительно перезапрашиваем данные
            queryClient.refetchQueries({
              queryKey: ['simple-offers', productId]
            });
          }, 100);
        }
      )
      .subscribe((status) => {
        console.log('🔄 Real-time status for product', productId, ':', status);
      });

    return () => {
      console.log('🔄 Cleaning up real-time for product:', productId);
      supabase.removeChannel(channel);
    };
  }, [enabled, productId, queryClient]);
};
