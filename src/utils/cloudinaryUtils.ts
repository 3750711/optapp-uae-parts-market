
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
  
  // Add transformations
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

// Predefined transformations for different use cases (all optimized for file size)
export const getProductImageUrl = (publicId: string, size: 'thumbnail' | 'card' | 'detail' | 'preview' | 'compressed' = 'card'): string => {
  const transformations: Record<string, CloudinaryTransformation> = {
    // ~20KB preview
    preview: {
      width: 200,
      height: 150,
      crop: 'fill',
      gravity: 'auto',
      quality: 60,
      format: 'webp'
    },
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
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto:low',
      format: 'auto',
      dpr: 'auto'
    }),
    tablet: buildCloudinaryUrl(publicId, {
      width: 600,
      height: 450,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto:low',
      format: 'auto',
      dpr: 'auto'
    }),
    desktop: buildCloudinaryUrl(publicId, {
      width: 800,
      height: 600,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto:low',
      format: 'auto',
      dpr: 'auto'
    })
  };
};

// Generate preview URL (small, optimized for fast loading - 20KB)
export const getPreviewImageUrl = (publicId: string): string => {
  return buildCloudinaryUrl(publicId, {
    width: 200,
    height: 150,
    crop: 'fill',
    gravity: 'auto',
    quality: 60,
    format: 'webp'
  });
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
    preview: getPreviewImageUrl(publicId),
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
    return publicIdWithExtension.replace(/\.[^/.]+$/, ''); // Remove file extension
  } catch {
    return null;
  }
};
