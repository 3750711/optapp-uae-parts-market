
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to extract version from Cloudinary URL
function extractVersionFromUrl(cloudinaryUrl: string): string | null {
  try {
    const versionMatch = cloudinaryUrl.match(/\/v(\d+)\//);
    return versionMatch ? versionMatch[1] : null;
  } catch (error) {
    console.error('Error extracting version from URL:', error);
    return null;
  }
}

// Generate NEW Cloudinary preview URL (400x300, auto:good, webp) WITH VERSION
function getCloudinaryPreviewUrl(publicId: string, version?: string): string {
  const cloudName = 'dcuziurrb';
  // Include version in public_id if provided
  const versionedPublicId = version ? `v${version}/${publicId}` : publicId;
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_400,h_300,c_fit,g_auto,q_auto:good,f_webp/${versionedPublicId}`;
}

// Helper to clean public_id from version prefix
function cleanPublicId(publicId: string): string {
  if (!publicId) return '';
  
  // Remove version prefix (v{timestamp}/) if present
  const cleaned = publicId.replace(/^v\d+\//, '');
  
  console.log('cleanPublicId:', {
    original: publicId,
    cleaned
  });
  
  return cleaned;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Cloudinary upload function started (Direct Base64 Upload with cleaned public_id)');
    
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
    
    // 🔧 ИСПРАВЛЕНИЕ: Всегда используем очищенный public_id
    const originalPublicId = uploadResult.public_id;
    const cleanedPublicId = cleanPublicId(originalPublicId);
    
    // 🔧 НОВОЕ: Извлекаем версию из основного URL для использования в preview
    const mainImageVersion = extractVersionFromUrl(uploadResult.secure_url);
    
    console.log(`✅ Main ${isVideo ? 'video' : 'image'} upload successful with cleanup:`, {
      original_public_id: originalPublicId,
      cleaned_public_id: cleanedPublicId,
      secure_url: uploadResult.secure_url,
      version: mainImageVersion,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
      width: uploadResult.width,
      height: uploadResult.height,
      duration: uploadResult.duration // For videos
    });

    const result = {
      success: true,
      cloudinaryUrl: uploadResult.secure_url,
      publicId: cleanedPublicId, // 🔧 Возвращаем очищенный public_id
      originalSize: uploadResult.bytes,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
      duration: uploadResult.duration, // Video duration in seconds
      variants: {}
    };

    // Create variants if requested (only for images for now)
    if (createVariants && !isVideo) {
      console.log('🎨 Creating preview variant with cleaned public_id and version...');
      
      try {
        // 🔧 ИСПРАВЛЕНИЕ: Используем очищенный public_id И версию для preview URL
        const previewUrl = getCloudinaryPreviewUrl(cleanedPublicId, mainImageVersion || undefined);
        
        result.variants.preview = {
          url: previewUrl,
          transformation: 'w_400,h_300,c_fit,g_auto,q_auto:good,f_webp',
          estimatedSize: 25000 // ~20-25KB
        };
        
        console.log('✅ Preview variant created with cleaned public_id and version:', {
          cleanedPublicId,
          version: mainImageVersion,
          previewUrl
        });
      } catch (previewError) {
        console.error('⚠️ Preview variant creation failed:', previewError);
      }
    }

    // For videos, create thumbnail variant
    if (isVideo && createVariants) {
      console.log('🎬 Creating video thumbnail with cleaned public_id...');
      
      try {
        const thumbnailUrl = `https://res.cloudinary.com/${cloudName}/video/upload/w_200,h_150,q_60,f_jpg,so_2/${cleanedPublicId}.jpg`;
        
        result.variants.thumbnail = {
          url: thumbnailUrl,
          transformation: 'w_200,h_150,q_60,f_jpg,so_2',
          estimatedSize: 15000 // ~15KB
        };
        
        console.log('✅ Video thumbnail created with cleaned public_id:', thumbnailUrl);
      } catch (thumbnailError) {
        console.error('⚠️ Video thumbnail creation failed:', thumbnailError);
      }
    }

    // 🔧 ИСПРАВЛЕНИЕ: Update product with cleaned Cloudinary data if productId provided
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
              cloudinary_public_id: cleanedPublicId, // 🔧 Сохраняем очищенный ID
              cloudinary_url: uploadResult.secure_url,
              thumbnail_url: result.variants.thumbnail?.url || null,
              duration: uploadResult.duration || null
            })
            .eq('url', uploadResult.secure_url);

          if (error) {
            console.error('❌ Video database update error:', error);
          } else {
            console.log('✅ Video updated with cleaned Cloudinary data');
          }
        } else {
          // 🔧 ИСПРАВЛЕНИЕ: Update products table for images - используем очищенный public_id и preview с версией
          const updateData = {
            cloudinary_public_id: cleanedPublicId, // 🔧 Сохраняем очищенный ID
            cloudinary_url: uploadResult.secure_url,
            preview_image_url: result.variants.preview?.url || getCloudinaryPreviewUrl(cleanedPublicId, mainImageVersion || undefined)
          };
          
          console.log('📝 Updating product with cleaned data and versioned preview:', {
            productId,
            cleanedPublicId,
            version: mainImageVersion,
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
            console.log('✅ Product updated with cleaned Cloudinary data and versioned preview');
          }
        }
      }
    }
    
    console.log(`🎉 SUCCESS! Cloudinary ${isVideo ? 'video' : 'image'} upload with cleaned data completed:`, {
      cleanedPublicId: result.publicId,
      version: mainImageVersion,
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
