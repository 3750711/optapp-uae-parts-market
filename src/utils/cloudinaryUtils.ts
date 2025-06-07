
// Cloudinary configuration and utilities
const CLOUDINARY_CLOUD_NAME = 'dcuziurrb';

export interface CloudinaryTransformation {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'auto';
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

// Predefined transformations for different use cases
export const getProductImageUrl = (publicId: string, size: 'thumbnail' | 'card' | 'detail' | 'compressed' = 'card'): string => {
  const transformations: Record<string, CloudinaryTransformation> = {
    // ~50KB thumbnail
    thumbnail: {
      width: 150,
      height: 150,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto:low',
      format: 'auto',
      dpr: 'auto'
    },
    // ~200KB card
    card: {
      width: 400,
      height: 300,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto:low',
      format: 'auto',
      dpr: 'auto'
    },
    // ~400KB detail
    detail: {
      width: 800,
      height: 600,
      crop: 'fit',
      gravity: 'auto',
      quality: 'auto:low',
      format: 'auto',
      dpr: 'auto'
    },
    // ~400KB compressed (main storage format)
    compressed: {
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto:low',
      format: 'auto'
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
      crop: 'fit',
      gravity: 'auto',
      quality: 'auto:low',
      format: 'auto',
      dpr: 'auto'
    }),
    tablet: buildCloudinaryUrl(publicId, {
      width: 600,
      height: 450,
      crop: 'fit',
      gravity: 'auto',
      quality: 'auto:low',
      format: 'auto',
      dpr: 'auto'
    }),
    desktop: buildCloudinaryUrl(publicId, {
      width: 800,
      height: 600,
      crop: 'fit',
      gravity: 'auto',
      quality: 'auto:low',
      format: 'auto',
      dpr: 'auto'
    })
  };
};

// Generate compressed main image URL (~400KB)
export const getCompressedImageUrl = (publicId: string): string => {
  return buildCloudinaryUrl(publicId, {
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto:low',
    format: 'auto'
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
    const urlParts = cloudinaryUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) return null;
    
    // Skip transformation part if exists
    let publicIdIndex = uploadIndex + 1;
    if (urlParts[publicIdIndex]?.includes('_') || urlParts[publicIdIndex]?.includes(',')) {
      publicIdIndex++;
    }
    
    const publicIdWithExtension = urlParts.slice(publicIdIndex).join('/');
    
    // Remove version prefix (v{timestamp}/) if present
    const publicIdCleaned = publicIdWithExtension.replace(/^v\d+\//, '');
    
    // Remove file extension
    const publicIdFinal = publicIdCleaned.replace(/\.[^/.]+$/, '');
    
    console.log('extractPublicIdFromUrl:', {
      originalUrl: cloudinaryUrl,
      publicIdWithExtension,
      publicIdCleaned,
      publicIdFinal
    });
    
    return publicIdFinal;
  } catch (error) {
    console.error('Error extracting public_id from URL:', error);
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
  
  // Should contain valid characters (letters, numbers, underscores, hyphens)
  const validFormat = /^[a-zA-Z0-9_-]+$/.test(publicId.replace(/\//g, '_'));
  
  if (!validFormat) {
    console.warn('Invalid public_id format:', publicId);
  }
  
  return validFormat;
};
