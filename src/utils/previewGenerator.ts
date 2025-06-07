
import { getPreviewImageUrl, cleanPublicId, isValidPublicId } from "./cloudinaryUtils";
import { supabase } from "@/integrations/supabase/client";

export interface PreviewGenerationResult {
  success: boolean;
  previewUrl?: string;
  previewSize?: number;
  error?: string;
  productUpdated?: boolean;
}

export const generateProductPreview = async (
  imageUrl: string,
  productId: string
): Promise<PreviewGenerationResult> => {
  try {
    console.log('🎨 Starting preview generation with cleanup logic:', {
      imageUrl: imageUrl.substring(0, 50) + '...',
      productId,
      timestamp: new Date().toISOString()
    });

    // Check if the image already has a Cloudinary public_id
    const { data: product } = await supabase
      .from('products')
      .select('cloudinary_public_id, cloudinary_url')
      .eq('id', productId)
      .single();

    if (product?.cloudinary_public_id) {
      // 🔧 ИСПРАВЛЕНИЕ: Clean the public_id from version prefix
      const originalPublicId = product.cloudinary_public_id;
      const cleanedPublicId = cleanPublicId(originalPublicId);
      
      // Validate the cleaned public_id
      if (!isValidPublicId(cleanedPublicId)) {
        console.error('❌ Invalid public_id after cleaning:', {
          original: originalPublicId,
          cleaned: cleanedPublicId,
          productId
        });
        
        return {
          success: false,
          error: 'Invalid public_id format'
        };
      }
      
      // 🔧 ИСПРАВЛЕНИЕ: Generate preview URL using cleaned public_id
      const previewUrl = getPreviewImageUrl(cleanedPublicId);
      
      console.log('✅ Generated preview URL with cleaned public_id:', {
        originalPublicId,
        cleanedPublicId,
        previewUrl,
        productId,
        transformation: 'w_400,h_300,c_fit,g_auto,q_auto:good,f_webp'
      });

      // 🔧 ИСПРАВЛЕНИЕ: Update product with cleaned public_id and preview URL
      const updateData: any = { preview_image_url: previewUrl };
      
      // Always ensure public_id is cleaned in database
      if (originalPublicId !== cleanedPublicId) {
        updateData.cloudinary_public_id = cleanedPublicId;
        console.log('🧹 Also updating public_id to cleaned version:', {
          from: originalPublicId,
          to: cleanedPublicId
        });
      }

      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (updateError) {
        console.error('❌ Failed to update product with preview URL:', updateError);
        return {
          success: false,
          error: 'Failed to update product with preview URL'
        };
      }

      return {
        success: true,
        previewUrl,
        previewSize: 25000, // Estimated size for preview quality (20-25KB)
        productUpdated: true
      };
    } else {
      // Fallback: try to upload to Cloudinary first
      console.log('📤 No Cloudinary data found, attempting upload...');
      
      const { uploadToCloudinary } = await import("./cloudinaryUpload");
      const cloudinaryResult = await uploadToCloudinary(
        imageUrl,
        productId,
        `product_${productId}_preview`
      );

      if (cloudinaryResult.success && cloudinaryResult.publicId) {
        // 🔧 ИСПРАВЛЕНИЕ: The upload function now returns cleaned public_id
        const cleanedPublicId = cloudinaryResult.publicId; // Already cleaned by upload function
        
        // Use cleaned public_id for preview URL generation
        const previewUrl = getPreviewImageUrl(cleanedPublicId);
        
        console.log('✅ Uploaded to Cloudinary and generated preview with clean ID:', {
          cleanedPublicId,
          previewUrl,
          productId,
          transformation: 'w_400,h_300,c_fit,g_auto,q_auto:good,f_webp'
        });

        return {
          success: true,
          previewUrl,
          previewSize: 25000, // Estimated size for preview quality
          productUpdated: true
        };
      } else {
        console.error('❌ Failed to upload to Cloudinary:', cloudinaryResult.error);
        return {
          success: false,
          error: cloudinaryResult.error || 'Failed to upload to Cloudinary'
        };
      }
    }
  } catch (error) {
    console.error('💥 Preview generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const updateProductPreview = async (
  productId: string,
  previewUrl: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('products')
      .update({ preview_image_url: previewUrl })
      .eq('id', productId);

    if (error) {
      console.error('❌ Failed to update product preview:', error);
      return false;
    }

    console.log('✅ Updated product preview URL:', {
      productId,
      previewUrl
    });

    return true;
  } catch (error) {
    console.error('💥 Error updating product preview:', error);
    return false;
  }
};
