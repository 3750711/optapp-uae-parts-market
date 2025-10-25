import { useMemo } from 'react';
import { 
  generateSrcSet, 
  generateCloudinaryUrl, 
  isCloudinaryUrl,
  RESPONSIVE_PRESETS 
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
  
  // Responsive srcSet for each context
  srcSets: {
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
type ProductImageInput = ProductImage | string;

interface ProductLike {
  product_images?: ProductImageInput[];
  cloudinary_url?: string;
  image?: string; // Legacy field
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
    // Early return for null/undefined
    if (!product) {
      return {
        images: [],
        primaryImage: null,
        isEmpty: true,
        count: 0,
      };
    }

    // Extract and normalize image URLs
    const extractedImages: ProductImage[] = [];

    // 1. Process product_images array (main source)
    if (product.product_images && Array.isArray(product.product_images)) {
      product.product_images.forEach((img) => {
        if (typeof img === 'string') {
          extractedImages.push({ url: img });
        } else if (img && typeof img === 'object' && img.url) {
          extractedImages.push(img);
        }
      });
    }

    // 2. Fallback to legacy cloudinary_url
    if (extractedImages.length === 0 && product.cloudinary_url) {
      extractedImages.push({ 
        url: product.cloudinary_url,
        is_primary: true 
      });
    }

    // 3. Fallback to very old image field
    if (extractedImages.length === 0 && product.image) {
      extractedImages.push({ 
        url: product.image,
        is_primary: true 
      });
    }

    // 4. Final fallback to placeholder
    if (extractedImages.length === 0) {
      return {
        images: [],
        primaryImage: null,
        isEmpty: true,
        count: 0,
      };
    }

    // Smart sorting: is_primary first, then by created_at (oldest first)
    const sortedImages = [...extractedImages].sort((a, b) => {
      // Priority 1: Primary image always first
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;

      // Priority 2: Sort by created_at (oldest first = first uploaded)
      if (a.created_at && b.created_at) {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      // Fallback: keep original order
      return 0;
    });

    // Limit to maxImages
    const limitedImages = sortedImages.slice(0, maxImages);

    // Generate optimized variants if requested
    if (!generateVariants) {
      // Simple mode: just return URLs
      return {
        images: limitedImages.map(img => img.url),
        primaryImage: limitedImages[0]?.url || null,
        isEmpty: limitedImages.length === 0,
        count: limitedImages.length,
      };
    }

    // Full mode: generate all variants
    const optimizedVariants: OptimizedImageVariant[] = limitedImages.map((img, index) => {
      const url = img.url;
      const isCloudinary = isCloudinaryUrl(url);
      const imgId = img.id || `img-${index}`;

      return {
        id: imgId,
        original: url,

        // Generate different sizes (only for Cloudinary images)
        thumbnail: isCloudinary 
          ? generateCloudinaryUrl(url, { width: 200, height: 200, crop: 'fit' })
          : url,
        card: isCloudinary
          ? generateCloudinaryUrl(url, { width: 600, height: 450, crop: 'fit' })
          : url,
        detail: isCloudinary
          ? generateCloudinaryUrl(url, { width: 1200, quality: 'auto:best', crop: 'limit' })
          : url,
        zoom: isCloudinary
          ? generateCloudinaryUrl(url, { width: 2400, quality: 'auto:best', crop: 'limit' })
          : url,

        // Blur placeholder for instant display
        blurDataUrl: isCloudinary
          ? generateCloudinaryUrl(url, { 
              width: 30, 
              height: 30, 
              quality: 'auto:low',
              crop: 'fill'
            }) + ',e_blur:1000'
          : url,

        // Responsive srcSets
        srcSets: {
          thumbnail: isCloudinary 
            ? generateSrcSet(url, RESPONSIVE_PRESETS.thumbnail.widths)
            : '',
          card: isCloudinary
            ? generateSrcSet(url, RESPONSIVE_PRESETS.card.widths)
            : '',
          gallery: isCloudinary
            ? generateSrcSet(url, RESPONSIVE_PRESETS.gallery.widths)
            : '',
          fullscreen: isCloudinary
            ? generateSrcSet(url, RESPONSIVE_PRESETS.fullscreen.widths)
            : '',
        },

        // Metadata
        isPrimary: img.is_primary || index === 0,
        priority: index === 0, // First image should load eagerly
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
