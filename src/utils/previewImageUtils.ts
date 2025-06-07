
import { supabase } from "@/integrations/supabase/client";

// Get catalog-optimized image URL with fallback logic
export const getCatalogImageUrl = (
  originalImageUrl?: string | null,
  cloudinaryPublicId?: string | null,
  fallbackUrl?: string,
  cloudinaryUrl?: string | null
): string => {
  console.log('🎨 getCatalogImageUrl called with:', {
    originalImageUrl,
    cloudinaryPublicId,
    fallbackUrl,
    cloudinaryUrl
  });

  // Priority 1: Use existing image URL if available
  if (originalImageUrl) {
    console.log('🎨 Using existing image URL:', originalImageUrl);
    return originalImageUrl;
  }

  // Priority 2: Use cloudinary URL if available
  if (cloudinaryUrl) {
    console.log('🎨 Using Cloudinary URL:', cloudinaryUrl);
    return cloudinaryUrl;
  }

  // Priority 3: Fallback
  console.log('🎨 Using fallback URL:', fallbackUrl);
  return fallbackUrl || "/placeholder.svg";
};
