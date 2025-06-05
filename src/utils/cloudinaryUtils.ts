
// Cloudinary configuration and utilities
const CLOUDINARY_CLOUD_NAME = 'dcuziurrb';

export interface CloudinaryTransformation {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'auto';
  gravity?: 'auto' | 'center' | 'face' | 'faces';
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
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

// Predefined transformations for different use cases
export const getProductImageUrl = (publicId: string, size: 'thumbnail' | 'card' | 'detail' | 'preview' = 'card'): string => {
  const transformations: Record<string, CloudinaryTransformation> = {
    thumbnail: {
      width: 150,
      height: 150,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto',
      format: 'auto',
      dpr: 'auto'
    },
    card: {
      width: 400,
      height: 300,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto',
      format: 'auto',
      dpr: 'auto'
    },
    detail: {
      width: 800,
      height: 600,
      crop: 'fit',
      gravity: 'auto',
      quality: 'auto',
      format: 'auto',
      dpr: 'auto'
    },
    preview: {
      width: 200,
      height: 150,
      crop: 'fill',
      gravity: 'auto',
      quality: 60,
      format: 'auto'
    }
  };
  
  return buildCloudinaryUrl(publicId, transformations[size]);
};

// Generate responsive image URLs for different screen sizes
export const getResponsiveImageUrls = (publicId: string) => {
  return {
    mobile: getProductImageUrl(publicId, 'card'),
    tablet: buildCloudinaryUrl(publicId, {
      width: 600,
      height: 450,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto',
      format: 'auto',
      dpr: 'auto'
    }),
    desktop: buildCloudinaryUrl(publicId, {
      width: 800,
      height: 600,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto',
      format: 'auto',
      dpr: 'auto'
    })
  };
};

// Generate preview URL (small, optimized for fast loading)
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
