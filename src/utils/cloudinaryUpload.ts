
import { supabase } from "@/integrations/supabase/client";

interface CloudinaryUploadResult {
  success: boolean;
  cloudinaryUrl?: string;
  publicId?: string;
  originalSize?: number;
  format?: string;
  width?: number;
  height?: number;
  variants?: {
    preview?: {
      url: string;
      transformation: string;
      estimatedSize: number;
    };
  };
  error?: string;
}

// Convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

// Direct upload to Cloudinary using base64 data
export const uploadDirectToCloudinary = async (
  file: File,
  productId?: string,
  customPublicId?: string
): Promise<CloudinaryUploadResult> => {
  try {
    console.log('📤 Converting file to base64 for Cloudinary upload:', {
      fileName: file.name,
      fileSize: file.size,
      productId,
      customPublicId
    });

    // Convert file to base64
    const fileData = await fileToBase64(file);
    
    // Generate public_id if not provided
    const publicId = customPublicId || `product_${productId || Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    console.log('☁️ Sending to Cloudinary edge function...');
    
    const { data, error } = await supabase.functions.invoke('upload-to-cloudinary', {
      body: { 
        fileData,
        fileName: file.name,
        productId,
        publicId,
        createVariants: true
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
      console.log('✅ Direct Cloudinary upload SUCCESS:', {
        cloudinaryUrl: data.cloudinaryUrl,
        publicId: data.publicId,
        format: data.format,
        sizeKB: Math.round(data.originalSize / 1024),
        hasPreview: !!data.variants?.preview,
        variants: data.variants
      });
      
      return {
        success: true,
        cloudinaryUrl: data.cloudinaryUrl,
        publicId: data.publicId,
        originalSize: data.originalSize,
        format: data.format,
        width: data.width,
        height: data.height,
        variants: data.variants
      };
    } else {
      console.error('❌ Cloudinary upload failed:', data?.error);
      return {
        success: false,
        error: data?.error || 'Unknown error occurred'
      };
    }
  } catch (error) {
    console.error('💥 EXCEPTION in uploadDirectToCloudinary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Legacy function for backward compatibility - now uses direct upload
export const uploadToCloudinary = async (
  imageUrl: string, 
  productId?: string,
  customPublicId?: string,
  createVariants: boolean = true
): Promise<CloudinaryUploadResult> => {
  console.log('⚠️ uploadToCloudinary called with URL - this should use direct file upload instead');
  
  try {
    // If it's a blob URL, we can't process it on the server
    if (imageUrl.startsWith('blob:')) {
      throw new Error('Blob URLs are not supported. Use uploadDirectToCloudinary with the actual file instead.');
    }
    
    // For other URLs (external images), we could potentially support them
    // but for now, recommend using direct upload
    return {
      success: false,
      error: 'URL-based uploads are deprecated. Use uploadDirectToCloudinary with file objects instead.'
    };
  } catch (error) {
    console.error('💥 EXCEPTION in uploadToCloudinary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
