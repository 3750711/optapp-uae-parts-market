
import React, { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { usePriceOffersRealtime } from '@/hooks/usePriceOffersRealtime';
import { supabase } from '@/integrations/supabase/client';
import { devLog, prodError } from '@/utils/logger';

// Simple debounce utility
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

interface SellerPriceOffersRealtimeProps {
  children: React.ReactNode;
}

export const SellerPriceOffersRealtime: React.FC<SellerPriceOffersRealtimeProps> = ({ children }) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const mountedRef = useRef(true);
  const channelRef = useRef<any>(null);

  // Enable base real-time updates
  usePriceOffersRealtime();

  // Debounced invalidation to prevent excessive queries
  const debouncedInvalidateQueries = useCallback(
    debounce((queryKeys: string[]) => {
      if (!mountedRef.current) return;
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key], exact: true });
      });
    }, 300),
    [queryClient]
  );

  // Additional seller-specific optimizations
  useEffect(() => {
    if (!user || !profile || profile.user_type !== 'seller') return;

    mountedRef.current = true;
    devLog('Setting up optimized seller real-time subscription');

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
          if (!mountedRef.current) return;
          
          devLog('Seller price offer change detected:', payload.eventType);
          
          try {
            // Use selective cache updates instead of full invalidation
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              // Update specific offer data with optimistic updates
              queryClient.setQueryData(['seller-price-offers', user.id], (oldData: any) => {
                if (!oldData || !mountedRef.current) return oldData;
                
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
                if (!oldData || !mountedRef.current) return oldData;
                return oldData.filter((offer: any) => offer.id !== payload.old.id);
              });
            }
            
            // Debounced invalidation of related queries
            debouncedInvalidateQueries(['product-offers', 'competitive-offers']);
          } catch (error) {
            prodError(error instanceof Error ? error : new Error(String(error)), {
              context: 'seller-realtime-subscription',
              eventType: payload.eventType,
              userId: user.id
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      mountedRef.current = false;
      devLog('Cleaning up seller price offers real-time subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, profile, queryClient, debouncedInvalidateQueries]);

  return <>{children}</>;
};
