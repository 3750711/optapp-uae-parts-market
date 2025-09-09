import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SyncData {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retryCount?: number;
}

const SYNC_STORAGE_KEY = 'pwa_sync_queue';
const MAX_RETRIES = 3;

export const useBackgroundSync = () => {
  // Listen for SW background sync messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'BACKGROUND_SYNC') {
        console.log('📱 BG Sync: SW requested sync processing');
        processSyncQueue();
      }
    };
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  // Add data to sync queue
  const queueForSync = useCallback(async (type: string, data: any): Promise<string> => {
    const syncId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const syncData: SyncData = {
      id: syncId,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };

    try {
      // Store in IndexedDB or localStorage fallback
      const existingQueue = getQueueFromStorage();
      const updatedQueue = [...existingQueue, syncData];
      
      localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(updatedQueue));
      
      // Register background sync if available
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        // TypeScript workaround for background sync
        const syncManager = (registration as any).sync;
        if (syncManager) {
          await syncManager.register(`sync-${type}`);
        }
        console.log('📱 BG Sync: Registered sync for', type);
      } else {
        // Fallback: try to sync immediately if online
        if (navigator.onLine) {
          console.log('📱 BG Sync: No background sync support, attempting immediate sync');
          await processSyncQueue();
        }
      }
      
      return syncId;
    } catch (error) {
      console.error('📱 BG Sync: Failed to queue for sync:', error);
      throw error;
    }
  }, []);

  // Get queue from storage
  const getQueueFromStorage = useCallback((): SyncData[] => {
    try {
      const stored = localStorage.getItem(SYNC_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('📱 BG Sync: Failed to read queue:', error);
      return [];
    }
  }, []);

  // Process sync queue
  const processSyncQueue = useCallback(async (): Promise<void> => {
    const queue = getQueueFromStorage();
    if (queue.length === 0) return;

    console.log(`📱 BG Sync: Processing ${queue.length} queued items`);
    
    const successfulSyncs: string[] = [];
    const failedSyncs: SyncData[] = [];

    for (const item of queue) {
      try {
        const success = await syncItem(item);
        if (success) {
          successfulSyncs.push(item.id);
          console.log('📱 BG Sync: Successfully synced', item.type, item.id);
        } else {
          throw new Error('Sync failed');
        }
      } catch (error) {
        console.error('📱 BG Sync: Failed to sync item:', item.id, error);
        
        // Increment retry count
        const retryCount = (item.retryCount || 0) + 1;
        
        if (retryCount <= MAX_RETRIES) {
          failedSyncs.push({ ...item, retryCount });
        } else {
          console.error('📱 BG Sync: Max retries exceeded for', item.id);
        }
      }
    }

    // Update storage with remaining failed items
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(failedSyncs));
    
    console.log(`📱 BG Sync: Completed. Success: ${successfulSyncs.length}, Failed: ${failedSyncs.length}`);
  }, []);

  // Sync individual item based on type
  const syncItem = useCallback(async (item: SyncData): Promise<boolean> => {
    try {
      switch (item.type) {
        case 'free-order':
          return await syncFreeOrder(item.data);
        case 'price-offer':
          return await syncPriceOffer(item.data);
        case 'product-create':
          return await syncProduct(item.data);
        default:
          console.warn('📱 BG Sync: Unknown sync type:', item.type);
          return false;
      }
    } catch (error) {
      console.error('📱 BG Sync: Sync item error:', error);
      return false;
    }
  }, []);

  // Sync free order
  const syncFreeOrder = useCallback(async (orderData: any): Promise<boolean> => {
    try {
      const { error } = await supabase.functions.invoke('admin-free-order', {
        body: orderData
      });
      
      return !error;
    } catch (error) {
      console.error('Failed to sync free order:', error);
      return false;
    }
  }, []);

  // Sync price offer
  const syncPriceOffer = useCallback(async (offerData: any): Promise<boolean> => {
    try {
      const { error } = await supabase.functions.invoke('create-price-offer', {
        body: offerData
      });
      
      return !error;
    } catch (error) {
      console.error('Failed to sync price offer:', error);
      return false;
    }
  }, []);

  // Sync product
  const syncProduct = useCallback(async (productData: any): Promise<boolean> => {
    try {
      const { error } = await supabase.functions.invoke('create-product', {
        body: productData
      });
      
      return !error;
    } catch (error) {
      console.error('Failed to sync product:', error);
      return false;
    }
  }, []);

  // Get pending sync count
  const getPendingCount = useCallback((): number => {
    return getQueueFromStorage().length;
  }, [getQueueFromStorage]);

  // Clear all pending syncs
  const clearQueue = useCallback((): void => {
    localStorage.removeItem(SYNC_STORAGE_KEY);
    console.log('📱 BG Sync: Queue cleared');
  }, []);

  return {
    queueForSync,
    processSyncQueue,
    getPendingCount,
    clearQueue,
    getQueue: getQueueFromStorage
  };
};