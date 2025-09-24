// Simplified upload system with basic retry for main system
import { uploadImageOptimized, DirectUploadResult } from './directCloudinaryUpload';

export interface UploadOptions {
  orderId?: string;
  sessionId?: string;
  productId?: string;
  onProgress?: (progress: number) => void;
  maxRetries?: number;
  retryDelay?: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  method: string;
  attempts: number;
}

// Simple retry function for main system (useStagedCloudinaryUpload)
export const uploadWithSimpleRetry = async (
  file: File,
  options: UploadOptions
): Promise<UploadResult> => {
  const { 
    maxRetries = 2, 
    retryDelay = 1500,
    onProgress
  } = options;
  
  console.log(`🔄 Starting simple retry upload for: ${file.name} (max ${maxRetries + 1} attempts)`);
  
  let lastError: any;
  
  // Try main method with retries
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🎯 Attempt ${attempt + 1}/${maxRetries + 1}: Direct Cloudinary for ${file.name}`);
      
      // Report progress for this attempt
      if (onProgress) {
        const baseProgress = (attempt / (maxRetries + 1)) * 100;
        onProgress(baseProgress);
      }
      
      const result = await uploadImageOptimized(file, {
        orderId: options.orderId,
        sessionId: options.sessionId,
        onProgress: (progress) => {
          if (onProgress) {
            const baseProgress = (attempt / (maxRetries + 1)) * 100;
            const attemptProgress = (progress / (maxRetries + 1));
            onProgress(Math.min(baseProgress + attemptProgress, 95));
          }
        }
      });
      
      if (result.success && result.url) {
        console.log(`✅ Success with direct Cloudinary on attempt ${attempt + 1}: ${file.name}`);
        if (onProgress) onProgress(100);
        
        return { 
          success: true, 
          url: result.url, 
          method: 'direct-cloudinary',
          attempts: attempt + 1
        };
      }
      
      // Result not successful, treat as error
      lastError = new Error(result.error || 'Direct upload returned unsuccessful result');
      console.warn(`⚠️ Attempt ${attempt + 1} unsuccessful:`, result.error);
      
    } catch (error) {
      lastError = error;
      console.warn(`❌ Attempt ${attempt + 1} failed:`, error);
    }
    
    // Wait before retry (except on last attempt)
    if (attempt < maxRetries) {
      const delay = retryDelay + (Math.random() * 500); // Add jitter
      console.log(`⏳ Waiting ${Math.round(delay)}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All attempts failed
  const errorMsg = lastError instanceof Error ? lastError.message : 'Upload failed after all attempts';
  console.error(`❌ All ${maxRetries + 1} attempts failed for: ${file.name}`, errorMsg);
  
  return {
    success: false,
    error: `Загрузка не удалась после ${maxRetries + 1} попыток: ${errorMsg}`,
    method: 'direct-cloudinary',
    attempts: maxRetries + 1
  };
};