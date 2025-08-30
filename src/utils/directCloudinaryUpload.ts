// Direct Cloudinary upload utilities for optimal performance
import { supabase } from '@/integrations/supabase/client';

const CLOUDINARY_CLOUD_NAME = 'dcuziurrb';
const UNSIGNED_UPLOAD_PRESET = 'heic_preset'; // For HEIC files

export interface DirectUploadResult {
  success: boolean;
  publicId?: string;
  url?: string;
  originalSize?: number;
  compressedSize?: number;
  error?: string;
}

export interface CloudinarySignature {
  cloud_name: string;
  api_key: string;
  timestamp: number;
  folder: string;
  public_id: string;
  signature: string;
  upload_url: string;
}

// Check if file is HEIC/HEIF
export const isHeicFile = (file: File): boolean => {
  const isHeic = file.name.toLowerCase().endsWith('.heic') || 
                 file.name.toLowerCase().endsWith('.heif') ||
                 file.type.toLowerCase().includes('heic') ||
                 file.type.toLowerCase().includes('heif');
  return isHeic;
};

// Get Cloudinary signature for regular uploads
export const getCloudinarySignature = async (orderId?: string, sessionId?: string): Promise<CloudinarySignature> => {
  const { data, error } = await supabase.functions.invoke('cloudinary-sign', {
    body: JSON.stringify({ orderId, sessionId }),
    headers: { 'Content-Type': 'application/json' }
  });

  if (error) {
    throw new Error(`Signature request failed: ${error.message}`);
  }

  if (!data?.success || !data?.data) {
    throw new Error('Invalid signature response');
  }

  return data.data;
};

// Direct upload to Cloudinary for HEIC files (unsigned)
export const uploadHeicDirect = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<DirectUploadResult> => {
  return new Promise((resolve) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UNSIGNED_UPLOAD_PRESET);
    formData.append('folder', 'products');
    
    // Add eager transformations for fast preview
    formData.append('eager', 'c_limit,w_400,q_auto:low|c_limit,w_1200,q_auto:good');
    
    const xhr = new XMLHttpRequest();
    
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };
    }
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.public_id && response.secure_url) {
            // Clean public_id
            const cleanPublicId = response.public_id.replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '');
            
            // Generate optimized URL with c_limit (no cropping)
            const optimizedUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_webp,q_auto:good,c_limit,w_1200/${cleanPublicId}`;
            
            resolve({
              success: true,
              publicId: cleanPublicId,
              url: optimizedUrl,
              originalSize: file.size,
              compressedSize: response.bytes
            });
          } else {
            resolve({
              success: false,
              error: 'Invalid Cloudinary response'
            });
          }
        } catch (error) {
          resolve({
            success: false,
            error: 'Failed to parse Cloudinary response'
          });
        }
      } else {
        resolve({
          success: false,
          error: `Upload failed: ${xhr.status} ${xhr.statusText}`
        });
      }
    };
    
    xhr.onerror = () => resolve({
      success: false,
      error: 'Network error'
    });
    
    xhr.ontimeout = () => resolve({
      success: false,
      error: 'Upload timeout'
    });
    
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);
    xhr.timeout = 180000; // 3 minutes for HEIC processing
    xhr.send(formData);
  });
};

// Direct upload to Cloudinary for regular files (signed)
export const uploadRegularDirect = async (
  file: File,
  signature: CloudinarySignature,
  onProgress?: (progress: number) => void
): Promise<DirectUploadResult> => {
  return new Promise((resolve) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signature.api_key);
    formData.append('timestamp', signature.timestamp.toString());
    formData.append('public_id', signature.public_id);
    formData.append('folder', signature.folder);
    formData.append('signature', signature.signature);
    
    // Add transformations for no cropping
    formData.append('transformation', 'f_webp,q_auto:good,c_limit,w_1200');
    
    const xhr = new XMLHttpRequest();
    
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };
    }
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.public_id && response.secure_url) {
            // Clean public_id
            const cleanPublicId = response.public_id.replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '');
            
            // Generate optimized URL with c_limit (no cropping)
            const optimizedUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_webp,q_auto:good,c_limit,w_1200/${cleanPublicId}`;
            
            resolve({
              success: true,
              publicId: cleanPublicId,
              url: optimizedUrl,
              originalSize: file.size,
              compressedSize: response.bytes
            });
          } else {
            resolve({
              success: false,
              error: 'Invalid Cloudinary response'
            });
          }
        } catch (error) {
          resolve({
            success: false,
            error: 'Failed to parse Cloudinary response'
          });
        }
      } else {
        resolve({
          success: false,
          error: `Upload failed: ${xhr.status} ${xhr.statusText}`
        });
      }
    };
    
    xhr.onerror = () => resolve({
      success: false,
      error: 'Network error'
    });
    
    xhr.ontimeout = () => resolve({
      success: false,
      error: 'Upload timeout'
    });
    
    xhr.open('POST', signature.upload_url);
    xhr.timeout = 180000; // 3 minutes
    xhr.send(formData);
  });
};

// Network-aware compression settings
export const getCompressionSettings = () => {
  const getNetworkType = () => {
    const connection = (navigator as any).connection;
    if (!connection) return '4g';
    return connection.effectiveType || '4g';
  };

  const networkType = getNetworkType();
  const isSlowNetwork = /(2g|slow-2g|3g)/.test(networkType);
  
  return {
    // Telegram-like target sizes
    targetSizeKB: isSlowNetwork ? 220 : 260,
    maxSide: isSlowNetwork ? 1400 : 1600,
    quality: isSlowNetwork ? 0.75 : 0.82,
    parallelism: isSlowNetwork ? 2 : 3
  };
};

// Main upload function that chooses the optimal path
export const uploadImageOptimized = async (
  file: File,
  options: {
    orderId?: string;
    sessionId?: string;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<DirectUploadResult> => {
  const startTime = performance.now();
  
  try {
    if (isHeicFile(file)) {
      console.log('📱 HEIC detected - using unsigned direct upload');
      const result = await uploadHeicDirect(file, options.onProgress);
      const duration = performance.now() - startTime;
      console.log(`⚡ HEIC upload completed in ${Math.round(duration)}ms`);
      return result;
    } else {
      console.log('🖼️ Regular image - using signed direct upload');
      const signature = await getCloudinarySignature(options.orderId, options.sessionId);
      const result = await uploadRegularDirect(file, signature, options.onProgress);
      const duration = performance.now() - startTime;
      console.log(`⚡ Signed upload completed in ${Math.round(duration)}ms`);
      return result;
    }
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`❌ Upload failed after ${Math.round(duration)}ms:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};