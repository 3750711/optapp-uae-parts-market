
import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { usePriceOffersRealtime } from '@/hooks/usePriceOffersRealtime';
import { supabase } from '@/integrations/supabase/client';

interface SellerPriceOffersRealtimeProps {
  children: React.ReactNode;
}

export const SellerPriceOffersRealtime: React.FC<SellerPriceOffersRealtimeProps> = ({ children }) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  // Enable real-time updates
  usePriceOffersRealtime();

  // Additional seller-specific optimizations
  useEffect(() => {
    if (!user || !profile || profile.user_type !== 'seller') return;

    // Set up optimized real-time subscription for seller price offers
    const channel = supabase
      .channel('seller-price-offers-optimized')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'price_offers',
          filter: `seller_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('📞 Seller price offer change detected:', payload);
          
          // Use selective cache updates instead of full invalidation
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            // Update specific offer data
            queryClient.setQueryData(['seller-price-offers', user.id], (oldData: any) => {
              if (!oldData) return oldData;
              
              const newOffer = payload.new;
              if (payload.eventType === 'UPDATE') {
                return oldData.map((offer: any) => 
                  offer.id === newOffer.id ? { ...offer, ...newOffer } : offer
                );
              } else {
                return [newOffer, ...oldData];
              }
            });
          } else if (payload.eventType === 'DELETE') {
            queryClient.setQueryData(['seller-price-offers', user.id], (oldData: any) => {
              if (!oldData) return oldData;
              return oldData.filter((offer: any) => offer.id !== payload.old.id);
            });
          }
          
          // Also invalidate related queries
          queryClient.invalidateQueries({ queryKey: ['product-offers'] });
          queryClient.invalidateQueries({ queryKey: ['competitive-offers'] });
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 Cleaning up seller price offers real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user, profile, queryClient]);

  return <>{children}</>;
};
