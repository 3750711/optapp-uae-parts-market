
// Legacy hook - functionality moved to unified RealtimeProvider
// This file is kept for backwards compatibility during transition

import { useRealtime } from '@/contexts/RealtimeProvider';

/**
 * @deprecated Use RealtimeProvider context instead
 * This hook is now handled centrally by RealtimeProvider
 */
export const usePriceOffersRealtime = () => {
  // Return realtime context for compatibility
  return useRealtime();
};
