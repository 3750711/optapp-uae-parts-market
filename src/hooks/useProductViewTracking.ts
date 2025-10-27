import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

const VIEW_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const TRACK_DELAY_MS = 2000; // 2 seconds delay

/**
 * Hook to track product views with intelligent debouncing
 * - Only tracks once per 24 hours per product (localStorage)
 * - 2 second delay before tracking (prevents accidental clicks)
 * - Only tracks for authenticated users
 */
export const useProductViewTracking = (productId: string | undefined, userId: string | undefined) => {
  const trackView = useCallback(async (id: string) => {
    try {
      const storageKey = `view_${id}`;
      const lastView = localStorage.getItem(storageKey);
      const now = Date.now();
      
      // Check if we've tracked this product recently
      if (lastView && now - parseInt(lastView) < VIEW_COOLDOWN_MS) {
        logger.log(`Product view already tracked recently: ${id}`);
        return;
      }
      
      // Track the view
      const { error } = await supabase.rpc('increment_product_view_count', { 
        product_id: id 
      });
      
      if (error) {
        logger.error('Failed to track product view:', error);
        return;
      }
      
      // Save timestamp to localStorage
      localStorage.setItem(storageKey, now.toString());
      logger.log(`Product view tracked: ${id}`);
    } catch (error) {
      logger.error('Error tracking product view:', error);
    }
  }, []);
  
  useEffect(() => {
    if (!productId || !userId) {
      return;
    }
    
    // Delay tracking by 2 seconds to ensure user is actually viewing the product
    const timer = setTimeout(() => {
      trackView(productId);
    }, TRACK_DELAY_MS);
    
    return () => clearTimeout(timer);
  }, [productId, userId, trackView]);
};
