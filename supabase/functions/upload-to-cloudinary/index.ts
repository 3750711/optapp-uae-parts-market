
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate Cloudinary preview URL with proper version handling
function getCloudinaryPreviewUrl(publicId: string): string {
  const cloudName = 'dcuziurrb';
  // Use public_id as-is from Cloudinary (it already contains version if present)
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_400,h_300,c_fit,g_auto,q_auto:good,f_webp/${publicId}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Cloudinary upload function started (Fixed Version Handling)');
    
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

    console.log(`☁️ Uploading ${isVideo ? 'video' : 'image'} to Cloudinary...`);
    
    // Generate timestamp and signature for Cloudinary API
    const timestamp = Math.round(Date.now() / 1000);
    
    // Different transformations for video and image
    let transformations, uploadEndpoint;
    
    if (isVideo) {
      transformations = [
        'q_auto:low',
        'f_auto',
        'c_fill'
      ].join(',');
      uploadEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
    } else {
      transformations = [
        'q_auto:low',
        'f_auto',
        'c_fill'
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

    // Upload file with compression using base64 data
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
    
    // ✅ ПРАВИЛЬНАЯ ЛОГИКА: Используем оригинальный public_id от Cloudinary как есть
    const cloudinaryPublicId = uploadResult.public_id;
    
    console.log(`✅ Main ${isVideo ? 'video' : 'image'} upload successful:`, {
      cloudinary_public_id: cloudinaryPublicId,
      secure_url: uploadResult.secure_url,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
      width: uploadResult.width,
      height: uploadResult.height,
      duration: uploadResult.duration
    });

    const result = {
      success: true,
      cloudinaryUrl: uploadResult.secure_url,
      publicId: cloudinaryPublicId, // ✅ Возвращаем оригинальный public_id с версией
      originalSize: uploadResult.bytes,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
      duration: uploadResult.duration,
      variants: {}
    };

    // Create variants if requested (only for images for now)
    if (createVariants && !isVideo) {
      console.log('🎨 Creating preview variant with original public_id...');
      
      try {
        // ✅ ПРАВИЛЬНО: Используем оригинальный public_id от Cloudinary
        const previewUrl = getCloudinaryPreviewUrl(cloudinaryPublicId);
        
        result.variants.preview = {
          url: previewUrl,
          transformation: 'w_400,h_300,c_fit,g_auto,q_auto:good,f_webp',
          estimatedSize: 25000
        };
        
        console.log('✅ Preview variant created with original public_id:', {
          cloudinaryPublicId,
          previewUrl
        });
      } catch (previewError) {
        console.error('⚠️ Preview variant creation failed:', previewError);
      }
    }

    // For videos, create thumbnail variant
    if (isVideo && createVariants) {
      console.log('🎬 Creating video thumbnail with original public_id...');
      
      try {
        const thumbnailUrl = `https://res.cloudinary.com/${cloudName}/video/upload/w_200,h_150,q_60,f_jpg,so_2/${cloudinaryPublicId}.jpg`;
        
        result.variants.thumbnail = {
          url: thumbnailUrl,
          transformation: 'w_200,h_150,q_60,f_jpg,so_2',
          estimatedSize: 15000
        };
        
        console.log('✅ Video thumbnail created with original public_id:', thumbnailUrl);
      } catch (thumbnailError) {
        console.error('⚠️ Video thumbnail creation failed:', thumbnailError);
      }
    }

    // ✅ ПРАВИЛЬНАЯ ЛОГИКА: Update product with original Cloudinary data
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
              cloudinary_public_id: cloudinaryPublicId,
              cloudinary_url: uploadResult.secure_url,
              thumbnail_url: result.variants.thumbnail?.url || null,
              duration: uploadResult.duration || null
            })
            .eq('url', uploadResult.secure_url);

          if (error) {
            console.error('❌ Video database update error:', error);
          } else {
            console.log('✅ Video updated with original Cloudinary data');
          }
        } else {
          // ✅ ПРАВИЛЬНО: Update products table - используем оригинальный public_id и правильный preview
          const updateData = {
            cloudinary_public_id: cloudinaryPublicId, // ✅ Сохраняем оригинальный ID с версией
            cloudinary_url: uploadResult.secure_url,
            preview_image_url: result.variants.preview?.url || getCloudinaryPreviewUrl(cloudinaryPublicId)
          };
          
          console.log('📝 Updating product with original Cloudinary data:', {
            productId,
            cloudinaryPublicId,
            previewUrl: updateData.preview_image_url,
            transformation: 'w_400,h_300,c_fit,g_auto,q_auto:good,f_webp'
          });
          
          const { error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', productId);

          if (error) {
            console.error('❌ Database update error:', error);
          } else {
            console.log('✅ Product updated with original Cloudinary data and correct preview');
          }
        }
      }
    }
    
    console.log(`🎉 SUCCESS! Cloudinary ${isVideo ? 'video' : 'image'} upload completed:`, {
      cloudinaryPublicId: result.publicId,
      format: result.format,
      sizeKB: Math.round(result.originalSize / 1024),
      duration: result.duration,
      hasCorrectPreview: !!result.variants.preview,
      previewTransformation: 'w_400,h_300,c_fit,g_auto,q_auto:good,f_webp',
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
