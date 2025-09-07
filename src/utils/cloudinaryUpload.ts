
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
    return session?.access_token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0';
  } catch {
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0';
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
    
    // Get runtime config and token
    const config = getRuntimeConfig();
    const token = await getUserToken();
    const functionUrl = `${config.SUPABASE_URL}/functions/v1/cloudinary-upload`;
    
    console.log('🌐 Request URL:', functionUrl);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestData)
    });

    // Log raw response for debugging
    const responseText = await response.text();
    console.log('📥 Raw response (first 500 chars):', responseText.slice(0, 500));
    console.log('📊 Response status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText);
      console.error('❌ Response body:', responseText.slice(0, 1000));
      throw new Error(`HTTP ${response.status}: ${responseText.slice(0, 200)}`);
    }

    // Parse JSON safely
    const data = safeJsonParse(responseText);
    
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
    
    // Get runtime config and token
    const config = getRuntimeConfig();
    const token = await getUserToken();
    const functionUrl = `${config.SUPABASE_URL}/functions/v1/cloudinary-upload`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestData)
    });

    // Log raw response for debugging
    const responseText = await response.text();
    console.log('📥 Direct upload raw response (first 500 chars):', responseText.slice(0, 500));

    if (!response.ok) {
      console.error('❌ Direct upload HTTP Error:', response.status);
      console.error('❌ Response body:', responseText.slice(0, 1000));
      throw new Error(`HTTP ${response.status}: ${responseText.slice(0, 200)}`);
    }

    // Parse JSON safely
    const data = safeJsonParse(responseText);

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
