
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
      const primaryImg = product.product_images?.find(img => img.is_primary);
      const fallbackImg = product.product_images?.[0];
      
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
