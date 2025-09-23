import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthSession } from '@/contexts/auth/AuthSessionContext';
import { logger } from '@/utils/productionLogger';

interface IdempotencyCache {
  [key: string]: {
    timestamp: number;
    promise: Promise<any>;
  };
}

const idempotencyCache: IdempotencyCache = {};
const CACHE_DURATION = 5000; // 5 seconds

/**
 * Optimized product creation hook with idempotency protection
 */
export function useOptimizedProductCreation() {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuthSession();
  const queryClient = useQueryClient();

  const createProductWithIdempotency = useCallback(async (
    productData: any,
    createFn: () => Promise<any>
  ) => {
    // Create idempotency key based on user and product data
    const idempotencyKey = `${user?.id}_${JSON.stringify(productData).slice(0, 100)}`;
    const now = Date.now();

    // Check if we have a recent request with the same data
    const cached = idempotencyCache[idempotencyKey];
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      logger.log('🔄 Using idempotent cached result');
      return cached.promise;
    }

    // Create new request with AbortController
    const controller = new AbortController();
    
    const createPromise = (async () => {
      setIsCreating(true);
      
      try {
        const result = await createFn();
        
        // Optimistically update cache
        if (result?.id) {
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['seller-products', user?.id] });
        }
        
        return result;
      } finally {
        setIsCreating(false);
        // Clear cache entry after completion
        delete idempotencyCache[idempotencyKey];
      }
    })();

    // Cache the promise
    idempotencyCache[idempotencyKey] = {
      timestamp: now,
      promise: createPromise
    };

    return createPromise;
  }, [user?.id, queryClient]);

  // Cleanup old cache entries
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    Object.keys(idempotencyCache).forEach(key => {
      if (now - idempotencyCache[key].timestamp > CACHE_DURATION) {
        delete idempotencyCache[key];
      }
    });
  }, []);

  return {
    createProductWithIdempotency,
    isCreating,
    cleanupCache
  };
}