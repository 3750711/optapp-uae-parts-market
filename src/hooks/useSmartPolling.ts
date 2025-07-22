
import { useMemo, useState, useEffect } from 'react';
import { AuctionProduct } from './useBuyerAuctionProducts';

interface PollingConfig {
  interval: number;
  shouldPoll: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low' | 'stopped';
}

export const useSmartPolling = (products: AuctionProduct[] = []): PollingConfig => {
  const config = useMemo(() => {
    if (!products.length) {
      return { interval: 30000, shouldPoll: false, priority: 'stopped' as const };
    }

    // Analyze all products to determine the most critical polling need
    let minInterval = 30000; // Default 30 seconds
    let maxPriority: PollingConfig['priority'] = 'low';
    let shouldPoll = false;

    for (const product of products) {
      const status = product.user_offer_status;
      const isLeading = product.is_user_leading;
      const expiresAt = product.user_offer_expires_at;
      
      // Skip cancelled offers - no polling needed
      if (status === 'cancelled') {
        continue;
      }

      // Calculate time remaining
      const timeRemaining = expiresAt ? new Date(expiresAt).getTime() - Date.now() : 0;
      const hoursRemaining = timeRemaining / (1000 * 60 * 60);

      let productInterval = 30000;
      let priority: PollingConfig['priority'] = 'low';

      if (status === 'pending') {
        shouldPoll = true;
        
        // Critical: Ending soon (< 30 minutes)
        if (hoursRemaining > 0 && hoursRemaining < 0.5) {
          productInterval = 2000; // 2 seconds
          priority = 'critical';
        }
        // High: User is trailing
        else if (!isLeading) {
          productInterval = 3000; // 3 seconds
          priority = 'high';
        }
        // Medium: User is leading
        else if (isLeading) {
          productInterval = 5000; // 5 seconds
          priority = 'medium';
        }
        // Default active polling
        else {
          productInterval = 3000; // 3 seconds
          priority = 'high';
        }
      } else if (['accepted', 'rejected', 'expired'].includes(status || '')) {
        // Low priority for completed offers
        productInterval = 30000; // 30 seconds
        priority = 'low';
        shouldPoll = true;
      }

      // Use the most aggressive interval needed
      if (productInterval < minInterval) {
        minInterval = productInterval;
        maxPriority = priority;
      }
    }

    return {
      interval: minInterval,
      shouldPoll,
      priority: maxPriority
    };
  }, [products]);

  return config;
};

export const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return isVisible;
};
