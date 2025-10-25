import { useMemo } from 'react';
import { 
  generateSrcSet, 
  generateCloudinaryUrl, 
  isCloudinaryUrl,
  RESPONSIVE_PRESETS,
  generatePictureSources,
  generateBlurPlaceholder
} from '@/utils/cloudinaryResponsive';

/**
 * Product image types from database
 */
export interface ProductImage {
  id?: string;
  url: string;
  is_primary?: boolean;
  product_id?: string;
  created_at?: string;
}

/**
 * Optimized image variant with all necessary URLs and metadata
 */
export interface OptimizedImageVariant {
  id: string;
  original: string;
  
  // Different sizes for different contexts
  thumbnail: string;
  card: string;
  detail: string;
  zoom: string;
  
  // Blur placeholder for instant display
  blurDataUrl: string;
  
  // Responsive srcSet for each context (JPEG fallback)
  srcSets: {
    thumbnail: string;
    card: string;
    gallery: string;
    fullscreen: string;
  };
  
  // AVIF srcSets (best compression)
  avifSrcSets?: {
    thumbnail?: string;
    card?: string;
    gallery?: string;
    fullscreen?: string;
  };
  
  // WebP srcSets (good compression)
  webpSrcSets?: {
    thumbnail?: string;
    card?: string;
    gallery?: string;
    fullscreen?: string;
  };
  
  // Sizes attributes for responsive images
  sizes: {
    thumbnail: string;
    card: string;
    gallery: string;
    fullscreen: string;
  };
  
  // Metadata
  isPrimary: boolean;
  priority: boolean; // Should be loaded eagerly (first image)
}

/**
 * Input types - can be from different sources
 */
export type ProductImageInput = ProductImage | string;

/**
 * Product-like interface that components might pass
 */
export interface ProductLike {
  id?: string;
  product_images?: ProductImageInput[];
  cloudinary_url?: string;
  image?: string;
  [key: string]: any;
}

/**
 * Hook options
 */
interface UseOptimizedProductImagesOptions {
  maxImages?: number;
  generateVariants?: boolean; // Set to false if you only need URLs
}

/**
 * Return type when generateVariants is true
 */
interface UseOptimizedProductImagesResultFull {
  images: OptimizedImageVariant[];
  primaryImage: OptimizedImageVariant | null;
  isEmpty: boolean;
  count: number;
}

/**
 * Return type when generateVariants is false
 */
interface UseOptimizedProductImagesResultSimple {
  images: string[];
  primaryImage: string | null;
  isEmpty: boolean;
  count: number;
}

/**
 * UNIFIED HOOK FOR PRODUCT IMAGE OPTIMIZATION - Function Overloads
 */
export function useOptimizedProductImages(
  product: ProductLike | null | undefined,
  options: UseOptimizedProductImagesOptions & { generateVariants: false }
): UseOptimizedProductImagesResultSimple;

export function useOptimizedProductImages(
  product: ProductLike | null | undefined,
  options?: UseOptimizedProductImagesOptions & { generateVariants?: true }
): UseOptimizedProductImagesResultFull;

/**
 * UNIFIED HOOK FOR PRODUCT IMAGE OPTIMIZATION
 * 
 * Replaces:
 * - useProductImages
 * - useProductImage
 * - Individual optimization logic in components
 * 
 * Features:
 * - Smart sorting (is_primary → created_at)
 * - Cloudinary optimization for all variants
 * - Responsive srcSet generation
 * - Blur-up placeholder URLs
 * - Fallback chain handling
 */
export function useOptimizedProductImages(
  product: ProductLike | null | undefined,
  options: UseOptimizedProductImagesOptions = {}
): UseOptimizedProductImagesResultFull | UseOptimizedProductImagesResultSimple {
  const { maxImages = 50, generateVariants = true } = options;

  return useMemo(() => {
    if (!product) {
      return generateVariants 
        ? { images: [], primaryImage: null, isEmpty: true, count: 0 }
        : { images: [], primaryImage: null, isEmpty: true, count: 0 };
    }

    // Extract and normalize image URLs from various fields
    const rawImages: ProductImage[] = [];
    
    // 1. Приоритет: product_images (основной источник с метаданными)
    if (product.product_images && Array.isArray(product.product_images)) {
      product.product_images.forEach(img => {
        if (typeof img === 'string') {
          rawImages.push({ url: img });
        } else {
          rawImages.push(img);
        }
      });
    }
    
    // 2. Fallback: cloudinary_url (legacy)
    if (!rawImages.length && product.cloudinary_url) {
      rawImages.push({
        url: product.cloudinary_url,
        is_primary: true
      });
    }
    
    // 3. Fallback: direct image field (legacy)
    if (!rawImages.length && (product as any).image) {
      rawImages.push({
        url: (product as any).image,
        is_primary: true
      });
    }

    // Умная сортировка:
    // 1. is_primary: true — в начало
    // 2. Если нет primary → сортировать по created_at (первое загруженное)
    const sortedImages = [...rawImages].sort((a, b) => {
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

    // Limit to maxImages
    const limitedImages = sortedImages.slice(0, maxImages);
    
    // Extract URLs
    const imageUrls = limitedImages
      .map(img => img.url)
      .filter(Boolean);
    
    // Fallback to placeholder
    const finalUrls = imageUrls.length > 0 
      ? imageUrls 
      : ['/placeholder.svg'];

    // Simple mode: return just URLs
    if (!generateVariants) {
      return {
        images: finalUrls,
        primaryImage: finalUrls[0] || null,
        isEmpty: finalUrls.length === 0,
        count: finalUrls.length,
      };
    }

    // Full mode: generate optimized variants with AVIF/WebP support
    const optimizedVariants: OptimizedImageVariant[] = finalUrls.map((url, index) => {
      const isPrimary = index === 0;
      const isCloudinary = url.includes('cloudinary.com');
      
      // Generate picture sources with AVIF/WebP/JPEG
      const thumbnailSources = isCloudinary 
        ? generatePictureSources(url, 'thumbnail')
        : { jpegSrcSet: url, sizes: RESPONSIVE_PRESETS.thumbnail.sizes };
        
      const cardSources = isCloudinary
        ? generatePictureSources(url, 'card')
        : { jpegSrcSet: url, sizes: RESPONSIVE_PRESETS.card.sizes };
        
      const gallerySources = isCloudinary
        ? generatePictureSources(url, 'gallery')
        : { jpegSrcSet: url, sizes: RESPONSIVE_PRESETS.gallery.sizes };
        
      const fullscreenSources = isCloudinary
        ? generatePictureSources(url, 'fullscreen')
        : { jpegSrcSet: url, sizes: RESPONSIVE_PRESETS.fullscreen.sizes };
      
      // Generate individual size URLs
      const thumbnail = isCloudinary 
        ? generateCloudinaryUrl(url, { width: 200, quality: 'auto:good', format: 'auto' })
        : url;
      
      const card = isCloudinary
        ? generateCloudinaryUrl(url, { width: 600, quality: 'auto:good', format: 'auto' })
        : url;
        
      const detail = isCloudinary
        ? generateCloudinaryUrl(url, { width: 1200, quality: 'auto:best', format: 'auto' })
        : url;
        
      const zoom = isCloudinary
        ? generateCloudinaryUrl(url, { width: 2400, quality: 'auto:best', format: 'auto' })
        : url;

      return {
        id: `${product.id || 'unknown'}-${index}`,
        original: url,
        thumbnail,
        card,
        detail,
        zoom,
        blurDataUrl: isCloudinary ? generateBlurPlaceholder(url) : url,
        srcSets: {
          thumbnail: thumbnailSources.jpegSrcSet,
          card: cardSources.jpegSrcSet,
          gallery: gallerySources.jpegSrcSet,
          fullscreen: fullscreenSources.jpegSrcSet,
        },
        // Store AVIF/WebP sources for <picture> element
        avifSrcSets: isCloudinary ? {
          thumbnail: thumbnailSources.avifSrcSet,
          card: cardSources.avifSrcSet,
          gallery: gallerySources.avifSrcSet,
          fullscreen: fullscreenSources.avifSrcSet,
        } : undefined,
        webpSrcSets: isCloudinary ? {
          thumbnail: thumbnailSources.webpSrcSet,
          card: cardSources.webpSrcSet,
          gallery: gallerySources.webpSrcSet,
          fullscreen: fullscreenSources.webpSrcSet,
        } : undefined,
        sizes: {
          thumbnail: thumbnailSources.sizes,
          card: cardSources.sizes,
          gallery: gallerySources.sizes,
          fullscreen: fullscreenSources.sizes,
        },
        isPrimary,
        priority: isPrimary, // First image should be loaded eagerly
      };
    });

    return {
      images: optimizedVariants,
      primaryImage: optimizedVariants[0] || null,
      isEmpty: optimizedVariants.length === 0,
      count: optimizedVariants.length,
    };
  }, [product, maxImages, generateVariants]);
};

/**
 * Simplified version for components that only need URLs
 */
export const useProductImageUrls = (product: ProductLike | null | undefined) => {
  return useOptimizedProductImages(product, { generateVariants: false });
};
