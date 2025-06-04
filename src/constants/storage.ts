
// Константы для названий Supabase Storage buckets
export const STORAGE_BUCKETS = {
  PRODUCT_IMAGES: 'product-images',
  ORDER_IMAGES: 'order-images',
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];
