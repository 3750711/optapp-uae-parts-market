
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
    // Extract version (v1749191017)
    const versionMatch = cloudinaryUrl.match(/\/v(\d+)\//);
    const version = versionMatch ? `v${versionMatch[1]}` : '';
    
    // Extract extension (.jpg, .png, etc.)
    const extensionMatch = cloudinaryUrl.match(/\.([a-zA-Z]{2,4})$/);
    const extension = extensionMatch ? `.${extensionMatch[1]}` : '';
    
    console.log('🔍 Extracted from cloudinary URL:', {
      cloudinaryUrl,
      version,
      extension
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
  // Priority 1: Use existing preview_image_url if available
  if (previewImageUrl) {
    console.log('🎨 Using existing preview_image_url:', previewImageUrl);
    return previewImageUrl;
  }

  // Priority 2: Generate from cloudinary_public_id using version/extension from main URL
  if (cloudinaryPublicId && cloudinaryUrl) {
    // Clean publicId from version prefix if present
    const cleanPublicId = cloudinaryPublicId.replace(/^v\d+\//, '');
    
    // Extract version and extension from main cloudinary URL
    const { version, extension } = extractVersionAndExtension(cloudinaryUrl);
    
    // Build preview URL with correct structure: transformations/version/publicId.extension
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

// Generate compressed preview image URL (~30KB) using Edge function (keep for backwards compatibility)
export const generatePreviewImage = async (publicId: string, targetSize: number = 30): Promise<string | null> => {
  try {
    console.log('🖼️ Generating preview for publicId:', publicId);

    const { data, error } = await supabase.functions.invoke('generate-preview', {
      body: { 
        publicId,
        targetSize
      }
    });

    if (error) {
      console.error('❌ Preview generation error:', error);
      return null;
    }

    const response = data as PreviewImageResponse;

    if (response.success && response.previewUrl) {
      console.log('✅ Preview generated successfully:', {
        previewUrl: response.previewUrl,
        estimatedSize: `${response.estimatedSize}KB`
      });
      return response.previewUrl;
    } else {
      console.error('❌ Preview generation failed:', response.error);
      return null;
    }

  } catch (error) {
    console.error('💥 Preview generation exception:', error);
    return null;
  }
};

// Batch generate preview images for multiple products
export const batchGeneratePreviewImages = async (
  publicIds: string[],
  targetSize: number = 30
): Promise<Record<string, string | null>> => {
  const results: Record<string, string | null> = {};

  console.log('📦 Batch generating previews for:', publicIds.length, 'images');

  // Process in batches of 5 to avoid overwhelming the server
  const batchSize = 5;
  for (let i = 0; i < publicIds.length; i += batchSize) {
    const batch = publicIds.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (publicId) => {
      const previewUrl = await generatePreviewImage(publicId, targetSize);
      results[publicId] = previewUrl;
    });

    await Promise.all(batchPromises);
    
    // Small delay between batches
    if (i + batchSize < publicIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log('🎉 Batch generation completed:', {
    total: publicIds.length,
    successful: Object.values(results).filter(Boolean).length
  });

  return results;
};
