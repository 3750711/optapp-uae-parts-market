
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

// Helper to fetch and resize images using Deno-compatible libraries
async function fetchAndResize(imageUrl: string, maxWidth = 400, quality = 0.7): Promise<Uint8Array | null> {
  try {
    console.log("Fetching image:", imageUrl);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status}`);
      return null;
    }
    
    const imageBuffer = await response.arrayBuffer();
    console.log(`Image fetched: ${imageBuffer.byteLength} bytes`);
    
    // For JPEGs and PNGs, use the deno_image library to resize
    try {
      // Attempt to resize the image (this supports various formats)
      const resizedImage = await resize(new Uint8Array(imageBuffer), {
        width: maxWidth,
      });
      
      console.log(`Preview generated: ${resizedImage.byteLength} bytes`);
      return resizedImage;
    } catch (resizeError) {
      console.error("Error resizing image:", resizeError);
      // If resizing fails, return the original image
      return new Uint8Array(imageBuffer);
    }
  } catch (error) {
    console.error("Error in fetchAndResize:", error);
    return null;
  }
}

async function generatePreviewUrl(imageUrl: string, productId: string): Promise<string | null> {
  try {
    if (!imageUrl) return null;
    
    // Skip if already a preview
    if (imageUrl.includes('-preview.')) {
      console.log("Already a preview image:", imageUrl);
      return imageUrl;
    }
    
    // Generate preview image
    const resizedImageData = await fetchAndResize(imageUrl);
    if (!resizedImageData) return null;
    
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
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(bucketPath)
      .upload(previewFileName, resizedImageData, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true,
      });
    
    if (uploadError) {
      console.error("Error uploading preview:", uploadError);
      return null;
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase
      .storage
      .from(bucketPath)
      .getPublicUrl(previewFileName);
    
    console.log("Preview URL generated:", publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error generating preview:", error);
    return null;
  }
}

async function processImageBatch(batchSize = 10) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Get images without preview URL
  const { data: images, error } = await supabase
    .from('product_images')
    .select('id, url, product_id, preview_url')
    .is('preview_url', null)
    .limit(batchSize);
  
  if (error) {
    console.error("Error fetching images:", error);
    return { processed: 0, success: 0 };
  }
  
  console.log(`Processing ${images.length} images`);
  let successCount = 0;
  
  // Process each image
  for (const image of images) {
    // Проверяем и обрабатываем только действительные URL-адреса
    if (!image.url || typeof image.url !== 'string' || !image.url.startsWith('http')) {
      console.warn(`Invalid URL for image ${image.id}: ${image.url}`);
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
        console.error(`Error updating image ${image.id}:`, updateError);
      } else {
        successCount++;
        console.log(`Updated image ${image.id} with preview URL`);
        
        // Update the has_preview flag in the product table
        try {
          await supabase
            .rpc('update_product_has_preview_flag', { 
              p_product_id: image.product_id 
            });
        } catch (rpcError) {
          console.warn(`Failed to update has_preview flag for product ${image.product_id}:`, rpcError);
        }
      }
    }
  }
  
  return {
    processed: images.length,
    success: successCount,
    remaining: 0, // Will be calculated in the handler
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request
    const { action, batchSize = 10, imageId, productId, productIds, limit } = await req.json();
    
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
          return new Response(
            JSON.stringify({ error: 'Failed to update image record' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        // Update the has_preview flag in the product table
        try {
          await supabase
            .rpc('update_product_has_preview_flag', { 
              p_product_id: image.product_id 
            });
        } catch (rpcError) {
          console.warn(`Failed to update has_preview flag for product ${image.product_id}:`, rpcError);
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
      const { data: images, error } = await supabase
        .from('product_images')
        .select('id, url, product_id')
        .eq('product_id', productId)
        .is('preview_url', null);
      
      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch product images' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      let successCount = 0;
      for (const image of images || []) {
        // Проверяем URL перед обработкой
        if (!image.url || typeof image.url !== 'string' || !image.url.startsWith('http')) {
          console.warn(`Invalid URL for image ${image.id}: ${image.url}`);
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
          }
        }
      }
      
      // Update the has_preview flag in the product table if at least one preview was created
      if (successCount > 0) {
        try {
          await supabase
            .rpc('update_product_has_preview_flag', { 
              p_product_id: productId 
            });
        } catch (rpcError) {
          console.warn(`Failed to update has_preview flag for product ${productId}:`, rpcError);
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          processed: images?.length || 0, 
          successCount 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    else if (action === 'regenerate_previews') {
      // Эндпоинт для перегенерации превью для всех изображений, включая те, у которых уже есть превью
      const actualLimit = limit || 10;
      
      let query = supabase
        .from('product_images')
        .select('id, url, product_id');
      
      // Если указаны определенные ID продуктов, фильтруем по ним
      if (productIds && Array.isArray(productIds) && productIds.length > 0) {
        query = query.in('product_id', productIds);
      }
      
      // Ограничиваем количество записей
      const { data: images, error } = await query.limit(actualLimit);
      
      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch images', details: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      console.log(`Processing ${images?.length || 0} images for regeneration`);
      let successCount = 0;
      const processedProductIds = new Set();
      
      for (const image of images || []) {
        // Проверяем URL перед обработкой
        if (!image.url || typeof image.url !== 'string' || !image.url.startsWith('http')) {
          console.warn(`Invalid URL for image ${image.id}: ${image.url}`);
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
          }
        }
      }
      
      // Update the has_preview flag for all processed products
      for (const productId of processedProductIds) {
        try {
          await supabase
            .rpc('update_product_has_preview_flag', { 
              p_product_id: productId 
            });
        } catch (rpcError) {
          console.warn(`Failed to update has_preview flag for product ${productId}:`, rpcError);
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
    else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
