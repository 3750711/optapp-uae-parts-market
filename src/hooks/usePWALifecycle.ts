import { useEffect } from 'react';
import { pwaLifecycleManager } from '@/utils/pwaLifecycleManager';

interface LifecycleOptions {
  onVisibilityChange?: (isHidden: boolean) => void;
  onPageHide?: () => void;
  onPageShow?: (event: PageTransitionEvent) => void;
  onFreeze?: () => void;
  onResume?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  enableBfcacheOptimization?: boolean;
  debounceDelay?: number;
  skipFastSwitching?: boolean;
}

// React hook for PWA lifecycle management
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