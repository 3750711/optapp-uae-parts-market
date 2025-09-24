
import { supabase } from "@/integrations/supabase/client";

interface CloudinaryUploadResult {
  success: boolean;
  publicId?: string;
  mainImageUrl?: string;
  originalSize?: number;
  compressedSize?: number;
  error?: string;
}

// Get runtime config for SUPABASE_URL
const getRuntimeConfig = () => {
  try {
    // Try to get from window if available (runtime config)
    if (typeof window !== 'undefined' && (window as any).runtimeConfig) {
      return (window as any).runtimeConfig;
    }
    // Fallback to direct proxy URL
    return { SUPABASE_URL: 'https://api.partsbay.ae' };
  } catch {
    return { SUPABASE_URL: 'https://api.partsbay.ae' };
  }
};

// Get user token for authorization
const getUserToken = async (): Promise<string> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Authentication required - please log in');
    }
    return session.access_token;
  } catch (error) {
    console.error('Failed to get user token:', error);
    throw new Error('Authentication required - please log in');
  }
};

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

// Safe JSON parse with error handling
const safeJsonParse = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('❌ JSON Parse Error:', error);
    console.error('Raw response text (first 500 chars):', text.slice(0, 500));
    throw new Error(`Invalid JSON response: ${text.slice(0, 100)}...`);
  }
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
    const base64 = await fileToBase64(file);
    
    // Determine folder based on productId
    const folder = productId ? 'products' : 'uploads';
    
    // Prepare request data in new format
    const requestData = {
      base64,
      name: file.name,
      type: file.type,
      folder,
      ...(customPublicId && { public_id: customPublicId })
    };
    
    console.log('☁️ Calling Cloudinary upload function via fetch...', {
      folder,
      fileName: file.name,
      hasCustomPublicId: !!customPublicId
    });
    
    console.log('☁️ Calling Cloudinary upload via supabase.functions.invoke...');
    
    const { data, error } = await supabase.functions.invoke('cloudinary-upload', {
      body: requestData
    });

    if (error) {
      console.error('❌ Edge function error:', error);
      throw new Error(`Edge function failed: ${error.message}`);
    }

    console.log('📥 Edge function response:', data);
    
    console.log('📥 Parsed response:', {
      success: data.success,
      hasPublicId: !!data.publicId,
      hasMainImageUrl: !!data.mainImageUrl,
      error: data.error
    });

    if (data.success && data.mainImageUrl) {
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
      console.error('❌ Cloudinary upload failed:', data.error);
      return {
        success: false,
        error: data.error || 'Upload failed without error message'
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

// Direct upload function with new format
export const uploadDirectToCloudinary = async (
  file: File,
  productId?: string,
  customPublicId?: string
): Promise<CloudinaryUploadResult> => {
  try {
    console.log('📤 Direct Cloudinary upload:', {
      fileName: file.name,
      fileSize: file.size,
      productId,
      customPublicId
    });

    // Convert file to base64
    const base64 = await fileToBase64(file);
    
    // Determine folder based on productId
    const folder = productId ? 'products' : 'uploads';
    
    // Prepare request data in new format
    const requestData = {
      base64,
      name: file.name,
      type: file.type,
      folder,
      ...(customPublicId && { public_id: customPublicId })
    };
    
    console.log('☁️ Direct upload to Cloudinary via fetch...', {
      folder,
      fileName: file.name,
      dataSize: base64.length
    });
    
    console.log('☁️ Direct upload to Cloudinary via supabase.functions.invoke...');
    
    const { data, error } = await supabase.functions.invoke('cloudinary-upload', {
      body: requestData
    });

    if (error) {
      console.error('❌ Direct upload error:', error);
      throw new Error(`Direct upload failed: ${error.message}`);
    }

    console.log('📥 Direct upload response:', data);

    if (data.success && data.mainImageUrl) {
      console.log('✅ Direct Cloudinary upload SUCCESS:', {
        publicId: data.publicId,
        mainImageUrl: data.mainImageUrl
      });
      
      return {
        success: true,
        publicId: data.publicId,
        mainImageUrl: data.mainImageUrl,
        originalSize: data.originalSize,
        compressedSize: data.compressedSize
      };
    } else {
      console.error('❌ Direct Cloudinary upload failed:', data.error);
      return {
        success: false,
        error: data.error || 'Direct upload failed'
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
