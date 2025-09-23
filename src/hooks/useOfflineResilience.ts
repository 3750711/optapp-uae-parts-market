import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface QueuedAction {
  id: string;
  type: 'CREATE_PRODUCT' | 'UPDATE_PRODUCT' | 'DELETE_PRODUCT';
  data: any;
  timestamp: number;
  retries: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds
const STORAGE_KEY = 'pb_offline_queue';

/**
 * Offline resilience with action queuing and auto-sync
 */
export function useOfflineResilience() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedActions, setQueuedActions] = useState<QueuedAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  // Load queued actions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setQueuedActions(parsed.filter((action: QueuedAction) => 
          // Remove actions older than 24 hours
          Date.now() - action.timestamp < 24 * 60 * 60 * 1000
        ));
      }
    } catch (error) {
      console.warn('[OfflineResilience] Failed to load queued actions:', error);
    }
  }, []);

  // Save queued actions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queuedActions));
    } catch (error) {
      console.warn('[OfflineResilience] Failed to save queued actions:', error);
    }
  }, [queuedActions]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger sync when coming back online
      if (queuedActions.length > 0) {
        scheduleSync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Cancel any pending sync
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [queuedActions.length]);

  // Queue action for offline processing
  const queueAction = useCallback((
    type: QueuedAction['type'],
    data: any
  ): string => {
    const action: QueuedAction = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0
    };

    setQueuedActions(prev => [...prev, action]);
    
    // If online, try to sync immediately
    if (isOnline) {
      scheduleSync();
    }

    return action.id;
  }, [isOnline]);

  // Schedule sync with exponential backoff
  const scheduleSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      syncQueuedActions();
    }, RETRY_DELAY);
  }, []);

  // Sync queued actions
  const syncQueuedActions = useCallback(async () => {
    if (!isOnline || queuedActions.length === 0 || isSyncing) {
      return;
    }

    setIsSyncing(true);

    try {
      const actionsToProcess = [...queuedActions];
      const successfulIds: string[] = [];
      const failedActions: QueuedAction[] = [];

      for (const action of actionsToProcess) {
        try {
          await processAction(action);
          successfulIds.push(action.id);
          
          // Optimistically update cache
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['seller-products'] });
          
        } catch (error) {
          console.warn('[OfflineResilience] Action failed:', action.id, error);
          
          if (action.retries < MAX_RETRIES) {
            failedActions.push({
              ...action,
              retries: action.retries + 1
            });
          } else {
            console.error('[OfflineResilience] Action exceeded max retries:', action.id);
          }
        }
      }

      // Update queue: remove successful actions, keep failed ones for retry
      setQueuedActions(failedActions);

      // Schedule retry if there are failed actions
      if (failedActions.length > 0 && isOnline) {
        scheduleSync();
      }

    } catch (error) {
      console.error('[OfflineResilience] Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, queuedActions, isSyncing, queryClient]);

  // Process individual action
  const processAction = async (action: QueuedAction) => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    switch (action.type) {
      case 'CREATE_PRODUCT':
        const { data: productData, error: createError } = await supabase
          .rpc('create_standard_product', action.data);
        
        if (createError) throw createError;
        
        // Upload images if they exist
        if (action.data.imageUrls?.length > 0) {
          // Handle image uploads
          console.log('[OfflineResilience] Product created, handling images...');
        }
        
        return productData;

      case 'UPDATE_PRODUCT':
        const { data: updateData, error: updateError } = await supabase
          .from('products')
          .update(action.data.updates)
          .eq('id', action.data.productId);
        
        if (updateError) throw updateError;
        return updateData;

      case 'DELETE_PRODUCT':
        const { data: deleteData, error: deleteError } = await supabase
          .from('products')
          .delete()
          .eq('id', action.data.productId);
        
        if (deleteError) throw deleteError;
        return deleteData;

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  };

  // Auto-save form data locally
  const saveFormData = useCallback((formData: any, key: string = 'draft') => {
    try {
      const draftKey = `pb_form_draft_${key}`;
      localStorage.setItem(draftKey, JSON.stringify({
        data: formData,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('[OfflineResilience] Failed to save form draft:', error);
    }
  }, []);

  // Load form data from local storage
  const loadFormData = useCallback((key: string = 'draft'): any => {
    try {
      const draftKey = `pb_form_draft_${key}`;
      const stored = localStorage.getItem(draftKey);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        // Return data if it's less than 24 hours old
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed.data;
        } else {
          // Clean up old draft
          localStorage.removeItem(draftKey);
        }
      }
    } catch (error) {
      console.warn('[OfflineResilience] Failed to load form draft:', error);
    }
    
    return null;
  }, []);

  return {
    isOnline,
    queuedActions: queuedActions.length,
    isSyncing,
    
    // Queue management
    queueAction,
    syncQueuedActions,
    
    // Form persistence
    saveFormData,
    loadFormData,
    
    // Status indicators
    hasQueuedActions: queuedActions.length > 0,
    isProcessingQueue: isSyncing,
  };
}
