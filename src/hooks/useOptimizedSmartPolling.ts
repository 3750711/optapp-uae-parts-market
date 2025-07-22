
import { useMemo } from 'react';
import { AuctionProduct } from './useBuyerAuctionProducts';

interface OptimizedPollingConfig {
  interval: number;
  shouldPoll: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low' | 'stopped';
  reason: string;
}

export const useOptimizedSmartPolling = (products: AuctionProduct[] = []): OptimizedPollingConfig => {
  const config = useMemo(() => {
    if (!products.length) {
      return { 
        interval: 30000, 
        shouldPoll: false, 
        priority: 'stopped' as const,
        reason: 'No products to poll'
      };
    }

    let minInterval = 30000;
    let maxPriority: OptimizedPollingConfig['priority'] = 'low';
    let shouldPoll = false;
    let reason = 'Default polling';

    for (const product of products) {
      const status = product.user_offer_status;
      const isLeading = product.is_user_leading;
      const expiresAt = product.user_offer_expires_at;
      
      // Skip cancelled offers
      if (status === 'cancelled') {
        continue;
      }

      const timeRemaining = expiresAt ? new Date(expiresAt).getTime() - Date.now() : 0;
      const minutesRemaining = timeRemaining / (1000 * 60);

      let productInterval = 30000;
      let priority: OptimizedPollingConfig['priority'] = 'low';
      let productReason = '';

      if (status === 'pending') {
        shouldPoll = true;
        
        // Critical: Last 30 minutes
        if (minutesRemaining > 0 && minutesRemaining <= 30) {
          productInterval = 2000; // 2 seconds
          priority = 'critical';
          productReason = `Critical: ${Math.floor(minutesRemaining)} minutes left`;
        }
        // High: User is not leading
        else if (!isLeading) {
          productInterval = 3000; // 3 seconds
          priority = 'high';
          productReason = 'High: User not leading';
        }
        // Medium: User is leading
        else if (isLeading) {
          productInterval = 5000; // 5 seconds
          priority = 'medium';
          productReason = 'Medium: User leading';
        }
        // Default active polling
        else {
          productInterval = 8000; // 8 seconds
          priority = 'medium';
          productReason = 'Medium: Active offer';
        }
      } else if (['accepted', 'rejected', 'expired'].includes(status || '')) {
        // Low priority for completed offers
        productInterval = 30000; // 30 seconds
        priority = 'low';
        shouldPoll = true;
        productReason = 'Low: Completed offer';
      }

      // Use the most aggressive interval needed
      if (productInterval < minInterval) {
        minInterval = productInterval;
        maxPriority = priority;
        reason = productReason;
      }
    }

    return {
      interval: minInterval,
      shouldPoll,
      priority: maxPriority,
      reason
    };
  }, [products]);

  return config;
};
