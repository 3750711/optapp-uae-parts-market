
import { supabase } from "@/integrations/supabase/client";

interface CloudinaryUploadResult {
  success: boolean;
  cloudinaryUrl?: string;
  publicId?: string;
  originalSize?: number;
  format?: string;
  width?: number;
  height?: number;
  error?: string;
}

export const uploadToCloudinary = async (
  imageUrl: string, 
  productId?: string,
  customPublicId?: string
): Promise<CloudinaryUploadResult> => {
  try {
    console.log('🚀 Starting Cloudinary upload:', {
      imageUrl: imageUrl.substring(0, 50) + '...',
      productId,
      customPublicId
    });

    // Generate public_id if not provided
    const publicId = customPublicId || `product_${productId || Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const { data, error } = await supabase.functions.invoke('upload-to-cloudinary', {
      body: { 
        imageUrl,
        productId,
        publicId
      }
    });

    console.log('📥 Cloudinary function response:', {
      data,
      error,
      hasData: !!data,
      hasError: !!error
    });

    if (error) {
      console.error('❌ Cloudinary function error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload to Cloudinary'
      };
    }

    if (data?.success) {
      console.log('✅ Cloudinary upload SUCCESS:', {
        cloudinaryUrl: data.cloudinaryUrl,
        publicId: data.publicId,
        format: data.format,
        sizeKB: Math.round(data.originalSize / 1024)
      });
      
      return {
        success: true,
        cloudinaryUrl: data.cloudinaryUrl,
        publicId: data.publicId,
        originalSize: data.originalSize,
        format: data.format,
        width: data.width,
        height: data.height
      };
    } else {
      console.error('❌ Cloudinary upload failed:', data?.error);
      return {
        success: false,
        error: data?.error || 'Unknown error occurred'
      };
    }
  } catch (error) {
    console.error('💥 EXCEPTION in uploadToCloudinary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
