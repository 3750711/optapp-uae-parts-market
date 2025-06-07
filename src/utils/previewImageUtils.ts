import { supabase } from "@/integrations/supabase/client";

interface PreviewImageResponse {
  success: boolean;
  previewUrl?: string;
  originalPublicId?: string;
  estimatedSize?: number;
  error?: string;
}

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

  // Priority 1: Use main cloudinary URL if available (original quality)
  if (cloudinaryUrl) {
    console.log('🎨 Using main cloudinary URL (original):', cloudinaryUrl);
    return cloudinaryUrl;
  }

  // Priority 2: Use existing preview_image_url if available
  if (previewImageUrl) {
    console.log('🎨 Using existing preview_image_url:', previewImageUrl);
    return previewImageUrl;
  }

  // Priority 3: Generate basic URL from cloudinary_public_id
  if (cloudinaryPublicId) {
    console.log('🎨 Generating basic URL from publicId...');
    const cleanPublicId = cloudinaryPublicId.replace(/^v\d+\//, '');
    const basicUrl = `https://res.cloudinary.com/dcuziurrb/image/upload/${cleanPublicId}`;
    
    console.log('🎨 Generated basic URL:', {
      originalPublicId: cloudinaryPublicId,
      cleanPublicId,
      basicUrl
    });
    
    return basicUrl;
  }

  // Priority 4: Fallback
  console.log('🎨 Using fallback URL:', fallbackUrl);
  return fallbackUrl || "/placeholder.svg";
};

// Generate compressed preview image URL (~30KB) using Edge function (keep for backwards compatibility)
export const generatePreviewImage = async (publicId: string, targetSize: number = 30): Promise<string | null> => {
  console.log('⚠️ generatePreviewImage is deprecated, returning null');
  return null;
};

// Batch generate preview images for multiple products
export const batchGeneratePreviewImages = async (
  publicIds: string[],
  targetSize: number = 30
): Promise<Record<string, string | null>> => {
  console.log('⚠️ batchGeneratePreviewImages is deprecated, returning empty object');
  return {};
};
