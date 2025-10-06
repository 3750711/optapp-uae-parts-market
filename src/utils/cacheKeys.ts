
// Cache key constants for consistent React Query cache management
export const CACHE_KEYS = {
  BUYER_AUCTION_PRODUCTS: 'buyer-auction-products',
  BUYER_OFFER_COUNTS: 'buyer-offer-counts',
  BATCH_OFFERS: 'batch-offers',
  PRODUCT_OFFERS: 'product-offers',
  ADMIN_PRODUCTS: 'admin-products',
  PRODUCTS_INFINITE: 'products-infinite',
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

// Централизованные фабрики ключей кеша для админ-продуктов
export const adminProductsKeys = {
  all: ['admin-products'] as const,
  
  // Обычные товары
  normal: (params: {
    debouncedSearchTerm?: string;
    statusFilter?: string;
    sellerFilter?: string;
    pageSize?: number;
  }) => [...adminProductsKeys.all, 'normal', params] as const,
  
  // Товары с проблемами
  withIssues: (params: {
    debouncedSearchTerm?: string;
    statusFilter?: string;
    sellerFilter?: string;
    pageSize?: number;
  }) => [...adminProductsKeys.all, 'with-issues', params] as const,
  
  // Роутер (использует один из двух выше)
  list: (params: {
    debouncedSearchTerm?: string;
    statusFilter?: string;
    sellerFilter?: string;
    notificationIssuesFilter?: boolean;
    pageSize?: number;
  }) => params.notificationIssuesFilter 
    ? adminProductsKeys.withIssues(params)
    : adminProductsKeys.normal(params),
  
  byId: (id: string) => [...adminProductsKeys.all, 'by-id', id] as const,
} as const;

// Фабрики ключей для других сущностей
export const productsKeys = {
  all: ['products'] as const,
  infinite: (params: any) => [...productsKeys.all, 'infinite', params] as const,
  byId: (id: string) => [...productsKeys.all, 'by-id', id] as const,
} as const;
