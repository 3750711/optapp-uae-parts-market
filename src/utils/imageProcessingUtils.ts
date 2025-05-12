
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
        
        // CRITICAL FIX: Make sure we update the database with the preview URL - IMMEDIATE DB UPDATE
        try {
          // Immediately try to find and update product images with this URL
          const { data: productImages, error: productError } = await supabase
            .from('product_images')
            .select('id, product_id')
            .eq('url', originalUrl);
            
          if (!productError && productImages && productImages.length > 0) {
            const imageId = productImages[0].id;
            const productId = productImages[0].product_id;
            
            // Explicitly update the preview_url field
            const { error: updateError } = await supabase
              .from('product_images')
              .update({ preview_url: previewUrl })
              .eq('id', imageId);
              
            if (updateError) {
              logImageProcessing('PreviewDbUpdateError', { 
                error: updateError.message,
                imageId,
                originalUrl,
                previewUrl
              });
            } else {
              logImageProcessing('PreviewDbUpdated', { 
                imageId,
                productId,
                originalUrl,
                previewUrl
              });
              
              // Immediately update the product's has_preview flag
              if (productId) {
                await updateProductHasPreviewFlag(productId);
                logImageProcessing('ProductFlagUpdated', { productId });
              }
            }
          } else {
            // Check if it's an order image instead
            const { data: orderImages, error: orderError } = await supabase
              .from('order_images')
              .select('id')
              .eq('url', originalUrl);
              
            if (!orderError && orderImages && orderImages.length > 0) {
              // We found an order image with this URL, update its preview_url field
              const { error: updateError } = await supabase
                .from('order_images')
                .update({ preview_url: previewUrl })
                .eq('url', originalUrl);
                
              if (updateError) {
                logImageProcessing('OrderPreviewDbUpdateError', { 
                  error: updateError.message,
                  originalUrl,
                  previewUrl
                });
              } else {
                logImageProcessing('OrderPreviewDbUpdated', { 
                  originalUrl,
                  previewUrl
                });
              }
            } else {
              // If no product or order image was found yet, it might be inserted later
              // Let's log this situation for debugging
              logImageProcessing('NoImageFoundForUpdate', { 
                originalUrl, 
                previewUrl,
                productError: productError?.message,
                orderError: orderError?.message
              });
            }
          }
        } catch (dbError) {
          logImageProcessing('PreviewDbUpdateException', { 
            error: dbError instanceof Error ? dbError.message : String(dbError),
            originalUrl,
            previewUrl
          });
        }
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
    
    // First, check if product has any images with preview_url
    const { data: images, error: checkError } = await supabase
      .from('product_images')
      .select('id, preview_url')
      .eq('product_id', productId);
      
    if (checkError) {
      logImageProcessing('CheckImagesError', { 
        productId, 
        error: checkError.message 
      });
      return false;
    }
    
    const hasPreviewImages = images && images.some(img => !!img.preview_url);
    
    // Directly update the product's has_preview flag based on our check
    const { error: updateError } = await supabase
      .from('products')
      .update({ has_preview: hasPreviewImages })
      .eq('id', productId);
    
    if (updateError) {
      logImageProcessing('DirectUpdateFlagError', { 
        productId, 
        error: updateError.message,
        hasPreviewImages
      });
      return false;
    }
    
    // Try the RPC function as backup
    try {
      const { data, error } = await supabase.rpc('update_product_has_preview_flag', { 
        p_product_id: productId 
      });
      
      if (error) {
        logImageProcessing('UpdateFlagRpcError', { 
          productId, 
          error: error.message 
        });
      }
    } catch (rpcError) {
      logImageProcessing('UpdateFlagRpcException', { 
        productId, 
        error: rpcError instanceof Error ? rpcError.message : String(rpcError)
      });
    }
    
    logImageProcessing('UpdatedFlag', { 
      productId, 
      success: true, 
      hasPreviewImages 
    });
    
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
    
    // Double-check database update after function call
    setTimeout(async () => {
      try {
        // Check if preview URLs were properly set in the database
        const { data: images } = await supabase
          .from('product_images')
          .select('id, url, preview_url')
          .eq('product_id', productId);
          
        const imagesWithPreview = images?.filter(img => !!img.preview_url)?.length || 0;
        const totalImages = images?.length || 0;
        
        logImageProcessing('PostGenerateCheck', { 
          productId, 
          totalImages, 
          imagesWithPreview
        });
        
        // If missing previews, try direct repair
        if (imagesWithPreview < totalImages) {
          await checkAndRepairPreviewUrls(productId);
        }
        
        // Ensure flag is correct regardless
        await updateProductHasPreviewFlag(productId);
        
      } catch (checkError) {
        logImageProcessing('PostGenerateCheckError', { 
          productId, 
          error: checkError instanceof Error ? checkError.message : String(checkError)
        });
      }
    }, 2000); // Wait 2 seconds before checking
    
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

/**
 * Check and repair preview URLs for a product
 * @param productId The product ID to check and repair
 */
export async function checkAndRepairPreviewUrls(productId: string): Promise<{
  success: boolean;
  message: string;
  repaired: number;
}> {
  try {
    logImageProcessing('RepairStart', { productId });
    
    // Get all images for the product
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('id, url, preview_url')
      .eq('product_id', productId);
      
    if (imagesError) {
      logImageProcessing('RepairError', { 
        productId, 
        error: imagesError.message
      });
      throw imagesError;
    }
    
    if (!images || images.length === 0) {
      return {
        success: false,
        message: "Не найдены изображения для продукта",
        repaired: 0
      };
    }
    
    let repairedCount = 0;
    
    // Try to repair each image without preview
    for (const image of images) {
      if (!image.preview_url && image.url) {
        try {
          // Extract the filename from the URL
          const urlParts = image.url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
          
          // Try to construct a preview URL based on the original URL
          const baseUrl = image.url.substring(0, image.url.lastIndexOf('/') + 1);
          const possiblePreviewUrl = `${baseUrl}${fileNameWithoutExt}-preview.webp`;
          
          // First check if the preview file actually exists
          const bucket = extractBucketFromUrl(image.url);
          const previewPath = extractPathFromUrl(possiblePreviewUrl);
          
          if (bucket && previewPath) {
            // Try to get file info to check if preview exists
            const { data: fileData, error: fileError } = await supabase
              .storage
              .from(bucket)
              .getPublicUrl(previewPath);
              
            if (!fileError) {
              // Update the database with the preview URL
              const { error: updateError } = await supabase
                .from('product_images')
                .update({ preview_url: possiblePreviewUrl })
                .eq('id', image.id);
                
              if (!updateError) {
                repairedCount++;
                logImageProcessing('PreviewRepaired', {
                  imageId: image.id,
                  originalUrl: image.url,
                  newPreviewUrl: possiblePreviewUrl
                });
              } else {
                logImageProcessing('RepairUpdateError', {
                  imageId: image.id,
                  error: updateError.message
                });
              }
            } else {
              logImageProcessing('PreviewFileNotFound', {
                imageId: image.id,
                previewPath,
                bucket
              });
              
              // If preview file doesn't exist, try to generate it via Edge Function
              try {
                await supabase.functions.invoke('generate-preview', {
                  body: { 
                    action: 'process_single',
                    imageId: image.id
                  }
                });
                
                logImageProcessing('RegenerationTriggered', {
                  imageId: image.id,
                  originalUrl: image.url
                });
              } catch (generateError) {
                logImageProcessing('RegenerationError', {
                  imageId: image.id,
                  error: generateError instanceof Error ? generateError.message : String(generateError)
                });
              }
            }
          }
        } catch (repairError) {
          logImageProcessing('ImageRepairError', {
            imageId: image.id,
            error: repairError instanceof Error ? repairError.message : String(repairError)
          });
        }
      }
    }
    
    // Update the product has_preview flag
    await updateProductHasPreviewFlag(productId);
    
    return {
      success: true,
      message: `Восстановлено ${repairedCount} из ${images.length} изображений`,
      repaired: repairedCount
    };
  } catch (error) {
    logImageProcessing('RepairFailed', { 
      productId, 
      error: error instanceof Error ? error.message : String(error)
    });
    return {
      success: false,
      message: `Ошибка: ${error instanceof Error ? error.message : String(error)}`,
      repaired: 0
    };
  }
}

/**
 * Extract bucket name from URL
 */
function extractBucketFromUrl(url: string): string | null {
  try {
    if (url.includes('/product-images/')) {
      return 'product-images';
    } else if (url.includes('/order-images/')) {
      return 'order-images';
    }
    return null;
  } catch (error) {
    console.error("Failed to extract bucket from URL:", url, error);
    return null;
  }
}

/**
 * Extract storage path from URL
 */
function extractPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Find the bucket name in the path
    const bucketIndex = pathParts.findIndex(p => 
      p === 'product-images' || p === 'order-images'
    );
    
    if (bucketIndex >= 0 && bucketIndex < pathParts.length - 1) {
      // Return everything after the bucket name
      return pathParts.slice(bucketIndex + 1).join('/');
    }
    
    return null;
  } catch (error) {
    console.error("Failed to extract path from URL:", url, error);
    return null;
  }
}

/**
 * Force check and update all previews for a product with verbose logging
 * @param productId The product ID to process
 */
export async function forceUpdateProductPreviews(productId: string): Promise<{
  success: boolean;
  message: string;
  details: any;
}> {
  try {
    logImageProcessing('ForceUpdateStart', { productId });
    
    // 1. First check database state
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('id, url, preview_url')
      .eq('product_id', productId);
      
    if (imagesError) {
      throw new Error(`Failed to fetch images: ${imagesError.message}`);
    }
    
    if (!images || images.length === 0) {
      return {
        success: false,
        message: "Нет изображений для этого продукта",
        details: { productId }
      };
    }
    
    const details = {
      totalImages: images.length,
      initialPreviewCount: images.filter(img => !!img.preview_url).length,
      imageDetails: images.map(img => ({
        id: img.id,
        hasPreview: !!img.preview_url
      })),
      steps: [] as any[]
    };
    
    // 2. Call edge function to generate previews
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke('generate-preview', {
      body: { 
        action: 'verify_product',
        productId
      }
    });
    
    details.steps.push({
      step: "EdgeFunctionCall",
      success: !edgeError,
      error: edgeError?.message,
      response: edgeData
    });
    
    if (edgeError) {
      logImageProcessing('ForceUpdateEdgeError', { 
        productId, 
        error: edgeError.message 
      });
    }
    
    // 3. Wait a bit then check database again
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: updatedImages, error: updatedImagesError } = await supabase
      .from('product_images')
      .select('id, url, preview_url')
      .eq('product_id', productId);
      
    if (updatedImagesError) {
      throw new Error(`Failed to fetch updated images: ${updatedImagesError.message}`);
    }
    
    details.steps.push({
      step: "PostEdgeCheck",
      success: !updatedImagesError,
      error: updatedImagesError?.message,
      previewCount: updatedImages?.filter(img => !!img.preview_url).length || 0
    });
    
    // 4. Manual repair attempt if needed
    if (updatedImages) {
      const missingPreviews = updatedImages.filter(img => !img.preview_url);
      if (missingPreviews.length > 0) {
        const repairResult = await checkAndRepairPreviewUrls(productId);
        details.steps.push({
          step: "ManualRepair",
          success: repairResult.success,
          repaired: repairResult.repaired,
          message: repairResult.message
        });
      }
    }
    
    // 5. Final check and flag update
    await updateProductHasPreviewFlag(productId);
    
    const { data: finalImages, error: finalImagesError } = await supabase
      .from('product_images')
      .select('id, url, preview_url')
      .eq('product_id', productId);
      
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, has_preview')
      .eq('id', productId)
      .single();
      
    details.steps.push({
      step: "FinalCheck",
      success: !finalImagesError && !productError,
      finalPreviewCount: finalImages?.filter(img => !!img.preview_url).length || 0,
      hasPreviewFlag: product?.has_preview,
      errors: {
        images: finalImagesError?.message,
        product: productError?.message
      }
    });
    
    const finalPreviewCount = finalImages?.filter(img => !!img.preview_url).length || 0;
    const success = finalPreviewCount === (finalImages?.length || 0);
    
    logImageProcessing('ForceUpdateComplete', { 
      productId,
      success,
      initialPreviewCount: details.initialPreviewCount,
      finalPreviewCount,
      totalImages: details.totalImages
    });
    
    return {
      success,
      message: success 
        ? `Успешно обновлены все ${finalPreviewCount} из ${details.totalImages} превью` 
        : `Обновлено только ${finalPreviewCount} из ${details.totalImages} превью`,
      details
    };
  } catch (error) {
    logImageProcessing('ForceUpdateException', { 
      productId, 
      error: error instanceof Error ? error.message : String(error)
    });
    
    return {
      success: false,
      message: `Ошибка при форсированном обновлении: ${error instanceof Error ? error.message : String(error)}`,
      details: { error: String(error) }
    };
  }
}
