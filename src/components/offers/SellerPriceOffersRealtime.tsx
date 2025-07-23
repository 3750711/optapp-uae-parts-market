
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

    // Prefetch seller offers on component mount for better UX
    queryClient.prefetchQuery({
      queryKey: ['seller-price-offers', user.id],
      staleTime: 10 * 1000, // 10 seconds
    });
  }, [user, queryClient]);

  return <>{children}</>;
};
