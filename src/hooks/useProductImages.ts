import { useMemo } from 'react';
import { ProductProps } from '@/components/product/ProductCard';

export interface ProductImage {
  id?: string;
  url: string;
  is_primary?: boolean;
  product_id?: string;
  created_at?: string;
}

interface ProductImageWithMeta extends ProductImage {
  created_at?: string;
}

export const useProductImages = (product: ProductProps) => {
  return useMemo(() => {
    const images: string[] = [];
    
    // Сортируем изображения: primary первым, затем по created_at
    const sortedImages = [...(product.product_images || [])].sort((a: any, b: any) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      
      if (a.created_at && b.created_at) {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      
      return 0;
    });
    
    // Добавляем отсортированные изображения
    sortedImages.forEach((img) => {
      if (img?.url) images.push(img.url);
    });
    
    // Fallback на cloudinary_url
    if (images.length === 0 && product.cloudinary_url) {
      images.push(product.cloudinary_url);
    }
    
    // Fallback на placeholder
    if (images.length === 0) {
      images.push('/placeholder.svg');
    }
    
    return images;
  }, [product.product_images, product.cloudinary_url]);
};
