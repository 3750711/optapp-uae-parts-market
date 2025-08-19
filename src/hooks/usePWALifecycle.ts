import { useEffect } from 'react';
import { pwaLifecycleManager } from '@/utils/pwaLifecycleManager';
import { LifecycleOptions } from '@/types/pwa';

// Hook for React components
export const usePWALifecycle = (id: string, options: LifecycleOptions) => {
  useEffect(() => {
    return pwaLifecycleManager.register(id, options);
  }, [id]);

  return {
    isPWA: pwaLifecycleManager.shouldOptimizeForPWA(),
    forceSave: pwaLifecycleManager.forceSave,
    status: pwaLifecycleManager.getPWAStatus()
  };
};