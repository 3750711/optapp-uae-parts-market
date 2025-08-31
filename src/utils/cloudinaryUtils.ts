// Cloudinary configuration and utilities
const CLOUDINARY_CLOUD_NAME = 'dcuziurrb';

export interface CloudinaryTransformation {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'auto' | 'limit';
  gravity?: 'auto' | 'center' | 'face' | 'faces';
  quality?: 'auto' | 'auto:low' | 'auto:good' | 'auto:best' | number;
  format?: 'auto' | 'webp' | 'jpg' | 'png' | 'avif';
  dpr?: 'auto' | number;
}

export const buildCloudinaryUrl = (publicId: string, transformations: CloudinaryTransformation = {}): string => {
  if (!publicId) return '';
  
  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  
  const transformParts: string[] = [];
  
  // Add transformations in correct order
  if (transformations.width) transformParts.push(`w_${transformations.width}`);
  if (transformations.height) transformParts.push(`h_${transformations.height}`);
  if (transformations.crop) transformParts.push(`c_${transformations.crop}`);
  if (transformations.gravity) transformParts.push(`g_${transformations.gravity}`);
  if (transformations.quality) transformParts.push(`q_${transformations.quality}`);
  if (transformations.format) transformParts.push(`f_${transformations.format}`);
  if (transformations.dpr) transformParts.push(`dpr_${transformations.dpr}`);
  
  const transformString = transformParts.length > 0 ? transformParts.join(',') + '/' : '';
  
  return `${baseUrl}/${transformString}${publicId}`;
};

// Helper to extract version from Cloudinary URL
export const extractVersionFromUrl = (cloudinaryUrl: string): string | null => {
  try {
    const versionMatch = cloudinaryUrl.match(/\/v(\d+)\//);
    return versionMatch ? versionMatch[1] : null;
  } catch (error) {
    console.error('Error extracting version from URL:', error);
    return null;
  }
};

// All images are now processed as WebP, no need for format detection

// Predefined transformations for different use cases - all images are WebP
export const getProductImageUrl = (publicId: string, size: 'thumbnail' | 'card' | 'detail' | 'compressed' = 'card'): string => {
  const transformations: Record<string, CloudinaryTransformation> = {
    // ~30KB thumbnail for very small previews
    thumbnail: {
      width: 150,
      height: 150,
      crop: 'limit',
      quality: 'auto:low',
      format: 'webp'
    },
    // ~100KB card - optimized for catalog listings
    card: {
      width: 400,
      height: 300,
      crop: 'limit',
      quality: 'auto:low',
      format: 'webp'
    },
    // ~300KB detail for product pages
    detail: {
      width: 800,
      height: 600,
      crop: 'limit',
      quality: 'auto:good',
      format: 'webp'
    },
    // ~200KB compressed (main storage format)
    compressed: {
      width: 600,
      height: 450,
      crop: 'limit',
      quality: 'auto:low',
      format: 'webp'
    }
  };
  
  return buildCloudinaryUrl(publicId, transformations[size]);
};

// Predefined transformations for order images - all images are WebP
export const getOrderImageUrl = (publicId: string, size: 'thumbnail' | 'card' | 'detail' | 'compressed' = 'card'): string => {
  const transformations: Record<string, CloudinaryTransformation> = {
    // ~30KB thumbnail for very small previews
    thumbnail: {
      width: 150,
      height: 150,
      crop: 'limit',
      quality: 'auto:low',
      format: 'webp'
    },
    // ~100KB card - optimized for catalog listings
    card: {
      width: 400,
      height: 300,
      crop: 'limit',
      quality: 'auto:low',
      format: 'webp'
    },
    // ~300KB detail for product pages
    detail: {
      width: 800,
      height: 600,
      crop: 'limit',
      quality: 'auto:good',
      format: 'webp'
    },
    // ~200KB compressed (main storage format)
    compressed: {
      width: 600,
      height: 450,
      crop: 'limit',
      quality: 'auto:low',
      format: 'webp'
    }
  };
  
  return buildCloudinaryUrl(publicId, transformations[size]);
};

// Generate responsive image URLs for different screen sizes
export const getResponsiveImageUrls = (publicId: string) => {
  return {
    mobile: buildCloudinaryUrl(publicId, {
      width: 400,
      height: 300,
      crop: 'limit',
      quality: 'auto:low',
      format: 'webp'
    }),
    tablet: buildCloudinaryUrl(publicId, {
      width: 600,
      height: 450,
      crop: 'limit',
      quality: 'auto:low',
      format: 'webp'
    }),
    desktop: buildCloudinaryUrl(publicId, {
      width: 800,
      height: 600,
      crop: 'limit',
      quality: 'auto:low',
      format: 'webp'
    })
  };
};

// Generate compressed main image URL (~200KB)
export const getCompressedImageUrl = (publicId: string): string => {
  return buildCloudinaryUrl(publicId, {
    width: 600,
    height: 450,
    crop: 'limit',
    quality: 'auto:low',
    format: 'webp'
  });
};

// Batch transformation URLs for multiple sizes
export const getBatchImageUrls = (publicId: string) => {
  return {
    thumbnail: getProductImageUrl(publicId, 'thumbnail'),
    card: getProductImageUrl(publicId, 'card'),
    detail: getProductImageUrl(publicId, 'detail'),
    compressed: getCompressedImageUrl(publicId),
    responsive: getResponsiveImageUrls(publicId)
  };
};

// Helper to extract public_id from Cloudinary URL
export const extractPublicIdFromUrl = (cloudinaryUrl: string): string | null => {
  try {
    if (!cloudinaryUrl || !cloudinaryUrl.includes('cloudinary.com')) {
      return null;
    }
    
    // Remove query parameters if any
    const cleanUrl = cloudinaryUrl.split('?')[0];
    
    // Use regex to extract public_id more reliably
    // Pattern: https://res.cloudinary.com/{cloud}/image/upload/{transformations}/{public_id}
    const cloudinaryPattern = /https?:\/\/res\.cloudinary\.com\/[^\/]+\/(?:image|video|raw)\/upload\/(?:.*?\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/;
    
    const match = cleanUrl.match(cloudinaryPattern);
    if (!match || !match[1]) {
      return null;
    }
    
    let potentialPublicId = match[1];
    
    // Split by '/' to process segments
    const segments = potentialPublicId.split('/');
    
    // Find the first segment that looks like a folder/path (not transformations)
    let publicIdStartIndex = 0;
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      // Check if this segment contains transformation parameters
      const isTransformation = 
        segment.includes(',') ||                    // Multiple transformations like "f_webp,q_auto:good,c_fill,w_1200,h_1200"
        /^[a-z]_/.test(segment) ||                 // Single transformations like "w_400", "f_auto"
        /^v\d+$/.test(segment);                    // Version like "v123456789"
      
      if (isTransformation) {
        publicIdStartIndex = i + 1;
      } else {
        // This looks like the start of the actual path
        break;
      }
    }
    
    if (publicIdStartIndex >= segments.length) {
      return null;
    }
    
    // Join remaining segments to form public_id
    const publicIdFinal = segments.slice(publicIdStartIndex).join('/');
    
    return publicIdFinal;
  } catch (error) {
    console.error('❌ Error extracting public_id from URL:', error);
    return null;
  }
};

// Helper to clean public_id from version prefix
export const cleanPublicId = (publicId: string): string => {
  if (!publicId) return '';
  
  // Remove version prefix (v{timestamp}/) if present
  const cleaned = publicId.replace(/^v\d+\//, '');
  
  console.log('cleanPublicId:', {
    original: publicId,
    cleaned
  });
  
  return cleaned;
};

// Helper to validate public_id format
export const isValidPublicId = (publicId: string): boolean => {
  if (!publicId || typeof publicId !== 'string') return false;
  
  // Valid public_id should not contain version prefix
  if (publicId.startsWith('v') && /^v\d+\//.test(publicId)) {
    console.warn('Invalid public_id with version prefix:', publicId);
    return false;
  }
  
  // Should contain valid characters (letters, numbers, underscores, hyphens, slashes)
  const validFormat = /^[a-zA-Z0-9_/-]+$/.test(publicId);
  
  if (!validFormat) {
    console.warn('Invalid public_id format:', publicId);
  }
  
  return validFormat;
};
