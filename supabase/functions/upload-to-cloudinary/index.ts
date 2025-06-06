
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate NEW Cloudinary preview URL (400x300, auto:good, webp)
function getCloudinaryPreviewUrl(publicId: string): string {
  const cloudName = 'dcuziurrb';
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_400,h_300,c_fill,g_auto,q_auto:good,f_webp/${publicId}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Cloudinary upload function started (Direct Base64 Upload with NEW preview)');
    
    const { fileData, fileName, productId, publicId, createVariants = true, isVideo = false } = await req.json();
    
    console.log('📋 Request params:', {
      fileName: fileName || 'undefined',
      productId: productId || 'undefined',
      publicId: publicId || 'undefined',
      createVariants,
      isVideo,
      hasFileData: !!fileData
    });
    
    if (!fileData) {
      console.error('❌ No fileData provided');
      return new Response(
        JSON.stringify({ success: false, error: 'File data is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const cloudName = 'dcuziurrb';
    const apiKey = '647673934374161';
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');
    
    if (!apiSecret) {
      console.error('❌ CLOUDINARY_API_SECRET not found');
      throw new Error('Cloudinary API secret not configured');
    }

    console.log(`☁️ Uploading ${isVideo ? 'video' : 'image'} to Cloudinary with automatic transformations...`);
    
    // Generate timestamp and signature for Cloudinary API
    const timestamp = Math.round(Date.now() / 1000);
    
    // Different transformations for video and image
    let transformations, uploadEndpoint;
    
    if (isVideo) {
      // Video transformations: automatic quality, format optimization
      transformations = [
        'q_auto:low',     // Automatic quality optimization
        'f_auto',         // Automatic format selection (mp4/webm)
        'c_fill'          // Fill crop mode
      ].join(',');
      uploadEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
    } else {
      // Image transformations (existing)
      transformations = [
        'q_auto:low',     // Automatic quality optimization for smaller file size
        'f_auto',         // Automatic format selection (WebP/AVIF)
        'c_fill'          // Fill crop mode
      ].join(',');
      uploadEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    }
    
    const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}&transformation=${transformations}`;
    
    // Create signature using crypto
    const encoder = new TextEncoder();
    const data = encoder.encode(paramsToSign + apiSecret);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Upload main file with compression using base64 data
    const formData = new FormData();
    const dataPrefix = isVideo ? 'data:video/mp4;base64,' : 'data:image/jpeg;base64,';
    formData.append('file', `${dataPrefix}${fileData}`);
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', apiKey);
    formData.append('signature', signature);
    formData.append('transformation', transformations);

    const uploadResponse = await fetch(uploadEndpoint, {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`❌ Cloudinary ${isVideo ? 'video' : 'image'} upload failed:`, errorText);
      throw new Error(`Cloudinary upload failed: ${uploadResponse.status}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log(`✅ Main ${isVideo ? 'video' : 'image'} upload successful:`, {
      public_id: uploadResult.public_id,
      secure_url: uploadResult.secure_url,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
      width: uploadResult.width,
      height: uploadResult.height,
      duration: uploadResult.duration // For videos
    });

    const result = {
      success: true,
      cloudinaryUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      originalSize: uploadResult.bytes,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
      duration: uploadResult.duration, // Video duration in seconds
      variants: {}
    };

    // Create variants if requested (only for images for now)
    if (createVariants && !isVideo) {
      console.log('🎨 Creating NEW preview variant (20-25KB, 400x300)...');
      
      try {
        // Use NEW transformation URL for preview (400x300, auto:good, webp)
        const previewUrl = getCloudinaryPreviewUrl(uploadResult.public_id);
        
        result.variants.preview = {
          url: previewUrl,
          transformation: 'w_400,h_300,c_fill,g_auto,q_auto:good,f_webp',
          estimatedSize: 25000 // ~20-25KB
        };
        
        console.log('✅ NEW Preview variant created:', previewUrl);
      } catch (previewError) {
        console.error('⚠️ Preview variant creation failed:', previewError);
      }
    }

    // For videos, create thumbnail variant
    if (isVideo && createVariants) {
      console.log('🎬 Creating video thumbnail...');
      
      try {
        const thumbnailUrl = `https://res.cloudinary.com/${cloudName}/video/upload/w_200,h_150,q_60,f_jpg,so_2/${uploadResult.public_id}.jpg`;
        
        result.variants.thumbnail = {
          url: thumbnailUrl,
          transformation: 'w_200,h_150,q_60,f_jpg,so_2',
          estimatedSize: 15000 // ~15KB
        };
        
        console.log('✅ Video thumbnail created:', thumbnailUrl);
      } catch (thumbnailError) {
        console.error('⚠️ Video thumbnail creation failed:', thumbnailError);
      }
    }

    // Update product with Cloudinary data if productId provided
    if (productId) {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.7.1');
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        if (isVideo) {
          // Update product_videos table
          const { error } = await supabase
            .from('product_videos')
            .update({
              cloudinary_public_id: uploadResult.public_id,
              cloudinary_url: uploadResult.secure_url,
              thumbnail_url: result.variants.thumbnail?.url || null,
              duration: uploadResult.duration || null
            })
            .eq('url', uploadResult.secure_url); // Assuming we match by URL

          if (error) {
            console.error('❌ Video database update error:', error);
          } else {
            console.log('✅ Video updated with Cloudinary data');
          }
        } else {
          // Update products table for images - use NEW preview URL
          const updateData = {
            cloudinary_public_id: uploadResult.public_id,
            cloudinary_url: uploadResult.secure_url,
            preview_image_url: result.variants.preview?.url || getCloudinaryPreviewUrl(uploadResult.public_id)
          };
          
          console.log('📝 Updating product with NEW preview URL:', {
            productId,
            previewUrl: updateData.preview_image_url,
            parameters: '400x300, auto:good, webp'
          });
          
          const { error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', productId);

          if (error) {
            console.error('❌ Database update error:', error);
          } else {
            console.log('✅ Product updated with NEW Cloudinary preview data');
          }
        }
      }
    }
    
    console.log(`🎉 SUCCESS! Cloudinary ${isVideo ? 'video' : 'image'} upload with NEW preview completed:`, {
      publicId: result.publicId,
      format: result.format,
      sizeKB: Math.round(result.originalSize / 1024),
      duration: result.duration,
      hasNewPreview: !!result.variants.preview,
      newPreviewSize: result.variants.preview ? '20-25KB (400x300)' : 'N/A',
      hasThumbnail: !!result.variants.thumbnail
    });

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 FUNCTION ERROR:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to upload to Cloudinary',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
