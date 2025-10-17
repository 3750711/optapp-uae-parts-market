
import { useMemo } from 'react';
import { Product } from '@/types/product';

export const useProductImage = (product: Product | undefined | null) => {
  return useMemo(() => {
    if (!product) {
      return {
        primaryImage: '/placeholder.svg',
        cloudinaryUrl: null,
        fallbackChain: ['/placeholder.svg'],
      };
    }

    try {
      // Умная сортировка:
      // 1. is_primary: true — в начало
      // 2. Если нет primary → сортировать по created_at (первое загруженное)
      // 3. Если нет created_at → оставить текущий порядок
      const sortedImages = [...(product.product_images || [])].sort((a, b) => {
        // Приоритет 1: Основное фото всегда первое
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        
        // Приоритет 2: Если оба не primary — сортировать по created_at (ASC)
        if (a.created_at && b.created_at) {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        
        // Fallback: Если нет created_at — не менять порядок
        return 0;
      });

      const primaryImg = sortedImages.find(img => img.is_primary);
      const fallbackImg = sortedImages[0];
      
      // Create a fallback chain for better error handling
      const fallbackChain = [
        primaryImg?.url,
        fallbackImg?.url,
        product.cloudinary_url,
        (product as any).image,
        `/api/placeholder?text=${encodeURIComponent(product.title || 'Product')}`,
        '/placeholder.svg'
      ].filter(Boolean);

      const imageUrl = fallbackChain[0] || '/placeholder.svg';

      const extractedCloudinaryUrl = primaryImg?.url || 
                                    fallbackImg?.url || 
                                    product.cloudinary_url || 
                                    ((product as any).image && (product as any).image.includes('cloudinary.com') ? (product as any).image : null) ||
                                    null;

      return {
        primaryImage: imageUrl,
        cloudinaryUrl: extractedCloudinaryUrl,
        fallbackChain,
      };
    } catch (error) {
      return {
        primaryImage: '/placeholder.svg',
        cloudinaryUrl: null,
        fallbackChain: ['/placeholder.svg'],
      };
    }
  }, [product]);
};
