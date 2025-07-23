
import { QueryClient } from '@tanstack/react-query';
import { CACHE_KEYS, CACHE_FILTERS, createCacheKey } from './cacheKeys';
import { debounce } from './debounce';

export class PusherCacheOptimizer {
  private queryClient: QueryClient;
  private pendingUpdates: Map<string, any[]> = new Map();
  private debouncedUpdate: ReturnType<typeof debounce>;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.debouncedUpdate = debounce(this.processBatchUpdates.bind(this), 300);
  }

  // Optimistically update cache for immediate UI feedback
  optimisticUpdate(productId: string, updates: {
    userOfferPrice?: number;
    isUserLeading?: boolean;
    maxOtherOffer?: number;
    offersCount?: number;
  }) {
    const statusFilters = [CACHE_FILTERS.ALL, CACHE_FILTERS.ACTIVE, CACHE_FILTERS.CANCELLED, CACHE_FILTERS.COMPLETED];
    
    statusFilters.forEach(statusFilter => {
      const cacheKey = createCacheKey(CACHE_KEYS.BUYER_AUCTION_PRODUCTS, 'current-user', statusFilter);
      
      this.queryClient.setQueryData(cacheKey, (oldData: any) => {
        if (!oldData) return oldData;
        
        return oldData.map((product: any) => {
          if (product.id === productId) {
            return {
              ...product,
              ...updates,
              // Add timestamp for animation triggers
              lastUpdated: new Date().toISOString()
            };
          }
          return product;
        });
      });
    });
  }

  // Queue update for batch processing
  queueUpdate(productId: string, event: any) {
    const currentEvents = this.pendingUpdates.get(productId) || [];
    currentEvents.push(event);
    this.pendingUpdates.set(productId, currentEvents);
    
    // Trigger debounced batch update
    this.debouncedUpdate();
  }

  // Process batched updates
  private processBatchUpdates() {
    const productIds = Array.from(this.pendingUpdates.keys());
    
    productIds.forEach(productId => {
      const events = this.pendingUpdates.get(productId) || [];
      if (events.length === 0) return;
      
      // Get the latest event (most recent)
      const latestEvent = events[events.length - 1];
      
      // Apply the update
      this.applyEventUpdate(productId, latestEvent);
      
      // Clear processed events
      this.pendingUpdates.delete(productId);
    });
  }

  // Apply a single event update to cache
  private applyEventUpdate(productId: string, event: any) {
    console.log('🔄 Applying cache update for product:', productId, event);
    
    // Update individual product caches
    this.queryClient.invalidateQueries({
      queryKey: ['user-offer', productId],
      refetchType: 'none'
    });
    
    this.queryClient.invalidateQueries({
      queryKey: ['competitive-offers', productId],
      refetchType: 'none'
    });
    
    // Update batch offer caches
    this.queryClient.invalidateQueries({
      queryKey: [CACHE_KEYS.BATCH_OFFERS],
      refetchType: 'none'
    });
  }

  // Force refresh all related caches
  forceRefresh(productId?: string) {
    if (productId) {
      this.queryClient.invalidateQueries({
        queryKey: ['user-offer', productId]
      });
      this.queryClient.invalidateQueries({
        queryKey: ['competitive-offers', productId]
      });
    }
    
    this.queryClient.invalidateQueries({
      queryKey: [CACHE_KEYS.BUYER_AUCTION_PRODUCTS]
    });
    
    this.queryClient.invalidateQueries({
      queryKey: [CACHE_KEYS.BUYER_OFFER_COUNTS]
    });
  }

  // Clear all pending updates
  clearPendingUpdates() {
    this.pendingUpdates.clear();
    this.debouncedUpdate.cancel();
  }
}

// Export singleton instance
let cacheOptimizer: PusherCacheOptimizer | null = null;

export const getPusherCacheOptimizer = (queryClient: QueryClient) => {
  if (!cacheOptimizer) {
    cacheOptimizer = new PusherCacheOptimizer(queryClient);
  }
  return cacheOptimizer;
};
