/**
 * Cloudinary Responsive Image Utilities
 * Generates srcSet and optimized URLs for different screen sizes
 */

interface CloudinaryUrlOptions {
  width?: number;
  height?: number;
  quality?: 'auto:low' | 'auto:good' | 'auto:best';
  format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif';
  crop?: 'limit' | 'fit' | 'fill';
}

const CLOUD_NAME = 'dcuziurrb';
const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

/**
 * Extract publicId from Cloudinary URL
 */
export const extractPublicId = (url: string): string | null => {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  // Match pattern: .../upload/v{version}/{publicId}
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
  return match ? match[1] : null;
};

/**
 * Check if URL is from Cloudinary
 */
export const isCloudinaryUrl = (url: string): boolean => {
  return url.includes('cloudinary.com');
};

/**
 * Generate optimized Cloudinary URL with transformations
 */
export const generateCloudinaryUrl = (
  publicIdOrUrl: string,
  options: CloudinaryUrlOptions = {}
): string => {
  // Extract publicId if URL is provided
  const publicId = isCloudinaryUrl(publicIdOrUrl) 
    ? extractPublicId(publicIdOrUrl) 
    : publicIdOrUrl;

  if (!publicId) return publicIdOrUrl;

  const {
    width,
    height,
    quality = 'auto:good',
    format = 'auto',
    crop = 'limit',
  } = options;

  const transformations: string[] = [];

  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  transformations.push(`c_${crop}`);
  transformations.push(`q_${quality}`);
  transformations.push(`f_${format}`);
  transformations.push('dpr_auto');
  transformations.push('fl_progressive');

  return `${BASE_URL}/${transformations.join(',')}/${publicId}`;
};

/**
 * Generate responsive srcSet for different screen sizes
 * Returns srcSet string ready for <img> tag
 */
export const generateSrcSet = (
  publicIdOrUrl: string,
  widths: readonly number[] | number[] = [640, 800, 1200, 1600],
  options: Omit<CloudinaryUrlOptions, 'width'> = {}
): string => {
  return widths
    .map((width) => {
      const url = generateCloudinaryUrl(publicIdOrUrl, { ...options, width });
      return `${url} ${width}w`;
    })
    .join(', ');
};

/**
 * Generate sizes attribute based on common breakpoints
 */
export const generateSizesAttr = (
  type: 'gallery' | 'card' | 'thumbnail' | 'fullscreen'
): string => {
  const sizesMap = {
    gallery: '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 70vw',
    card: '(max-width: 640px) 320px, (max-width: 1024px) 400px, 480px',
    thumbnail: '(max-width: 640px) 80px, 100px',
    fullscreen: '100vw',
  };

  return sizesMap[type];
};

/**
 * Predefined responsive configurations
 */
export const RESPONSIVE_PRESETS = {
  gallery: {
    widths: [640, 800, 1200, 1600],
    sizes: generateSizesAttr('gallery'),
    quality: 'auto:good' as const,
  },
  card: {
    widths: [320, 400, 600, 800],
    sizes: generateSizesAttr('card'),
    quality: 'auto:good' as const,
  },
  thumbnail: {
    widths: [80, 100, 150, 200],
    sizes: generateSizesAttr('thumbnail'),
    quality: 'auto:good' as const,
  },
  fullscreen: {
    widths: [800, 1200, 1600, 2400],
    sizes: generateSizesAttr('fullscreen'),
    quality: 'auto:best' as const,
  },
} as const;
