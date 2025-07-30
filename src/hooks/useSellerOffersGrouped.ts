import { useMemo } from 'react';
import { useSellerPriceOffers } from '@/hooks/use-price-offers';
import { PriceOffer } from '@/types/price-offer';
import { Product } from '@/types/product';

export interface GroupedOfferStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  expired: number;
  cancelled: number;
}

export interface GroupedOffer {
  product: Product;
  offers: PriceOffer[];
  stats: GroupedOfferStats;
}

export const useSellerOffersGrouped = () => {
  const { data: offers, isLoading, error } = useSellerPriceOffers();

  const groupedOffers = useMemo(() => {
    if (!offers || offers.length === 0) return [];

    // Group offers by product_id
    const grouped = new Map<string, PriceOffer[]>();
    
    offers.forEach(offer => {
      if (!offer.product_id) return;
      
      if (!grouped.has(offer.product_id)) {
        grouped.set(offer.product_id, []);
      }
      grouped.get(offer.product_id)!.push(offer);
    });

    // Convert to GroupedOffer array with stats
    const result: GroupedOffer[] = [];
    
    grouped.forEach((productOffers, productId) => {
      // Get product from first offer (they all have the same product)
      const firstOffer = productOffers[0];
      if (!firstOffer.product) return;

      // Calculate stats
      const stats: GroupedOfferStats = {
        total: productOffers.length,
        pending: productOffers.filter(o => o.status === 'pending').length,
        accepted: productOffers.filter(o => o.status === 'accepted').length,
        rejected: productOffers.filter(o => o.status === 'rejected').length,
        expired: productOffers.filter(o => o.status === 'expired').length,
        cancelled: productOffers.filter(o => o.status === 'cancelled').length,
      };

      // Sort offers within product (pending first, then by date)
      const sortedOffers = [...productOffers].sort((a, b) => {
        // Priority: pending > accepted > rejected > expired > cancelled
        const statusPriority = { 
          'pending': 0, 
          'accepted': 1, 
          'rejected': 2, 
          'expired': 3, 
          'cancelled': 4 
        };
        
        const aPriority = statusPriority[a.status as keyof typeof statusPriority] ?? 5;
        const bPriority = statusPriority[b.status as keyof typeof statusPriority] ?? 5;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // If same status, sort by date (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      result.push({
        product: firstOffer.product as Product,
        offers: sortedOffers,
        stats,
      });
    });

    // Sort products: those with pending offers first, then by latest offer date
    return result.sort((a, b) => {
      // Products with pending offers come first
      if (a.stats.pending > 0 && b.stats.pending === 0) return -1;
      if (a.stats.pending === 0 && b.stats.pending > 0) return 1;
      
      // If both have or don't have pending offers, sort by latest offer date
      const aLatestDate = Math.max(...a.offers.map(o => new Date(o.created_at).getTime()));
      const bLatestDate = Math.max(...b.offers.map(o => new Date(o.created_at).getTime()));
      
      return bLatestDate - aLatestDate;
    });
  }, [offers]);

  return {
    data: groupedOffers,
    isLoading,
    error,
  };
};