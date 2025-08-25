
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
  // Check if we have any Cloudinary data
  const hasCloudinaryData = cloudinaryPublicId || 
    (cloudinaryUrl && cloudinaryUrl.includes('cloudinary.com')) ||
    (originalUrl && originalUrl.includes('cloudinary.com'));

  // If no Cloudinary data, prioritize Supabase Storage URLs
  if (!hasCloudinaryData) {
    // Priority 1: Use originalUrl if it's a valid Supabase URL
    if (originalUrl && originalUrl !== fallbackUrl && originalUrl.includes('supabase.co')) {
      return originalUrl;
    }
    
    // Priority 2: Use cloudinaryUrl if it's actually a Supabase URL
    if (cloudinaryUrl && cloudinaryUrl !== fallbackUrl && cloudinaryUrl.includes('supabase.co')) {
      return cloudinaryUrl;
    }

    // Priority 3: Any other non-fallback URL
    if (originalUrl && originalUrl !== fallbackUrl) {
      return originalUrl;
    }
    
    if (cloudinaryUrl && cloudinaryUrl !== fallbackUrl) {
      return cloudinaryUrl;
    }
  } else {
    // We have Cloudinary data, use Cloudinary priority
    // Priority 1: Use cloudinaryPublicId if available
    if (cloudinaryPublicId) {
      const cloudinaryImageUrl = getProductImageUrl(cloudinaryPublicId, 'card');
      return cloudinaryImageUrl;
    }

    // Priority 2: Try to extract publicId from cloudinaryUrl
    if (cloudinaryUrl && cloudinaryUrl.includes('cloudinary.com')) {
      const extractedPublicId = extractPublicIdFromUrl(cloudinaryUrl);
      if (extractedPublicId) {
        const cloudinaryImageUrl = getProductImageUrl(extractedPublicId, 'card');
        return cloudinaryImageUrl;
      }
    }

    // Priority 3: Try to extract publicId from originalUrl if it's a Cloudinary URL
    if (originalUrl && originalUrl.includes('cloudinary.com')) {
      const extractedPublicId = extractPublicIdFromUrl(originalUrl);
      if (extractedPublicId) {
        const cloudinaryImageUrl = getProductImageUrl(extractedPublicId, 'card');
        return cloudinaryImageUrl;
      }
      // If it's a Cloudinary URL but extraction failed, use it as-is
      return originalUrl;
    }

    // Priority 4: Use Supabase Storage URLs as fallback
    if (originalUrl && originalUrl !== fallbackUrl && !originalUrl.includes('cloudinary.com')) {
      return originalUrl;
    }

    // Priority 5: Use cloudinaryUrl as fallback
    if (cloudinaryUrl && cloudinaryUrl !== fallbackUrl) {
      return cloudinaryUrl;
    }
  }

  // Final fallback
  return fallbackUrl;
};
