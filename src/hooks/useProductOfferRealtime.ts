
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBatchOffersInvalidation } from '@/hooks/use-price-offers-batch';
import { useOfferState } from '@/contexts/OfferStateContext';

/**
 * Hook for real-time updates of product offer data
 * Listens to changes in price_offers and products tables
 * and invalidates relevant queries to trigger re-fetching
 */
export const useProductOfferRealtime = (productId?: string) => {
  const queryClient = useQueryClient();
  const { invalidateBatchOffers } = useBatchOffersInvalidation();
  const { updateOfferState } = useOfferState();

  useEffect(() => {
    if (!productId) return;

    console.log(`🔄 Setting up real-time updates for product ${productId}`);

    const channel = supabase
      .channel(`product-offers-${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'price_offers',
          filter: `product_id=eq.${productId}`
        },
        async (payload) => {
          console.log('🔄 Real-time price offer update:', {
            productId,
            event: payload.eventType,
            new: payload.new,
            old: payload.old,
            timestamp: new Date().toISOString()
          });
          
          // Получаем свежие данные о предложениях для этого продукта
          try {
            const { data: productData, error } = await supabase
              .from('products')
              .select('has_active_offers, max_offer_price, offers_count')
              .eq('id', productId)
              .single();

            if (!error && productData) {
              console.log('🆕 Updating offer state from real-time:', {
                productId,
                newData: productData
              });
              
              // Обновляем контекст состояния предложений
              updateOfferState(productId, {
                hasActiveOffers: productData.has_active_offers || false,
                maxOfferPrice: productData.max_offer_price,
                offersCount: productData.offers_count || 0,
                isOptimistic: false
              });
            }
          } catch (error) {
            console.error('Error fetching fresh product data in real-time:', error);
          }
          
          // Invalidate individual offer queries
          queryClient.invalidateQueries({ 
            queryKey: ['pending-offer', productId] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['competitive-offers', productId] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['admin-products'] 
          });
          
          // КРИТИЧНО: Инвалидируем именно catalog queries для обновления кнопок
          queryClient.invalidateQueries({ 
            queryKey: ['products-infinite-optimized'] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['catalog-products'] 
          });
          
          console.log('✅ Invalidated catalog queries for product', productId);
          
          // Invalidate batch offers for this product
          invalidateBatchOffers([productId]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${productId}`
        },
        (payload) => {
          console.log('🔄 Real-time product update:', {
            productId,
            new: payload.new,
            old: payload.old,
            timestamp: new Date().toISOString()
          });
          
          // Обновляем контекст состояния предложений если изменились флаги
          if (payload.new) {
            const newData = payload.new as any;
            updateOfferState(productId, {
              hasActiveOffers: newData.has_active_offers || false,
              maxOfferPrice: newData.max_offer_price,
              offersCount: newData.offers_count || 0,
              isOptimistic: false
            });
          }
          
          // Invalidate product data when optimization fields change
          queryClient.invalidateQueries({ 
            queryKey: ['admin-products'] 
          });
          
          // КРИТИЧНО: Инвалидируем catalog queries для обновления данных продукта
          queryClient.invalidateQueries({ 
            queryKey: ['products-infinite-optimized'] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['catalog-products'] 
          });
          
          console.log('✅ Invalidated catalog queries for product update', productId);
          
          // Also invalidate batch offers since product data affects offer calculations
          invalidateBatchOffers([productId]);
        }
      )
      .subscribe();

    return () => {
      console.log(`🔌 Cleaning up real-time updates for product ${productId}`);
      supabase.removeChannel(channel);
    };
  }, [productId, queryClient, invalidateBatchOffers, updateOfferState]);
};
