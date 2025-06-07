
import { getProductImageUrl, extractPublicIdFromUrl } from './cloudinaryUtils';

/**
 * Get optimized catalog image URL with priority on Cloudinary
 * Returns the best available image source for catalog display
 * Always tries to generate optimized 'card' size images for catalog
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
    console.log('✅ Using Cloudinary compressed from public_id:', compressedUrl);
    return compressedUrl;
  }

  // Priority 2: Try to extract public_id from cloudinary_url and generate optimized version
  if (cloudinaryUrl && cloudinaryUrl.includes('cloudinary.com')) {
    const extractedPublicId = extractPublicIdFromUrl(cloudinaryUrl);
    if (extractedPublicId) {
      const optimizedUrl = getProductImageUrl(extractedPublicId, 'card');
      console.log('✅ Using optimized from extracted public_id:', optimizedUrl);
      return optimizedUrl;
    }
  }

  // Priority 3: Try to extract public_id from original URL if it's Cloudinary
  if (originalUrl && originalUrl.includes('cloudinary.com')) {
    const extractedPublicId = extractPublicIdFromUrl(originalUrl);
    if (extractedPublicId) {
      const optimizedUrl = getProductImageUrl(extractedPublicId, 'card');
      console.log('✅ Using optimized from original URL public_id:', optimizedUrl);
      return optimizedUrl;
    }
  }

  // Priority 4: Use original URL if available and not a fallback
  if (originalUrl && originalUrl !== fallbackUrl) {
    console.log('⚠️ Using original URL (not optimized):', originalUrl);
    return originalUrl;
  }

  // Fallback
  console.log('⚠️ Using fallback:', fallbackUrl);
  return fallbackUrl;
};
