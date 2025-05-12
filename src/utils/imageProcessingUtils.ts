
import imageCompression from 'browser-image-compression';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Logs information about image processing operations
 * @param action The action being performed
 * @param details Additional details about the action
 */
export function logImageProcessing(action: string, details: Record<string, any> = {}) {
  console.log(`[Image:${action}]`, details);
}

/**
 * Optimizes an image for upload according to marketplace standards
 * - Creates standardized images with consistent quality and size
 * - Applies proper compression for web display
 * - Formats according to best practices for e-commerce
 * 
 * @param file The original image file
 * @returns The processed image file
 */
export async function optimizeImageForMarketplace(file: File): Promise<File> {
  try {
    logImageProcessing('OptimizationStart', { 
      fileName: file.name,
      originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type
    });
    
    // Standard marketplace image requirements:
    // - Max dimensions: 2000px (high enough for zoom features while limiting excessive size)
    // - Target size: Under 800KB (good balance between quality and performance)
    // - Format: Maintain original (typically JPEG/PNG) for maximum compatibility
    const options = {
      maxSizeMB: 0.8,                 // Target max 800KB for standard marketplace images
      maxWidthOrHeight: 2000,         // Standard size limit for marketplace product images
      useWebWorker: true,             // Use WebWorker for better performance
      fileType: file.type,            // Maintain original format
      initialQuality: 0.8,            // Start with 80% quality (good balance)
      alwaysKeepResolution: false     // Allow resizing for consistency
    };
    
    // Apply compression
    const compressedBlob = await imageCompression(file, options);
    
    // Create a new File object with the compressed data
    const optimizedFile = new File([compressedBlob], file.name, {
      type: file.type,
      lastModified: Date.now()
    });
    
    logImageProcessing('OptimizationComplete', {
      fileName: file.name,
      originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      optimizedSize: `${(optimizedFile.size / 1024 / 1024).toFixed(2)}MB`,
      compressionRatio: `${Math.round((1 - (optimizedFile.size / file.size)) * 100)}%`
    });
    
    return optimizedFile;
  } catch (error) {
    logImageProcessing('OptimizationError', {
      fileName: file.name,
      error: error instanceof Error ? error.message : String(error)
    });
    console.error('Error optimizing image:', error);
    // Return original file if optimization fails
    return file;
  }
}

/**
 * Uploads an image to Supabase storage with proper optimization
 * @param file The image file to upload
 * @param storageBucket The Supabase storage bucket
 * @param storagePath The path within the storage bucket
 * @returns The URL of the uploaded image
 */
export async function uploadImageToStorage(
  file: File,
  storageBucket: string,
  storagePath: string = ""
): Promise<string> {
  try {
    // First optimize the image according to marketplace standards
    const optimizedFile = await optimizeImageForMarketplace(file);
    
    // Generate a unique filename to avoid collisions
    const fileExt = optimizedFile.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const fileName = `${storagePath ? `${storagePath}/` : ''}${timestamp}-${randomString}.${fileExt}`;
    
    logImageProcessing('UploadStart', { 
      fileName, 
      bucket: storageBucket,
      fileSize: `${(optimizedFile.size / 1024).toFixed(2)}KB`
    });
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(storageBucket)
      .upload(fileName, optimizedFile, {
        cacheControl: '3600',
        contentType: optimizedFile.type,
        upsert: false
      });
      
    if (error) {
      logImageProcessing('UploadError', { 
        fileName, 
        error: error.message 
      });
      throw error;
    }
    
    // Get the public URL for the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from(storageBucket)
      .getPublicUrl(fileName);
      
    logImageProcessing('UploadSuccess', {
      fileName,
      publicUrl,
      fileSize: `${(optimizedFile.size / 1024).toFixed(2)}KB`
    });
    
    return publicUrl;
  } catch (error) {
    logImageProcessing('UploadException', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Process and upload multiple images with concurrent operation control
 * @param files Array of files to upload
 * @param storageBucket The storage bucket name
 * @param storagePath The path within the bucket
 * @param onProgress Callback for progress updates
 * @param concurrentUploads Maximum number of concurrent uploads
 * @returns Array of public URLs for the uploaded images
 */
export async function uploadMultipleImages(
  files: File[],
  storageBucket: string,
  storagePath: string = "",
  onProgress?: (overall: number, fileIndex: number, progress: number) => void,
  concurrentUploads: number = 3
): Promise<string[]> {
  const uploadedUrls: string[] = [];
  let completed = 0;
  const total = files.length;
  
  // Process files in batches to limit concurrent operations
  for (let i = 0; i < total; i += concurrentUploads) {
    const batch = files.slice(i, i + concurrentUploads);
    const batchPromises = batch.map((file, batchIndex) => {
      const fileIndex = i + batchIndex;
      
      return new Promise<string>(async (resolve, reject) => {
        try {
          // Upload with progress simulation
          const uploadProgressInterval = setInterval(() => {
            if (onProgress) {
              const progress = Math.min(Math.round(Math.random() * 50 + 30), 90);
              onProgress(Math.round((completed / total) * 100), fileIndex, progress);
            }
          }, 300);
          
          // Perform the actual upload
          const url = await uploadImageToStorage(file, storageBucket, storagePath);
          
          // Clean up interval and report completion
          clearInterval(uploadProgressInterval);
          completed++;
          
          if (onProgress) {
            onProgress(Math.round((completed / total) * 100), fileIndex, 100);
          }
          
          resolve(url);
        } catch (error) {
          completed++;
          reject(error);
        }
      });
    });
    
    // Wait for the current batch to complete
    const results = await Promise.allSettled(batchPromises);
    
    // Process results
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        uploadedUrls.push(result.value);
      } else {
        console.error('Error uploading file:', result.reason);
      }
    });
  }
  
  return uploadedUrls;
}

/**
 * Check if file exceeds size limit
 * @param file The file to check
 * @param maxSizeMB Maximum size in MB
 * @returns Boolean indicating if file is too large
 */
export function isFileTooLarge(file: File, maxSizeMB: number = 25): boolean {
  return file.size > maxSizeMB * 1024 * 1024;
}

/**
 * Validates an image file for marketplace standards
 * @param file The file to validate
 * @returns Object containing validation result and any error message
 */
export function validateImageForMarketplace(file: File): { isValid: boolean; errorMessage?: string } {
  // Check if it's an image
  if (!file.type.startsWith('image/')) {
    return { isValid: false, errorMessage: `${file.name} is not an image file` };
  }
  
  // Check file size (25MB is a common generous upper limit before compression)
  if (isFileTooLarge(file, 25)) {
    return { 
      isValid: false, 
      errorMessage: `${file.name} exceeds maximum size of 25MB` 
    };
  }
  
  // Check supported formats (common marketplace formats)
  const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!supportedTypes.includes(file.type)) {
    return {
      isValid: false,
      errorMessage: `${file.name} format is not supported. Please use JPEG, PNG, or WebP.`
    };
  }
  
  return { isValid: true };
}

/**
 * Process an image for upload, including optimization and preview generation
 * @param file The image file to process
 * @returns Object containing the optimized file and preview file
 */
export async function processImageForUpload(file: File): Promise<{ 
  optimizedFile: File, 
  previewFile?: File,
  originalSize: number,
  optimizedSize: number 
}> {
  try {
    // Optimize the image according to marketplace standards
    const optimizedFile = await optimizeImageForMarketplace(file);
    
    // Return the processed result (without preview since it was removed)
    return {
      optimizedFile,
      originalSize: file.size,
      optimizedSize: optimizedFile.size
    };
  } catch (error) {
    logImageProcessing('ProcessingError', {
      fileName: file.name,
      error: error instanceof Error ? error.message : String(error)
    });
    console.error('Error processing image:', error);
    
    // Return original file if processing fails
    return {
      optimizedFile: file,
      originalSize: file.size,
      optimizedSize: file.size
    };
  }
}

/**
 * Force update product preview URLs in the database
 * @param productId ID of the product to update
 * @returns Result of the update operation
 */
export async function forceUpdateProductPreviews(productId: string): Promise<{
  success: boolean,
  message: string,
  details?: any
}> {
  try {
    logImageProcessing('ForceUpdateStart', { productId });
    
    // Implementation note: Since we've removed preview functionality,
    // this function now just verifies that all image records exist
    
    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, title')
      .eq('id', productId)
      .single();
      
    if (productError || !product) {
      return {
        success: false,
        message: 'Product not found'
      };
    }
    
    // Get all product images
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('id, url')
      .eq('product_id', productId);
      
    if (imagesError) {
      return {
        success: false,
        message: 'Error fetching product images'
      };
    }
    
    // Since preview functionality is removed, we just return success
    // but don't actually make any changes
    return {
      success: true,
      message: `Product images verified (${images?.length || 0} images)`,
      details: {
        imageCount: images?.length || 0
      }
    };
  } catch (error) {
    logImageProcessing('ForceUpdateError', {
      productId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Check and repair preview URLs in the database
 * @param productId ID of the product to check
 * @returns Result of the repair operation
 */
export async function checkAndRepairPreviewUrls(productId: string): Promise<{
  success: boolean,
  message: string,
  details?: any
}> {
  try {
    logImageProcessing('RepairStart', { productId });
    
    // Implementation note: Since we've removed preview functionality,
    // this function now just logs the request but doesn't make changes
    
    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, title')
      .eq('id', productId)
      .single();
      
    if (productError || !product) {
      return {
        success: false,
        message: 'Product not found'
      };
    }
    
    // Since preview functionality has been removed, we just return success
    // but don't actually make any changes to preview URLs
    return {
      success: true,
      message: 'No action needed (preview functionality removed)',
    };
  } catch (error) {
    logImageProcessing('RepairError', {
      productId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Verify product preview generation status
 * @param productId ID of the product to verify
 * @returns Verification result
 */
export async function verifyProductPreviewGeneration(productId: string): Promise<{
  success: boolean,
  message?: string,
  totalImages: number,
  imagesWithPreview: number,
  hasPreview: boolean
}> {
  try {
    logImageProcessing('VerifyStart', { productId });
    
    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, title, has_preview')
      .eq('id', productId)
      .single();
      
    if (productError || !product) {
      return {
        success: false,
        message: 'Product not found',
        totalImages: 0,
        imagesWithPreview: 0,
        hasPreview: false
      };
    }
    
    // Get all product images
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('id, url, preview_url')
      .eq('product_id', productId);
      
    if (imagesError) {
      return {
        success: false,
        message: 'Error fetching product images',
        totalImages: 0,
        imagesWithPreview: 0,
        hasPreview: false
      };
    }
    
    const totalImages = images?.length || 0;
    // Since preview functionality has been removed, we consider all images to not have previews
    const imagesWithPreview = 0;
    
    return {
      success: true,
      totalImages,
      imagesWithPreview,
      hasPreview: product.has_preview || false
    };
  } catch (error) {
    logImageProcessing('VerifyError', {
      productId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      totalImages: 0,
      imagesWithPreview: 0,
      hasPreview: false
    };
  }
}
