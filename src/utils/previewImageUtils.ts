
import { supabase } from "@/integrations/supabase/client";

// Helper function to extract version and extension from cloudinary URL
const extractVersionAndExtension = (cloudinaryUrl: string): { version: string; extension: string } => {
  try {
    console.log('🔍 Extracting version/extension from URL:', cloudinaryUrl);
    
    // Extract version (v1749191017)
    const versionMatch = cloudinaryUrl.match(/\/v(\d+)\//);
    const version = versionMatch ? `v${versionMatch[1]}` : '';
    
    // Extract extension (.jpg, .png, etc.)
    const extensionMatch = cloudinaryUrl.match(/\.([a-zA-Z]{2,4})$/);
    const extension = extensionMatch ? `.${extensionMatch[1]}` : '';
    
    console.log('🔍 Extraction result:', {
      cloudinaryUrl,
      version,
      extension,
      versionMatch,
      extensionMatch
    });
    
    return { version, extension };
  } catch (error) {
    console.error('❌ Error extracting version/extension:', error);
    return { version: '', extension: '' };
  }
};

// Get catalog-optimized image URL with fallback logic
export const getCatalogImageUrl = (
  previewImageUrl?: string | null,
  cloudinaryPublicId?: string | null,
  fallbackUrl?: string,
  cloudinaryUrl?: string | null
): string => {
  console.log('🎨 getCatalogImageUrl called with:', {
    previewImageUrl,
    cloudinaryPublicId,
    fallbackUrl,
    cloudinaryUrl,
    previewImageUrlType: typeof previewImageUrl,
    cloudinaryPublicIdType: typeof cloudinaryPublicId,
    cloudinaryUrlType: typeof cloudinaryUrl
  });

  // Priority 1: Use existing preview_image_url if available
  if (previewImageUrl) {
    console.log('🎨 Using existing preview_image_url:', previewImageUrl);
    return previewImageUrl;
  }

  // Priority 2: Generate from cloudinary_public_id using version/extension from main URL
  if (cloudinaryPublicId && cloudinaryUrl) {
    console.log('🎨 Generating from publicId + main URL...');
    
    // Clean publicId from version prefix if present
    const cleanPublicId = cloudinaryPublicId.replace(/^v\d+\//, '');
    
    // Extract version and extension from main cloudinary URL
    const { version, extension } = extractVersionAndExtension(cloudinaryUrl);
    
    // Build catalog URL with correct structure: transformations/version/publicId.extension
    const catalogUrl = `https://res.cloudinary.com/dcuziurrb/image/upload/w_400,h_300,c_fit,g_auto,q_auto:good,f_webp/${version}/${cleanPublicId}${extension}`;
    
    console.log('🎨 Generated catalog URL with version/extension:', {
      originalPublicId: cloudinaryPublicId,
      cleanPublicId,
      version,
      extension,
      catalogUrl
    });
    
    return catalogUrl;
  }

  // Priority 3: Generate from cloudinary_public_id without version (fallback)
  if (cloudinaryPublicId) {
    console.log('🎨 Generating from publicId only (no version)...');
    const cleanPublicId = cloudinaryPublicId.replace(/^v\d+\//, '');
    const catalogUrl = `https://res.cloudinary.com/dcuziurrb/image/upload/w_400,h_300,c_fit,g_auto,q_auto:good,f_webp/${cleanPublicId}`;
    
    console.log('🎨 Generated catalog URL from publicId (no version):', {
      originalPublicId: cloudinaryPublicId,
      cleanPublicId,
      catalogUrl
    });
    
    return catalogUrl;
  }

  // Priority 4: Fallback
  console.log('🎨 Using fallback URL:', fallbackUrl);
  return fallbackUrl || "/placeholder.svg";
};
