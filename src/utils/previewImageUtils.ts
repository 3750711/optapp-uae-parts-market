
import { supabase } from "@/integrations/supabase/client";

interface PreviewImageResponse {
  success: boolean;
  previewUrl?: string;
  originalPublicId?: string;
  estimatedSize?: number;
  error?: string;
}

// Generate compressed preview image URL (~30KB) using Edge function
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

// Get catalog-optimized image URL with fallback logic
export const getCatalogImageUrl = (
  previewImageUrl?: string | null,
  cloudinaryPublicId?: string | null,
  fallbackUrl?: string
): string => {
  // Priority 1: Use existing preview_image_url
  if (previewImageUrl) {
    return previewImageUrl;
  }

  // Priority 2: Generate from cloudinary_public_id
  if (cloudinaryPublicId) {
    // Generate optimized catalog URL directly (~30KB)
    const catalogUrl = `https://res.cloudinary.com/dcuziurrb/image/upload/w_400,h_300,c_fit,g_auto,q_auto:eco,f_webp,fl_progressive:semi/${cloudinaryPublicId}`;
    console.log('🎨 Generated catalog URL from publicId:', catalogUrl);
    return catalogUrl;
  }

  // Priority 3: Fallback
  return fallbackUrl || "/placeholder.svg";
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
