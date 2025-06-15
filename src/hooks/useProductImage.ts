
import { useMemo } from 'react';
import { Product } from '@/types/product';

export const useProductImage = (product: Product | undefined | null) => {
  return useMemo(() => {
    if (!product) {
      return {
        primaryImage: '/placeholder.svg',
        cloudinaryUrl: null,
      };
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🖼️ useProductImage processing for product:', product.id, {
        product_images: product.product_images,
        cloudinary_url: product.cloudinary_url,
        cloudinary_public_id: product.cloudinary_public_id,
        product_image: (product as any).image,
      });
    }

    const primaryImg = product.product_images?.find(img => img.is_primary);
    const fallbackImg = product.product_images?.[0];
    
    const imageUrl = primaryImg?.url || 
                    fallbackImg?.url || 
                    product.cloudinary_url ||
                    (product as any).image ||
                    '/placeholder.svg';

    const extractedCloudinaryUrl = primaryImg?.url || 
                                  fallbackImg?.url || 
                                  product.cloudinary_url || 
                                  ((product as any).image && (product as any).image.includes('cloudinary.com') ? (product as any).image : null) ||
                                  null;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ useProductImage final selection:', {
        finalImageUrl: imageUrl,
        extractedCloudinaryUrl,
      });
    }

    return {
      primaryImage: imageUrl,
      cloudinaryUrl: extractedCloudinaryUrl
    };
  }, [product]);
};
