import { useEffect } from 'react';
import { simplifiedPWAManager } from '@/utils/simplifiedPWAManager';

// Simplified Admin PWA lifecycle hook 
export const useAdminPWALifecycle = (id: string, onRefresh?: () => void) => {
  useEffect(() => {
    return simplifiedPWAManager.register(id, {
      onVisibilityChange: (isHidden: boolean) => {
        if (!isHidden && onRefresh) {
          // Soft refresh when returning to admin
          setTimeout(onRefresh, 300);
        }
      },
      onPageHide: () => {
        // Admin might have unsaved changes
        console.log('🔄 Admin page hidden - potential save point');
      }
    });
  }, [id, onRefresh]);

  return {
    isPWA: simplifiedPWAManager.shouldOptimizeForPWA(),
    forceSave: simplifiedPWAManager.forceSave,
    status: simplifiedPWAManager.getPWAStatus(),
  };
};