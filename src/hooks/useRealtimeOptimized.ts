import { useRealtime } from '@/contexts/RealtimeProvider';

/**
 * Optimized hook that provides access to unified realtime functionality
 * Replaces individual realtime hooks with centralized management
 */
export const useRealtimeOptimized = () => {
  return useRealtime();
};

// Legacy hook aliases for backwards compatibility during transition
export const usePriceOffersRealtime = useRealtimeOptimized;
export const useProductsRealtime = useRealtimeOptimized;