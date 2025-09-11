// Multiple fallback mechanisms for robust image upload with real XMLHttpRequest progress
import { uploadImageOptimized, DirectUploadResult } from './directCloudinaryUpload';
import { uploadToCloudinary } from './cloudinaryUpload';
import { supabase } from '@/integrations/supabase/client';
import { uploadWithProgress, createProgressUploader } from './directCloudinaryProgressUpload';

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

// Get Cloudinary signature helper
const getCloudinarySignature = async (orderId?: string, sessionId?: string) => {
  try {
    console.log('🔐 Requesting Cloudinary signature...');
    const { data, error } = await supabase.functions.invoke('cloudinary-sign', {
      body: { orderId, sessionId }
    });
    
    if (error) {
      console.error('❌ Signature request failed:', error);
      throw new Error(`Signature request failed: ${error.message}`);
    }
    
    if (!data?.success || !data?.data) {
      console.error('❌ Invalid signature response:', data);
      throw new Error('Invalid signature response format');
    }
    
    console.log('✅ Cloudinary signature obtained');
    return data.data;
  } catch (error) {
    console.error('❌ Signature error:', error);
    throw error;
  }
};

// Upload to Supabase Storage as final fallback
const uploadToSupabaseStorage = async (file: File, productId?: string, onProgress?: (progress: number) => void): Promise<UploadResult> => {
  try {
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${file.name}`;
    const filePath = `products/${productId || 'temp'}/${fileName}`;
    
    // Simulate progress for Supabase Storage (no real progress available)
    const progressInterval = setInterval(() => {
      const currentProgress = 20 + Math.min(70, Math.random() * 50);
      onProgress?.(currentProgress);
    }, 400);
    
    const { error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);
    
    clearInterval(progressInterval);
    
    if (error) throw error;
    
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);
    
    onProgress?.(100);
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

// Main fallback upload function with real XMLHttpRequest progress
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
  
  // Helper to call progress with proper scaling and method info
  const callProgress = (progress: number, method: string) => {
    // Normalize progress to 0-100% range
    const normalizedProgress = Math.max(0, Math.min(100, progress));
    console.log(`📊 Progress update: ${normalizedProgress.toFixed(1)}% (${method})`);
    if (options.onProgress) {
      options.onProgress(normalizedProgress, method);
    }
  };
  
  // Attempt 1: Direct Cloudinary with XMLHttpRequest and real progress
  try {
    console.log('🎯 Attempt 1: Direct Cloudinary with XMLHttpRequest progress');
    callProgress(5, 'direct-cloudinary');
    
    // Get signature for direct upload
    const signature = await getCloudinarySignature(options.orderId, options.sessionId);
    
    // Use XMLHttpRequest with real progress tracking
    const result = await uploadWithProgress(file, signature, (progress) => {
      // Scale real progress from 10% to 95% for direct cloudinary
      const scaledProgress = 10 + (progress * 0.85);
      callProgress(scaledProgress, 'direct-cloudinary');
    });
    
    if (result.success && result.url) {
      console.log('✅ Success with direct Cloudinary XMLHttpRequest');
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
  
  // Attempt 2: Edge Function cloudinary-upload with smooth linear progress
  try {
    console.log('🎯 Attempt 2: Edge Function upload with linear progress');
    callProgress(10, 'edge-function');
    
    // Linear progress simulation for edge function (10% to 90%)
    let currentProgress = 10;
    const progressInterval = setInterval(() => {
      currentProgress = Math.min(90, currentProgress + 2 + Math.random() * 3);
      callProgress(currentProgress, 'edge-function');
    }, 600);
    
    const result = await uploadToCloudinary(file, options.productId);
    
    clearInterval(progressInterval);
    
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
  
  // Attempt 3: Supabase Storage as final fallback with smooth progress
  try {
    console.log('🎯 Attempt 3: Supabase Storage fallback');
    callProgress(15, 'supabase-storage');
    
    const result = await uploadToSupabaseStorage(file, options.productId, (progress) => {
      callProgress(progress, 'supabase-storage');
    });
    
    if (result.success && result.url) {
      console.log('✅ Success with Supabase Storage');
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