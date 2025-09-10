import { useEffect } from 'react';
import { simplifiedPWAManager, SimplePWAOptions } from '@/utils/simplifiedPWAManager';

// Simplified PWA hook - replaces complex usePWALifecycle
export const useSimplePWA = (id: string, options: SimplePWAOptions) => {
  useEffect(() => {
    return simplifiedPWAManager.register(id, options);
  }, [id]);

  return {
    isPWA: simplifiedPWAManager.shouldOptimizeForPWA(),
    forceSave: simplifiedPWAManager.forceSave,
    status: simplifiedPWAManager.getPWAStatus()
  };
};