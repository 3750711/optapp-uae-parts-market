
// Cache key constants for consistent React Query cache management
export const CACHE_KEYS = {
  BUYER_AUCTION_PRODUCTS: 'buyer-auction-products',
  BUYER_OFFER_COUNTS: 'buyer-offer-counts',
  BATCH_OFFERS: 'batch-offers',
  PRODUCT_OFFERS: 'product-offers',
} as const;

export const CACHE_FILTERS = {
  ALL: 'all',
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const;

export const createCacheKey = (key: string, ...params: (string | undefined)[]) => {
  return [key, ...params.filter(Boolean)];
};
