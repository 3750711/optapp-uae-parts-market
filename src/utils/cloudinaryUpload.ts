
import { supabase } from "@/integrations/supabase/client";

interface CloudinaryUploadResult {
  success: boolean;
  publicId?: string;
  mainImageUrl?: string;
  originalSize?: number;
  compressedSize?: number;
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

// Upload image to Cloudinary with automatic compression
export const uploadToCloudinary = async (
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
    
    console.log('☁️ Calling Cloudinary upload function...');
    
    const { data, error } = await supabase.functions.invoke('cloudinary-upload', {
      body: { 
        fileData,
        fileName: file.name,
        productId,
        customPublicId
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
        publicId: data.publicId,
        mainImageUrl: data.mainImageUrl,
        originalSize: data.originalSize,
        compressedSize: data.compressedSize
      });
      
      return {
        success: true,
        publicId: data.publicId,
        mainImageUrl: data.mainImageUrl,
        originalSize: data.originalSize,
        compressedSize: data.compressedSize
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

// Legacy function - now redirects to new implementation
export const uploadDirectToCloudinary = uploadToCloudinary;
