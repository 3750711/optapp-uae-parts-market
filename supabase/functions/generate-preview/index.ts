
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode, encode } from "https://deno.land/x/pngs@0.1.1/mod.ts";
import { resize } from "https://deno.land/x/deno_image@0.0.4/mod.ts";

const supabaseUrl = "https://vfiylfljiixqkjfqubyq.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Logs detailed information for the preview generation process
 */
function logOperation(stage: string, details: Record<string, any>) {
  console.log(`[Preview:${stage}]`, JSON.stringify(details));
}

// Helper to fetch and resize images using Deno-compatible libraries
async function fetchAndResize(imageUrl: string, maxWidth = 400, quality = 0.7): Promise<Uint8Array | null> {
  try {
    logOperation("FetchStart", { imageUrl });
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      logOperation("FetchError", { 
        status: response.status, 
        statusText: response.statusText,
        imageUrl 
      });
      return null;
    }
    
    const imageBuffer = await response.arrayBuffer();
    logOperation("Downloaded", { bytes: imageBuffer.byteLength, imageUrl });
    
    // Target size approximately 200KB
    try {
      // Attempt to resize the image (this supports various formats)
      const resizedImage = await resize(new Uint8Array(imageBuffer), {
        width: maxWidth,
      });
      
      logOperation("Resized", { 
        originalBytes: imageBuffer.byteLength, 
        resizedBytes: resizedImage.byteLength, 
        imageUrl,
        ratio: (resizedImage.byteLength / imageBuffer.byteLength).toFixed(2)
      });
      return resizedImage;
    } catch (resizeError) {
      logOperation("ResizeError", { 
        error: resizeError instanceof Error ? resizeError.message : String(resizeError),
        imageUrl,
        byteLength: imageBuffer.byteLength
      });
      // If resizing fails, return the original image
      return new Uint8Array(imageBuffer);
    }
  } catch (error) {
    logOperation("FetchAndResizeError", { 
      error: error instanceof Error ? error.message : String(error),
      imageUrl 
    });
    return null;
  }
}

async function generatePreviewUrl(imageUrl: string, productId: string): Promise<string | null> {
  try {
    const startTime = performance.now();
    
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
      logOperation("InvalidUrl", { 
        productId, 
        url: imageUrl || "undefined",
        type: typeof imageUrl
      });
      return null;
    }
    
    // Skip if already a preview
    if (imageUrl.includes('-preview.')) {
      logOperation("AlreadyPreview", { imageUrl, productId });
      return imageUrl;
    }
    
    // Generate preview image
    logOperation("ProcessingStarted", { imageUrl, productId });
    const resizedImageData = await fetchAndResize(imageUrl);
    
    if (!resizedImageData) {
      logOperation("NoResizedData", { imageUrl, productId });
      return null;
    }
    
    const processingTime = performance.now() - startTime;
    logOperation("ProcessingComplete", { 
      imageUrl, 
      productId, 
      timeMs: processingTime.toFixed(0),
      bytes: resizedImageData.byteLength
    });
    
    // Create file name for preview
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const fileNameWithoutExt = fileName.split('.')[0];
    const previewFileName = `${fileNameWithoutExt}-preview.webp`;
    
    // Determine path in storage
    const bucketPath = imageUrl.includes('/product-images/') ? 'product-images' : 'order-images';
    
    // Create supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Upload preview to storage
    const uploadStartTime = performance.now();
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(bucketPath)
      .upload(previewFileName, resizedImageData, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true,
      });
    
    if (uploadError) {
      logOperation("UploadError", { 
        error: uploadError.message, 
        previewFileName, 
        productId,
        bucket: bucketPath
      });
      return null;
    }
    
    const uploadTime = performance.now() - uploadStartTime;
    logOperation("Upload", { timeMs: uploadTime.toFixed(0), previewFileName, productId });
    
    // Get public URL
    const { data: publicUrlData } = supabase
      .storage
      .from(bucketPath)
      .getPublicUrl(previewFileName);
    
    // Important: Update the database with the preview URL
    try {
      const previewUrl = publicUrlData.publicUrl;
      
      // Find the image in the database
      const { data: imageData, error: imageError } = await supabase
        .from('product_images')
        .select('id')
        .eq('url', imageUrl)
        .limit(1);
        
      if (imageError) {
        logOperation("DbLookupError", { error: imageError.message, imageUrl, productId });
      } else if (imageData && imageData.length > 0) {
        // Update the preview_url in the database
        const { error: updateError } = await supabase
          .from('product_images')
          .update({ preview_url: previewUrl })
          .eq('id', imageData[0].id);
          
        if (updateError) {
          logOperation("DbUpdateError", { error: updateError.message, imageId: imageData[0].id, productId });
        } else {
          logOperation("DbUpdated", { imageId: imageData[0].id, productId, previewUrl });
        }
      } else {
        logOperation("ImageNotFound", { imageUrl, productId });
      }
    } catch (dbError) {
      logOperation("DbException", { 
        error: dbError instanceof Error ? dbError.message : String(dbError),
        imageUrl,
        productId
      });
    }
    
    logOperation("PreviewGenerated", { 
      previewUrl: publicUrlData.publicUrl, 
      originalUrl: imageUrl,
      productId
    });
    
    return publicUrlData.publicUrl;
  } catch (error) {
    logOperation("GeneratePreviewError", { 
      error: error instanceof Error ? error.message : String(error),
      imageUrl, 
      productId 
    });
    return null;
  }
}

async function processImageBatch(batchSize = 10) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Get images without preview URL
    const { data: images, error } = await supabase
      .from('product_images')
      .select('id, url, product_id, preview_url')
      .is('preview_url', null)
      .limit(batchSize);
    
    if (error) {
      logOperation("FetchError", { error: error.message, batchSize });
      return { processed: 0, success: 0 };
    }
    
    logOperation("BatchStart", { count: images?.length || 0, batchSize });
    let successCount = 0;
    const processedProductIds = new Set();
    
    // Process each image
    for (const image of images || []) {
      // Проверяем и обрабатываем только действительные URL-адреса
      if (!image.url || typeof image.url !== 'string' || !image.url.startsWith('http')) {
        logOperation("InvalidImageUrl", { imageId: image.id, url: image.url });
        continue;
      }

      const previewUrl = await generatePreviewUrl(image.url, image.product_id);
      
      if (previewUrl) {
        // Update the record with preview URL
        const { error: updateError } = await supabase
          .from('product_images')
          .update({ preview_url: previewUrl })
          .eq('id', image.id);
        
        if (updateError) {
          logOperation("UpdateError", { error: updateError.message, imageId: image.id });
        } else {
          successCount++;
          processedProductIds.add(image.product_id);
          logOperation("ImageUpdated", { 
            imageId: image.id, 
            productId: image.product_id,
            previewUrl
          });
          
          // Update the has_preview flag in the product table
          try {
            // First, check if there are any images with previews for this product
            const { data: productImages } = await supabase
              .from('product_images')
              .select('preview_url')
              .eq('product_id', image.product_id);
              
            const hasAnyPreviews = productImages?.some(img => !!img.preview_url) || false;
            
            // Update product directly
            const { error: updateProductError } = await supabase
              .from('products')
              .update({ has_preview: hasAnyPreviews })
              .eq('id', image.product_id);
              
            if (updateProductError) {
              logOperation("DirectFlagUpdateError", {
                error: updateProductError.message,
                productId: image.product_id
              });
              
              // Fallback to RPC function
              const { error: rpcError } = await supabase
                .rpc('update_product_has_preview_flag', { 
                  p_product_id: image.product_id 
                });
                
              if (rpcError) {
                logOperation("FlagUpdateError", { 
                  error: rpcError.message, 
                  productId: image.product_id 
                });
              } else {
                logOperation("FlagUpdatedViaRpc", { productId: image.product_id });
              }
            } else {
              logOperation("FlagUpdated", { 
                productId: image.product_id,
                hasPreview: hasAnyPreviews
              });
            }
          } catch (rpcError) {
            logOperation("FlagUpdateException", { 
              error: rpcError instanceof Error ? rpcError.message : String(rpcError), 
              productId: image.product_id 
            });
          }
        }
      }
    }
    
    logOperation("BatchComplete", { 
      processed: images?.length || 0, 
      success: successCount,
      uniqueProducts: processedProductIds.size
    });
    
    return {
      processed: images?.length || 0,
      success: successCount,
      remaining: 0, // Will be calculated in the handler
    };
  } catch (error) {
    logOperation("BatchProcessException", { 
      error: error instanceof Error ? error.message : String(error),
      batchSize
    });
    return {
      processed: 0,
      success: 0,
      remaining: 0
    };
  }
}

async function verifyAndFixProductPreviews(productId: string): Promise<{
  success: boolean;
  totalImages: number;
  updatedImages: number;
  message: string;
}> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get all images for this product
    const { data: images, error } = await supabase
      .from('product_images')
      .select('id, url, preview_url')
      .eq('product_id', productId);
      
    if (error) {
      logOperation("VerifyFetchError", { 
        error: error.message, 
        productId 
      });
      return {
        success: false,
        totalImages: 0,
        updatedImages: 0,
        message: `Failed to fetch images: ${error.message}`
      };
    }
    
    if (!images || images.length === 0) {
      logOperation("VerifyNoImages", { productId });
      return {
        success: false,
        totalImages: 0,
        updatedImages: 0,
        message: "No images found for this product"
      };
    }
    
    logOperation("VerifyStart", { 
      productId, 
      imageCount: images.length,
      imagesWithPreview: images.filter(img => !!img.preview_url).length
    });
    
    // Process any images without previews
    let updatedCount = 0;
    for (const image of images) {
      if (!image.preview_url && image.url) {
        const previewUrl = await generatePreviewUrl(image.url, productId);
        
        if (previewUrl) {
          // Update the record with preview URL
          const { error: updateError } = await supabase
            .from('product_images')
            .update({ preview_url: previewUrl })
            .eq('id', image.id);
            
          if (!updateError) {
            updatedCount++;
            logOperation("VerifyImageUpdated", { 
              imageId: image.id, 
              productId,
              previewUrl
            });
          } else {
            logOperation("VerifyUpdateError", { 
              error: updateError.message, 
              imageId: image.id, 
              productId 
            });
          }
        }
      }
    }
    
    // Update the product's has_preview flag
    let flagUpdateSuccess = false;
    try {
      // Direct update based on current state
      const hasAnyPreviews = (images.filter(img => !!img.preview_url).length + updatedCount) > 0;
      
      const { error: directUpdateError } = await supabase
        .from('products')
        .update({ has_preview: hasAnyPreviews })
        .eq('id', productId);
        
      if (directUpdateError) {
        logOperation("VerifyDirectUpdateError", {
          error: directUpdateError.message,
          productId
        });
        
        // Try RPC function as fallback
        const { error: rpcError } = await supabase
          .rpc('update_product_has_preview_flag', { 
            p_product_id: productId 
          });
          
        if (rpcError) {
          logOperation("VerifyFlagUpdateError", { 
            error: rpcError.message, 
            productId 
          });
        } else {
          flagUpdateSuccess = true;
          logOperation("VerifyFlagUpdatedViaRpc", { productId });
        }
      } else {
        flagUpdateSuccess = true;
        logOperation("VerifyFlagUpdated", { 
          productId,
          hasPreview: hasAnyPreviews
        });
      }
    } catch (rpcError) {
      logOperation("VerifyFlagUpdateException", { 
        error: rpcError instanceof Error ? rpcError.message : String(rpcError), 
        productId 
      });
    }
    
    // Final verification of database state
    const { data: verifyImages } = await supabase
      .from('product_images')
      .select('preview_url')
      .eq('product_id', productId);
      
    const { data: product } = await supabase
      .from('products')
      .select('has_preview')
      .eq('id', productId)
      .single();
      
    logOperation("VerifyComplete", { 
      productId, 
      totalImages: images.length,
      updatedImages: updatedCount,
      finalPreviewCount: verifyImages?.filter(img => !!img.preview_url).length || 0,
      hasPreviewFlag: product?.has_preview
    });
    
    return {
      success: true,
      totalImages: images.length,
      updatedImages: updatedCount,
      message: updatedCount > 0 
        ? `Generated previews for ${updatedCount} of ${images.length} images` 
        : "All images already have previews"
    };
  } catch (error) {
    logOperation("VerifyException", { 
      error: error instanceof Error ? error.message : String(error),
      productId 
    });
    return {
      success: false,
      totalImages: 0,
      updatedImages: 0,
      message: `Error during verification: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      logOperation("InvalidRequest", { 
        error: parseError instanceof Error ? parseError.message : String(parseError),
        method: req.method,
        url: req.url
      });
      
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }
    
    const { 
      action, 
      batchSize = 10, 
      imageId, 
      productId, 
      productIds, 
      limit 
    } = requestBody;
    
    logOperation("RequestReceived", { 
      action, 
      productId, 
      imageId,
      batchSize: batchSize || 10,
      productIdsCount: productIds?.length,
      limit
    });
    
    if (action === 'process_batch') {
      // Process a batch of images
      const result = await processImageBatch(batchSize);
      
      // Get count of remaining images
      const { count, error: countError } = await supabase
        .from('product_images')
        .select('*', { count: 'exact', head: true })
        .is('preview_url', null);
      
      if (!countError) {
        result.remaining = count || 0;
      }
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } 
    else if (action === 'process_single' && imageId) {
      // Process a single image
      const { data: image, error } = await supabase
        .from('product_images')
        .select('id, url, product_id')
        .eq('id', imageId)
        .single();
      
      if (error || !image) {
        logOperation("SingleImageNotFound", { imageId });
        return new Response(
          JSON.stringify({ error: 'Image not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }
      
      const previewUrl = await generatePreviewUrl(image.url, image.product_id);
      
      if (previewUrl) {
        // Update the record
        const { error: updateError } = await supabase
          .from('product_images')
          .update({ preview_url: previewUrl })
          .eq('id', image.id);
        
        if (updateError) {
          logOperation("SingleImageUpdateError", { 
            error: updateError.message,
            imageId: image.id,
            productId: image.product_id
          });
          
          return new Response(
            JSON.stringify({ error: 'Failed to update image record' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        // Update the has_preview flag in the product table
        try {
          // Direct update for better reliability
          const { data: product, error: productError } = await supabase
            .from('products')
            .update({ has_preview: true })
            .eq('id', image.product_id)
            .select('id')
            .single();
            
          if (!productError) {
            logOperation("SingleImageFlagUpdated", { 
              productId: image.product_id,
              imageId: image.id,
              directUpdate: true
            });
          } else {
            // Fallback to RPC
            await supabase
              .rpc('update_product_has_preview_flag', { 
                p_product_id: image.product_id 
              });
              
            logOperation("SingleImageFlagUpdated", { 
              productId: image.product_id,
              imageId: image.id,
              directUpdate: false
            });
          }
        } catch (rpcError) {
          logOperation("SingleImageFlagUpdateError", { 
            error: rpcError instanceof Error ? rpcError.message : String(rpcError),
            productId: image.product_id,
            imageId: image.id
          });
        }
        
        return new Response(
          JSON.stringify({ success: true, previewUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({ error: 'Failed to generate preview' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }
    else if (action === 'process_product' && productId) {
      // Process all images for a specific product
      const verifyResult = await verifyAndFixProductPreviews(productId);
      
      return new Response(
        JSON.stringify(verifyResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    else if (action === 'regenerate_previews') {
      // Endpoint for regenerating previews for all images, including those that already have previews
      const actualLimit = limit || 10;
      
      let query = supabase
        .from('product_images')
        .select('id, url, product_id');
      
      // Filter by specific product IDs if provided
      if (productIds && Array.isArray(productIds) && productIds.length > 0) {
        query = query.in('product_id', productIds);
      }
      
      // Limit the number of records
      const { data: images, error } = await query.limit(actualLimit);
      
      if (error) {
        logOperation("RegenerateFetchError", { 
          error: error.message,
          limit: actualLimit,
          productIdsCount: productIds?.length
        });
        
        return new Response(
          JSON.stringify({ error: 'Failed to fetch images', details: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      console.log(`Processing ${images?.length || 0} images for regeneration`);
      let successCount = 0;
      const processedProductIds = new Set();
      
      for (const image of images || []) {
        // Check URL before processing
        if (!image.url || typeof image.url !== 'string' || !image.url.startsWith('http')) {
          logOperation("RegenerateInvalidUrl", { 
            imageId: image.id, 
            url: image.url,
            productId: image.product_id
          });
          continue;
        }

        const previewUrl = await generatePreviewUrl(image.url, image.product_id);
        
        if (previewUrl) {
          // Update the record
          const { error: updateError } = await supabase
            .from('product_images')
            .update({ preview_url: previewUrl })
            .eq('id', image.id);
          
          if (!updateError) {
            successCount++;
            processedProductIds.add(image.product_id);
            logOperation("RegenerateSuccess", { 
              imageId: image.id,
              productId: image.product_id,
              previewUrl
            });
          } else {
            logOperation("RegenerateUpdateError", { 
              error: updateError.message,
              imageId: image.id,
              productId: image.product_id
            });
          }
        }
      }
      
      // Update the has_preview flag for all processed products
      for (const pid of processedProductIds) {
        try {
          // Direct update for reliability
          const { error: directUpdateError } = await supabase
            .from('products')
            .update({ has_preview: true })
            .eq('id', pid);
            
          if (directUpdateError) {
            // Fallback to RPC
            await supabase
              .rpc('update_product_has_preview_flag', { 
                p_product_id: pid 
              });
              
            logOperation("RegenerateFlagUpdatedViaRpc", { productId: pid });
          } else {
            logOperation("RegenerateFlagUpdated", { productId: pid });
          }
        } catch (rpcError) {
          logOperation("RegenerateFlagError", { 
            error: rpcError instanceof Error ? rpcError.message : String(rpcError),
            productId: pid
          });
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          processed: images?.length || 0, 
          successCount,
          productsUpdated: processedProductIds.size
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    else if (action === 'verify_product' && productId) {
      // Verify if a product has valid previews
      const result = await verifyAndFixProductPreviews(productId);
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    else {
      logOperation("InvalidAction", { action, productId, imageId });
      return new Response(
        JSON.stringify({ error: 'Invalid action or missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
  } catch (error) {
    logOperation("UnhandledError", { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error) 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
