import { useMemo } from 'react';
import { useSellerPriceOffers } from '@/hooks/use-price-offers';

// Optimized hook for seller dashboard that only loads count data
export const useOptimizedSellerDashboard = () => {
  const { data: priceOffers, isLoading: offersLoading, error } = useSellerPriceOffers();

  // Memoized pending offers count to prevent unnecessary recalculations
  const pendingOffersCount = useMemo(() => {
    if (!priceOffers || offersLoading) return 0;
    return priceOffers.filter(offer => offer.status === 'pending').length;
  }, [priceOffers, offersLoading]);

  // Memoized stats for dashboard
  const dashboardStats = useMemo(() => {
    if (!priceOffers || offersLoading) {
      return {
        total: 0,
        pending: 0,
        accepted: 0,
        rejected: 0,
        hasOffers: false
      };
    }

    const stats = priceOffers.reduce((acc, offer) => {
      acc.total++;
      if (offer.status === 'pending') acc.pending++;
      else if (offer.status === 'accepted') acc.accepted++;
      else if (offer.status === 'rejected') acc.rejected++;
      return acc;
    }, { total: 0, pending: 0, accepted: 0, rejected: 0 });

    return {
      ...stats,
      hasOffers: stats.total > 0
    };
  }, [priceOffers, offersLoading]);

  return {
    pendingOffersCount,
    dashboardStats,
    isLoading: offersLoading,
    error
  };
};