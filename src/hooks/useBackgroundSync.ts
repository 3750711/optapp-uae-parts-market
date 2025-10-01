import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SyncData {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retryCount?: number;
}

type SyncCallback = (syncId: string, success: boolean, error?: any) => void;

const SYNC_STORAGE_KEY = 'pwa_sync_queue';
const MAX_RETRIES = 3;
const PERIODIC_CHECK_INTERVAL = 30000; // 30 seconds
const RETRY_DELAY = 10000; // 10 seconds

export const useBackgroundSync = () => {
  const isProcessingRef = useRef(false);
  const callbacksRef = useRef<Map<string, SyncCallback>>(new Map());
  const periodicCheckRef = useRef<NodeJS.Timeout>();

  // Process sync queue with concurrency protection
  const processSyncQueue = useCallback(async (): Promise<void> => {
    if (isProcessingRef.current) {
      console.log('📱 BG Sync: Already processing, skipping');
      return;
    }

    isProcessingRef.current = true;

    try {
      const queue = getQueueFromStorage();
      if (queue.length === 0) {
        console.log('📱 BG Sync: Queue is empty');
        return;
      }

      console.log(`📱 BG Sync: Processing ${queue.length} queued items`);
      
      const successfulSyncs: string[] = [];
      const failedSyncs: SyncData[] = [];

      for (const item of queue) {
        try {
          const success = await syncItem(item);
          if (success) {
            successfulSyncs.push(item.id);
            console.log('✅ BG Sync: Successfully synced', item.type, item.id);
            
            // Call success callback if exists
            const callback = callbacksRef.current.get(item.id);
            if (callback) {
              callback(item.id, true);
              callbacksRef.current.delete(item.id);
            }
          } else {
            throw new Error('Sync failed');
          }
        } catch (error) {
          console.error('❌ BG Sync: Failed to sync item:', item.id, error);
          
          // Increment retry count
          const retryCount = (item.retryCount || 0) + 1;
          
          if (retryCount <= MAX_RETRIES) {
            failedSyncs.push({ ...item, retryCount });
            console.log(`🔄 BG Sync: Will retry ${item.id} (attempt ${retryCount}/${MAX_RETRIES})`);
          } else {
            console.error('💥 BG Sync: Max retries exceeded for', item.id);
            
            // Call failure callback if exists
            const callback = callbacksRef.current.get(item.id);
            if (callback) {
              callback(item.id, false, error);
              callbacksRef.current.delete(item.id);
            }
          }
        }
      }

      // Update storage with remaining failed items
      try {
        localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(failedSyncs));
      } catch (storageError) {
        console.error('❌ BG Sync: Failed to update localStorage:', storageError);
        handleStorageError(storageError);
      }
      
      console.log(`📊 BG Sync: Completed. Success: ${successfulSyncs.length}, Failed: ${failedSyncs.length}`);

      // If there are failed syncs and we're online, schedule retry
      if (failedSyncs.length > 0 && navigator.onLine) {
        console.log(`⏰ BG Sync: Scheduling retry in ${RETRY_DELAY / 1000} seconds`);
        setTimeout(() => processSyncQueue(), RETRY_DELAY);
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  // Get queue from storage with error handling
  const getQueueFromStorage = useCallback((): SyncData[] => {
    try {
      const stored = localStorage.getItem(SYNC_STORAGE_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('❌ BG Sync: Failed to read queue:', error);
      handleStorageError(error);
      return [];
    }
  }, []);

  // Handle storage errors (QuotaExceededError, etc.)
  const handleStorageError = (error: any) => {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('⚠️ BG Sync: localStorage quota exceeded, clearing old data');
      try {
        localStorage.removeItem(SYNC_STORAGE_KEY);
      } catch (e) {
        console.error('❌ BG Sync: Failed to clear localStorage:', e);
      }
    } else if (error instanceof SyntaxError) {
      console.warn('⚠️ BG Sync: Corrupted localStorage data, clearing');
      try {
        localStorage.removeItem(SYNC_STORAGE_KEY);
      } catch (e) {
        console.error('❌ BG Sync: Failed to clear localStorage:', e);
      }
    }
  };

  // Event handlers
  const handleOnline = useCallback(() => {
    console.log('🌐 BG Sync: Network restored, processing queue');
    processSyncQueue();
  }, [processSyncQueue]);

  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      console.log('👁️ BG Sync: App became visible, checking queue');
      processSyncQueue();
    }
  }, [processSyncQueue]);

  // Setup event listeners and periodic checks
  useEffect(() => {
    // Service Worker message listener
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'BACKGROUND_SYNC') {
        console.log('📱 BG Sync: SW requested sync processing');
        processSyncQueue();
      }
    };
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }

    // Online event listener
    window.addEventListener('online', handleOnline);
    
    // Visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic queue check
    periodicCheckRef.current = setInterval(() => {
      const queueLength = getQueueFromStorage().length;
      if (queueLength > 0 && navigator.onLine) {
        console.log(`⏰ BG Sync: Periodic check found ${queueLength} items`);
        processSyncQueue();
      }
    }, PERIODIC_CHECK_INTERVAL);

    // Check Background Sync API support
    const hasBgSyncSupport = 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;
    console.log(`📱 BG Sync: Background Sync API ${hasBgSyncSupport ? 'supported ✅' : 'not supported ❌'}`);

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (periodicCheckRef.current) {
        clearInterval(periodicCheckRef.current);
      }
    };
  }, [processSyncQueue, handleOnline, handleVisibilityChange, getQueueFromStorage]);

  // Add data to sync queue with callback support
  const queueForSync = useCallback(async (type: string, data: any, callback?: SyncCallback): Promise<string> => {
    const syncId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const syncData: SyncData = {
      id: syncId,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };

    try {
      // Store callback if provided
      if (callback) {
        callbacksRef.current.set(syncId, callback);
      }

      // Store in localStorage with error handling
      const existingQueue = getQueueFromStorage();
      const updatedQueue = [...existingQueue, syncData];
      
      try {
        localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(updatedQueue));
      } catch (storageError) {
        console.error('❌ BG Sync: Failed to save to localStorage:', storageError);
        handleStorageError(storageError);
        throw storageError;
      }
      
      console.log(`📝 BG Sync: Queued ${type} with ID: ${syncId}`);

      // Register background sync if available
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        const syncManager = (registration as any).sync;
        if (syncManager) {
          await syncManager.register(`sync-${type}`);
          console.log('✅ BG Sync: Registered sync with Service Worker');
        }
      }

      // Always attempt immediate sync if online (fallback + immediate delivery)
      if (navigator.onLine) {
        console.log('🚀 BG Sync: Attempting immediate sync (online)');
        setTimeout(() => processSyncQueue(), 2000); // Small delay to ensure storage is written
      }
      
      return syncId;
    } catch (error) {
      console.error('❌ BG Sync: Failed to queue for sync:', error);
      
      // Remove callback on failure
      if (callback) {
        callbacksRef.current.delete(syncId);
      }
      
      throw error;
    }
  }, [processSyncQueue, getQueueFromStorage]);

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
        case 'product-repost':
          return await syncProductRepost(item.data);
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

  // Sync product repost
  const syncProductRepost = useCallback(async (repostData: { productId: string; priceChanged?: boolean; newPrice?: number; oldPrice?: number; requestId?: string }): Promise<boolean> => {
    try {
      console.log('📱 BG Sync: Sending product repost for', repostData.productId, repostData.priceChanged ? `with price change: ${repostData.oldPrice} -> ${repostData.newPrice}` : '', `requestId: ${repostData.requestId}`);
      
      const { error } = await supabase.functions.invoke('send-telegram-notification', {
        body: { 
          productId: repostData.productId,
          notificationType: 'repost',
          priceChanged: repostData.priceChanged,
          newPrice: repostData.newPrice,
          oldPrice: repostData.oldPrice,
          requestId: repostData.requestId
        }
      });
      
      if (error) {
        console.error('📱 BG Sync: Product repost failed:', error);
        return false;
      }
      
      console.log('📱 BG Sync: Product repost sent successfully');
      return true;
    } catch (error) {
      console.error('📱 BG Sync: Failed to sync product repost:', error);
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

  // Register callback for sync completion
  const registerCallback = useCallback((syncId: string, callback: SyncCallback) => {
    callbacksRef.current.set(syncId, callback);
  }, []);

  return {
    queueForSync,
    processSyncQueue,
    getPendingCount,
    clearQueue,
    getQueue: getQueueFromStorage,
    registerCallback
  };
};