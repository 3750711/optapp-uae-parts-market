
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";

// Set up CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

// Response helper function
function responseWithCors(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Image processing and optimization functions
async function fetchAndOptimizeImage(imageUrl: string, maxSize: number): Promise<{data: Blob, type: string} | null> {
  try {
    console.log(`Fetching image: ${imageUrl}`);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const originalBlob = await response.blob();
    const originalSize = originalBlob.size;
    console.log(`Original image size: ${originalSize / 1024} KB`);

    if (originalSize < maxSize) {
      console.log(`Image already smaller than target size (${maxSize / 1024} KB), returning as is.`);
      return { data: originalBlob, type: contentType };
    }

    // For simplicity, we'll just return the original image for now
    // In a production environment, you would implement actual image optimization here
    // But this requires more complex image manipulation libraries
    // which are challenging to use within Deno/Edge functions
    
    // For now, let's just simulate that we're optimizing
    console.log(`Would optimize image to under ${maxSize / 1024} KB`);
    return { data: originalBlob, type: contentType };
  } catch (error) {
    console.error(`Error processing image: ${error}`);
    return null;
  }
}

// Process specific products in batches
async function processProductImageBatch(
  products: any[],
  batchSize: number,
  startIdx: number = 0,
  maxImages: number = 100
): Promise<{processed: number, totalImages: number, errors: any[]}> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const errors: any[] = [];
  let processedCount = 0;
  let totalImages = 0;

  // Process a small batch of products to avoid timeout issues
  const batchToProcess = products.slice(startIdx, startIdx + batchSize);
  console.log(`Processing batch of ${batchToProcess.length} products starting at index ${startIdx}`);

  for (const product of batchToProcess) {
    try {
      // Get product images that don't have preview URLs yet
      const { data: images, error: imagesError } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', product.id)
        .is('preview_url', null);

      if (imagesError) {
        console.error(`Error fetching images for product ${product.id}: ${imagesError.message}`);
        errors.push({ productId: product.id, error: imagesError.message });
        continue;
      }

      if (!images || images.length === 0) {
        console.log(`No images without previews found for product ${product.id}`);
        continue;
      }

      totalImages += images.length;
      
      // Limit number of images processed to avoid timeout
      const imagesToProcess = images.slice(0, maxImages);
      console.log(`Processing ${imagesToProcess.length} images for product ${product.id}`);

      for (const image of imagesToProcess) {
        try {
          // Extract filename from URL
          const urlParts = image.url.split('/');
          const filename = urlParts[urlParts.length - 1];
          
          // Skip if it's already a preview image
          if (filename.includes('-preview')) {
            console.log(`Skipping existing preview image: ${filename}`);
            continue;
          }
          
          // Create preview filename
          const filenameParts = filename.split('.');
          const extension = filenameParts.pop() || 'jpg';
          const baseName = filenameParts.join('.');
          const previewFilename = `${baseName}-preview.${extension}`;

          // Determine which bucket the image is in
          let bucket = 'product-images';
          if (image.url.includes('/order-images/')) {
            bucket = 'order-images';
          }

          // Optimize the image
          const optimizedImage = await fetchAndOptimizeImage(image.url, 200 * 1024); // 200KB target
          if (!optimizedImage) {
            console.error(`Failed to optimize image ${image.id}`);
            errors.push({ imageId: image.id, error: 'Image optimization failed' });
            continue;
          }

          // Upload the preview image
          const { error: uploadError, data: uploadData } = await supabase.storage
            .from(bucket)
            .upload(previewFilename, optimizedImage.data, {
              contentType: optimizedImage.type,
              cacheControl: '3600',
              upsert: true
            });

          if (uploadError) {
            console.error(`Failed to upload preview for ${image.id}: ${uploadError.message}`);
            errors.push({ imageId: image.id, error: uploadError.message });
            continue;
          }

          // Get public URL for the uploaded preview image
          const previewUrl = supabase.storage
            .from(bucket)
            .getPublicUrl(previewFilename).data.publicUrl;

          // Update the product_images record with the preview URL
          const { error: updateError } = await supabase
            .from('product_images')
            .update({ preview_url: previewUrl })
            .eq('id', image.id);

          if (updateError) {
            console.error(`Failed to update preview URL for ${image.id}: ${updateError.message}`);
            errors.push({ imageId: image.id, error: updateError.message });
            continue;
          }

          console.log(`Successfully processed image ${image.id}, preview URL: ${previewUrl}`);
          processedCount++;
        } catch (imageError) {
          console.error(`Error processing image ${image.id}: ${imageError}`);
          errors.push({ imageId: image.id, error: String(imageError) });
        }
      }
    } catch (productError) {
      console.error(`Error processing product ${product.id}: ${productError}`);
      errors.push({ productId: product.id, error: String(productError) });
    }
  }

  return { processed: processedCount, totalImages, errors };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return responseWithCors({ error: 'Method not allowed' }, 405);
    }
    
    // Verify that the request is from an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return responseWithCors({ error: 'Unauthorized - missing auth header' }, 401);
    }
    
    // Create Supabase client with user's JWT
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });
    
    // Check if user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return responseWithCors({ error: 'Unauthorized - invalid auth token' }, 401);
    }
    
    // Verify admin status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();
      
    if (profileError || !profile || profile.user_type !== 'admin') {
      return responseWithCors({ error: 'Unauthorized - admin access required' }, 403);
    }
    
    // Parse request body
    const requestData = await req.json();
    const { batchSize = 10, startIndex = 0, limit = 100 } = requestData;
    
    // Get products that need preview generation
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Query for products that have images without preview URLs
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (productsError) {
      console.error(`Error fetching products: ${productsError.message}`);
      return responseWithCors({ error: `Failed to fetch products: ${productsError.message}` }, 500);
    }
    
    if (!products || products.length === 0) {
      return responseWithCors({ message: 'No products found to process' });
    }
    
    // Process the images
    const result = await processProductImageBatch(products, batchSize, startIndex);
    
    // Return successful response with stats
    return responseWithCors({
      message: 'Preview generation process completed',
      stats: {
        totalProducts: products.length,
        processedBatch: {
          start: startIndex,
          size: Math.min(batchSize, products.length - startIndex),
        },
        processed: result.processed,
        totalImages: result.totalImages,
        errors: result.errors.length,
        hasMoreProducts: startIndex + batchSize < products.length
      },
      errors: result.errors.length > 0 ? result.errors : undefined,
      nextBatchIndex: startIndex + batchSize < products.length ? startIndex + batchSize : null
    });
    
  } catch (error) {
    console.error(`Unhandled error: ${error}`);
    return responseWithCors({ error: `Internal server error: ${error}` }, 500);
  }
});
