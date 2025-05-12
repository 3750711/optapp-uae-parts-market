
import { supabase } from "@/integrations/supabase/client";
import { optimizeImage, createPreviewImage } from "@/utils/imageCompression";

/**
 * Unified image processing interface for consistent handling across components
 */
export interface ProcessedImage {
  originalFile: File;
  optimizedFile: File;
  previewFile?: File;
  originalSize: number;
  optimizedSize: number;
  previewSize?: number;
}

/**
 * Logs detailed image processing information
 */
export function logImageProcessing(stage: string, details: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const logDetails = {
    timestamp,
    ...details
  };
  console.log(`[ImageProcessing:${stage}]`, logDetails);
}

/**
 * Processes an image for upload, including optimization and preview generation
 * @param file Original image file
 * @returns Promise with processed image data
 */
export async function processImageForUpload(file: File): Promise<ProcessedImage> {
  logImageProcessing('Start', { 
    fileName: file.name, 
    fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    fileType: file.type
  });
  
  const startTime = performance.now();
  let optimizedFile = file;
  let previewFile = undefined;
  
  try {
    // Optimize original image (target ~1MB)
    optimizedFile = await optimizeImage(file);
    logImageProcessing('Optimized', { 
      originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      optimizedSize: `${(optimizedFile.size / 1024 / 1024).toFixed(2)}MB`,
      compressionRatio: `${((1 - (optimizedFile.size / file.size)) * 100).toFixed(1)}%`
    });
    
    // Create preview (target ~200KB)
    try {
      previewFile = await createPreviewImage(file);
      logImageProcessing('Preview', { 
        previewSize: `${(previewFile.size / 1024).toFixed(2)}KB`,
        format: 'WebP'
      });
    } catch (previewError) {
      logImageProcessing('PreviewError', { 
        error: previewError instanceof Error ? previewError.message : String(previewError),
        fileName: file.name
      });
    }
  } catch (error) {
    logImageProcessing('Error', { 
      error: error instanceof Error ? error.message : String(error),
      fileName: file.name
    });
    // Continue with original file if optimization fails
  }
  
  const processingTime = performance.now() - startTime;
  logImageProcessing('Complete', { 
    processingTimeMs: processingTime.toFixed(0),
    success: !!optimizedFile,
    hasPreview: !!previewFile,
    fileName: file.name
  });
  
  return {
    originalFile: file,
    optimizedFile: optimizedFile,
    previewFile: previewFile,
    originalSize: file.size,
    optimizedSize: optimizedFile.size,
    previewSize: previewFile?.size
  };
}

/**
 * Uploads a processed image to Supabase storage
 * @param processedImage The processed image data
 * @param storageBucket Storage bucket name
 * @param storagePath Path within the bucket
 * @returns URLs for the uploaded files
 */
export async function uploadProcessedImage(
  processedImage: ProcessedImage,
  storageBucket: string,
  storagePath: string = ""
): Promise<{ originalUrl: string; previewUrl?: string }> {
  logImageProcessing('Upload', { 
    bucket: storageBucket, 
    path: storagePath,
    hasPreview: !!processedImage.previewFile,
    fileName: processedImage.originalFile.name
  });
  
  try {
    // Generate unique filename base
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const fileExt = processedImage.optimizedFile.name.split('.').pop();
    const fileName = `${storagePath}${uniqueId}.${fileExt}`;
    
    // Upload optimized original
    const { data: originalData, error: originalError } = await supabase.storage
      .from(storageBucket)
      .upload(fileName, processedImage.optimizedFile, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (originalError) {
      logImageProcessing('UploadError', { 
        error: originalError.message,
        fileName,
        bucket: storageBucket
      });
      throw originalError;
    }
    
    // Get public URL for original
    const { data: { publicUrl: originalUrl } } = supabase.storage
      .from(storageBucket)
      .getPublicUrl(fileName);
    
    // Upload preview if available
    let previewUrl = undefined;
    if (processedImage.previewFile) {
      const previewFileName = `${storagePath}${uniqueId}-preview.webp`;
      
      const { error: previewError } = await supabase.storage
        .from(storageBucket)
        .upload(previewFileName, processedImage.previewFile, {
          cacheControl: '3600',
          contentType: 'image/webp',
          upsert: false
        });
        
      if (!previewError) {
        const { data: { publicUrl: previewPublicUrl } } = supabase.storage
          .from(storageBucket)
          .getPublicUrl(previewFileName);
          
        previewUrl = previewPublicUrl;
        logImageProcessing('PreviewUploaded', { 
          previewFileName,
          previewUrl,
          originalUrl
        });
      } else {
        logImageProcessing('PreviewUploadError', { 
          error: previewError.message,
          previewFileName,
          bucket: storageBucket
        });
      }
    }
    
    logImageProcessing('UploadComplete', { 
      originalUrl, 
      hasPreview: !!previewUrl
    });
    
    return { originalUrl, previewUrl };
  } catch (error) {
    logImageProcessing('UploadFailed', { 
      error: error instanceof Error ? error.message : String(error),
      fileName: processedImage.originalFile.name,
      bucket: storageBucket
    });
    throw error;
  }
}

/**
 * Verify if preview generation was successful for a product
 * @param productId The product ID to check
 * @returns Promise with verification result
 */
export async function verifyProductPreviewGeneration(productId: string): Promise<{
  success: boolean;
  hasPreview: boolean;
  totalImages: number;
  imagesWithPreview: number;
}> {
  try {
    logImageProcessing('VerifyStart', { productId });
    
    // Get all images for the product
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('id, url, preview_url')
      .eq('product_id', productId);
      
    if (imagesError) {
      logImageProcessing('VerifyError', { 
        productId, 
        error: imagesError.message
      });
      throw imagesError;
    }
    
    // Get product has_preview flag
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, has_preview')
      .eq('id', productId)
      .single();
      
    if (productError) {
      logImageProcessing('VerifyProductError', { 
        productId, 
        error: productError.message
      });
    }
    
    const totalImages = images?.length || 0;
    const imagesWithPreview = images?.filter(img => !!img.preview_url).length || 0;
    const hasPreview = product?.has_preview || false;
    const shouldHavePreview = imagesWithPreview > 0;
    
    // Log the discrepancy if any
    if (hasPreview !== shouldHavePreview) {
      logImageProcessing('VerifyDiscrepancy', { 
        productId,
        hasPreviewFlag: hasPreview,
        shouldHavePreview,
        totalImages,
        imagesWithPreview
      });
    }
    
    // Ensure the has_preview flag is set correctly in the database
    if (hasPreview !== shouldHavePreview) {
      await updateProductHasPreviewFlag(productId);
    }
    
    logImageProcessing('VerifyComplete', { 
      productId,
      totalImages,
      imagesWithPreview,
      hasPreview: shouldHavePreview
    });
    
    return {
      success: true,
      hasPreview: shouldHavePreview,
      totalImages,
      imagesWithPreview
    };
  } catch (error) {
    logImageProcessing('VerifyFailed', { 
      productId, 
      error: error instanceof Error ? error.message : String(error)
    });
    return {
      success: false,
      hasPreview: false,
      totalImages: 0,
      imagesWithPreview: 0
    };
  }
}

/**
 * Update the has_preview flag for a product
 * @param productId The product ID to update
 */
export async function updateProductHasPreviewFlag(productId: string): Promise<boolean> {
  try {
    logImageProcessing('UpdateFlag', { productId });
    
    const { data, error } = await supabase.rpc('update_product_has_preview_flag', { 
      p_product_id: productId 
    });
    
    if (error) {
      logImageProcessing('UpdateFlagError', { 
        productId, 
        error: error.message 
      });
      return false;
    }
    
    logImageProcessing('UpdatedFlag', { productId, success: true });
    return true;
  } catch (error) {
    logImageProcessing('UpdateFlagException', { 
      productId, 
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

/**
 * Mass update has_preview flags for existing products
 * @param limit Maximum number of products to process (default: 50)
 * @returns Promise with results of the operation
 */
export async function massUpdateProductPreviewFlags(limit: number = 50): Promise<{
  processed: number;
  updated: number;
  failed: number;
}> {
  try {
    logImageProcessing('MassUpdate', { limit });
    
    // Get products to process
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .limit(limit);
      
    if (productsError) {
      logImageProcessing('MassUpdateProductsError', { 
        error: productsError.message,
        limit
      });
      throw productsError;
    }
    
    let updated = 0;
    let failed = 0;
    
    // Process each product
    for (const product of products || []) {
      try {
        const result = await verifyProductPreviewGeneration(product.id);
        if (result.success && result.hasPreview) {
          updated++;
        } else {
          failed++;
        }
      } catch (error) {
        logImageProcessing('MassUpdateProductError', { 
          productId: product.id, 
          error: error instanceof Error ? error.message : String(error)
        });
        failed++;
      }
    }
    
    const results = {
      processed: products?.length || 0,
      updated,
      failed
    };
    
    logImageProcessing('MassUpdateComplete', results);
    return results;
  } catch (error) {
    logImageProcessing('MassUpdateFailed', { 
      error: error instanceof Error ? error.message : String(error)
    });
    return {
      processed: 0,
      updated: 0,
      failed: 1
    };
  }
}

/**
 * Manually trigger preview generation for a product by calling the Edge Function
 * @param productId The product ID to generate previews for
 */
export async function generateProductPreviews(productId: string): Promise<{
  success: boolean;
  message: string;
  updatedImages?: number;
  totalImages?: number;
}> {
  try {
    logImageProcessing('GenerateStart', { productId });
    
    const { data, error } = await supabase.functions.invoke('generate-preview', {
      body: { action: 'verify_product', productId }
    });
    
    if (error) {
      logImageProcessing('GenerateError', { 
        productId, 
        error: error.message 
      });
      return {
        success: false,
        message: `Ошибка вызова функции: ${error.message}`
      };
    }
    
    logImageProcessing('GenerateComplete', { 
      productId, 
      response: data
    });
    
    if (data.success) {
      return {
        success: true,
        message: data.message,
        updatedImages: data.updatedImages,
        totalImages: data.totalImages
      };
    } else {
      return {
        success: false,
        message: data.message
      };
    }
  } catch (error) {
    logImageProcessing('GenerateException', { 
      productId, 
      error: error instanceof Error ? error.message : String(error)
    });
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
