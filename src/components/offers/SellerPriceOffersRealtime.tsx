
import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { usePriceOffersRealtime } from '@/hooks/usePriceOffersRealtime';

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

    // Clear cache and force fresh data for seller offers
    queryClient.removeQueries({ queryKey: ['seller-price-offers'] });
    
    // Prefetch seller offers with no stale time to ensure fresh data
    queryClient.prefetchQuery({
      queryKey: ['seller-price-offers', user.id],
      staleTime: 0, // Always fetch fresh data
    });
  }, [user, profile, queryClient]);

  return <>{children}</>;
};
