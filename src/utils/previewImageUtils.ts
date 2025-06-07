
import { getProductImageUrl } from './cloudinaryUtils';

/**
 * Get optimized catalog image URL with priority on Cloudinary
 * Returns the best available image source for catalog display
 */
export const getCatalogImageUrl = (
  originalUrl?: string,
  cloudinaryPublicId?: string | null,
  fallbackUrl: string = '/placeholder.svg',
  cloudinaryUrl?: string | null
): string => {
  console.log('🔍 getCatalogImageUrl params:', {
    originalUrl,
    cloudinaryPublicId,
    cloudinaryUrl,
    fallbackUrl
  });

  // Priority 1: Use Cloudinary compressed image if we have public_id
  if (cloudinaryPublicId) {
    const compressedUrl = getProductImageUrl(cloudinaryPublicId, 'card');
    console.log('✅ Using Cloudinary compressed:', compressedUrl);
    return compressedUrl;
  }

  // Priority 2: Use existing cloudinary_url if available
  if (cloudinaryUrl) {
    console.log('✅ Using existing cloudinary_url:', cloudinaryUrl);
    return cloudinaryUrl;
  }

  // Priority 3: Use original URL if it looks like Cloudinary
  if (originalUrl && originalUrl.includes('cloudinary.com')) {
    console.log('✅ Using Cloudinary original:', originalUrl);
    return originalUrl;
  }

  // Priority 4: Use original URL if available
  if (originalUrl && originalUrl !== fallbackUrl) {
    console.log('✅ Using original URL:', originalUrl);
    return originalUrl;
  }

  // Fallback
  console.log('⚠️ Using fallback:', fallbackUrl);
  return fallbackUrl;
};
