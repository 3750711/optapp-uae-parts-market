import { useEffect } from 'react';
import { pwaLifecycleManager } from '@/utils/pwaLifecycleManager';
import { LifecycleOptions } from '@/types/pwa';

// Admin-specific PWA lifecycle hook with optimized settings
export const useAdminPWALifecycle = (id: string, onRefresh?: () => void) => {
  useEffect(() => {
    const options: LifecycleOptions = {
      onVisibilityChange: (isHidden: boolean) => {
        if (!isHidden && onRefresh) {
          // Мягкий рефреш только при возврате в админку
          
          setTimeout(onRefresh, 300); // Задержка для стабильности
        }
      },
      onPageShow: (event: PageTransitionEvent) => {
        if (event.persisted) {
          
          // НЕ делаем автоматический рефреш при bfcache - данные должны остаться
        }
      },
      enableBfcacheOptimization: true,
      skipFastSwitching: true,
      debounceDelay: 500,
    };

    return pwaLifecycleManager.register(id, options);
  }, [id, onRefresh]);

  return {
    isPWA: pwaLifecycleManager.shouldOptimizeForPWA(),
    forceSave: pwaLifecycleManager.forceSave,
    status: pwaLifecycleManager.getPWAStatus(),
  };
};