// Multiple fallback mechanisms for robust image upload
import { uploadImageOptimized, DirectUploadResult } from './directCloudinaryUpload';
import { uploadToCloudinary } from './cloudinaryUpload';
import { supabase } from '@/integrations/supabase/client';

export interface UploadOptions {
  orderId?: string;
  sessionId?: string;
  productId?: string;
  onProgress?: (progress: number, method?: string) => void;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  method?: string;
}

export interface UploadAttempt {
  method: string;
  error: string;
}

// Upload to Supabase Storage as final fallback
const uploadToSupabaseStorage = async (file: File, productId?: string): Promise<UploadResult> => {
  try {
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${file.name}`;
    const filePath = `products/${productId || 'temp'}/${fileName}`;
    
    const { error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);
    
    if (error) throw error;
    
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);
    
    return {
      success: true,
      url: data.publicUrl,
      method: 'supabase-storage'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Supabase storage failed',
      method: 'supabase-storage'
    };
  }
};

// Main fallback upload function with multiple retry mechanisms
export const uploadWithMultipleFallbacks = async (
  file: File,
  options: UploadOptions
): Promise<UploadResult> => {
  const attempts: UploadAttempt[] = [];
  
  console.log('🎯 Starting multi-fallback upload for:', {
    fileName: file.name,
    size: file.size,
    orderId: options.orderId,
    sessionId: options.sessionId
  });
  
  // Helper to call progress with method info
  const callProgress = (progress: number, method: string) => {
    console.log(`📊 Upload progress: ${progress}% using ${method}`);
    if (options.onProgress) {
      options.onProgress(progress, method);
    }
  };
  
  // Attempt 1: Direct Cloudinary with signed upload
  try {
    console.log('🎯 Attempt 1: Direct Cloudinary signed upload');
    callProgress(10, 'direct-cloudinary');
    
    const result = await uploadImageOptimized(file, {
      orderId: options.orderId,
      sessionId: options.sessionId,
      onProgress: (progress) => callProgress(10 + (progress * 0.8), 'direct-cloudinary')
    });
    
    if (result.success && result.url) {
      console.log('✅ Success with direct Cloudinary');
      callProgress(100, 'direct-cloudinary');
      return { 
        success: true, 
        url: result.url, 
        method: 'direct-cloudinary' 
      };
    }
    
    attempts.push({ method: 'direct-cloudinary', error: result.error || 'Unknown error' });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    attempts.push({ method: 'direct-cloudinary', error: errorMsg });
    console.warn('❌ Direct Cloudinary failed:', errorMsg);
  }
  
  // Attempt 2: Edge Function cloudinary-upload
  try {
    console.log('🎯 Attempt 2: Edge Function upload');
    callProgress(20, 'edge-function');
    
    const result = await uploadToCloudinary(file, options.productId);
    
    if (result.success && result.mainImageUrl) {
      console.log('✅ Success with Edge Function');
      callProgress(100, 'edge-function');
      return { 
        success: true, 
        url: result.mainImageUrl, 
        method: 'edge-function' 
      };
    }
    
    attempts.push({ method: 'edge-function', error: result.error || 'Unknown error' });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    attempts.push({ method: 'edge-function', error: errorMsg });
    console.warn('❌ Edge Function failed:', errorMsg);
  }
  
  // Attempt 3: Supabase Storage as final fallback
  try {
    console.log('🎯 Attempt 3: Supabase Storage fallback');
    callProgress(30, 'supabase-storage');
    
    const result = await uploadToSupabaseStorage(file, options.productId);
    
    if (result.success && result.url) {
      console.log('✅ Success with Supabase Storage');
      callProgress(100, 'supabase-storage');
      return result;
    }
    
    attempts.push({ method: 'supabase-storage', error: result.error || 'Unknown error' });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    attempts.push({ method: 'supabase-storage', error: errorMsg });
    console.warn('❌ Supabase Storage failed:', errorMsg);
  }
  
  // All attempts failed - create detailed diagnostics
  console.error('❌ All upload attempts failed:', attempts);
  
  // Save diagnostics for debugging
  const diagnostics = {
    timestamp: Date.now(),
    file: { 
      name: file.name, 
      size: file.size, 
      type: file.type 
    },
    attempts,
    network: {
      online: navigator.onLine,
      type: (navigator as any).connection?.effectiveType || 'unknown'
    },
    options
  };
  
  localStorage.setItem('last_upload_failure', JSON.stringify(diagnostics));
  
  return {
    success: false,
    error: `Upload failed. Tried ${attempts.length} methods: ${attempts.map(a => `${a.method} (${a.error})`).join(', ')}`,
    method: 'all-failed'
  };
};