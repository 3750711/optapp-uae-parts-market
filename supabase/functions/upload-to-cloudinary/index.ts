
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

// Generate Cloudinary preview URL with proper version handling
function getCloudinaryPreviewUrl(publicId: string, version?: string): string {
  const cloudName = 'dcuziurrb';
  
  // If version is provided, include it in the URL path
  const versionedPublicId = version ? `v${version}/${publicId}` : publicId;
  
  console.log('🔧 Generating preview URL:', {
    originalPublicId: publicId,
    version: version || 'none',
    versionedPublicId,
    transformation: 'w_400,h_300,c_fit,g_auto,q_auto:good,f_webp'
  });
  
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_400,h_300,c_fit,g_auto,q_auto:good,f_webp/${versionedPublicId}`;
}

// Input validation helper
function validateInput(body: any) {
  const errors: string[] = [];
  
  if (!body.fileData) {
    errors.push('fileData is required');
  }
  
  if (!body.publicId || typeof body.publicId !== 'string') {
    errors.push('publicId is required and must be a string');
  }
  
  if (body.fileName && typeof body.fileName !== 'string') {
    errors.push('fileName must be a string');
  }
  
  if (body.isVideo !== undefined && typeof body.isVideo !== 'boolean') {
    errors.push('isVideo must be a boolean');
  }
  
  return errors;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Cloudinary upload function started (Improved Version)');
    
    const body = await req.json();
    const validationErrors = validateInput(body);
    
    if (validationErrors.length > 0) {
      console.error('❌ Validation errors:', validationErrors);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Validation failed',
          details: validationErrors
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    const { fileData, fileName, productId, publicId, createVariants = true, isVideo = false } = body;
    
    console.log('📋 Request params:', {
      fileName: fileName || 'undefined',
      productId: productId || 'undefined',
      publicId: publicId || 'undefined',
      createVariants,
      isVideo,
      hasFileData: !!fileData
    });

    const cloudName = 'dcuziurrb';
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');
    
    if (!apiKey) {
      console.error('❌ CLOUDINARY_API_KEY not found');
      throw new Error('Cloudinary API key not configured');
    }
    
    if (!apiSecret) {
      console.error('❌ CLOUDINARY_API_SECRET not found');
      throw new Error('Cloudinary API secret not configured');
    }

    console.log(`☁️ Uploading ${isVideo ? 'video' : 'image'} to Cloudinary...`);
    
    const timestamp = Math.round(Date.now() / 1000);
    
    let transformations, uploadEndpoint;
    
    if (isVideo) {
      transformations = [
        'q_auto:good',
        'f_auto',
        'c_fill'
      ].join(',');
      uploadEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
    } else {
      // Улучшенные настройки качества для изображений
      transformations = [
        'q_auto:good',
        'f_auto',
        'c_fill'
      ].join(',');
      uploadEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    }
    
    const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}&transformation=${transformations}`;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(paramsToSign + apiSecret);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

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
      throw new Error(`Cloudinary upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    
    const cloudinaryPublicId = uploadResult.public_id;
    
    // Extract version from secure_url
    const extractedVersion = extractVersionFromUrl(uploadResult.secure_url);
    
    console.log(`✅ Main ${isVideo ? 'video' : 'image'} upload successful with version extraction:`, {
      cloudinary_public_id: cloudinaryPublicId,
      secure_url: uploadResult.secure_url,
      extracted_version: extractedVersion,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
      width: uploadResult.width,
      height: uploadResult.height,
      duration: uploadResult.duration
    });

    const result = {
      success: true,
      cloudinaryUrl: uploadResult.secure_url,
      publicId: cloudinaryPublicId,
      originalSize: uploadResult.bytes,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
      duration: uploadResult.duration,
      variants: {}
    };

    // Create variants if requested (only for images for now)
    if (createVariants && !isVideo) {
      console.log('🎨 Creating preview variant with extracted version...');
      
      try {
        const previewUrl = getCloudinaryPreviewUrl(cloudinaryPublicId, extractedVersion || undefined);
        
        result.variants.preview = {
          url: previewUrl,
          transformation: 'w_400,h_300,c_fit,g_auto,q_auto:good,f_webp',
          estimatedSize: 25000
        };
        
        console.log('✅ Preview variant created with extracted version:', {
          cloudinaryPublicId,
          extractedVersion,
          previewUrl,
          hasVersion: !!extractedVersion
        });
      } catch (previewError) {
        console.error('⚠️ Preview variant creation failed:', previewError);
      }
    }

    // For videos, create thumbnail variant
    if (isVideo && createVariants) {
      console.log('🎬 Creating video thumbnail with extracted version...');
      
      try {
        const versionedPublicId = extractedVersion ? `v${extractedVersion}/${cloudinaryPublicId}` : cloudinaryPublicId;
        const thumbnailUrl = `https://res.cloudinary.com/${cloudName}/video/upload/w_200,h_150,q_60,f_jpg,so_2/${versionedPublicId}.jpg`;
        
        result.variants.thumbnail = {
          url: thumbnailUrl,
          transformation: 'w_200,h_150,q_60,f_jpg,so_2',
          estimatedSize: 15000
        };
        
        console.log('✅ Video thumbnail created with extracted version:', {
          thumbnailUrl,
          extractedVersion
        });
      } catch (thumbnailError) {
        console.error('⚠️ Video thumbnail creation failed:', thumbnailError);
      }
    }

    // Update product with Cloudinary data including version-aware preview
    if (productId) {
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.7.1');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !supabaseServiceKey) {
          console.error('❌ Missing Supabase configuration');
          throw new Error('Supabase configuration not found');
        }
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        if (isVideo) {
          const { error } = await supabase
            .from('product_videos')
            .upsert({
              product_id: productId,
              url: uploadResult.secure_url,
              cloudinary_public_id: cloudinaryPublicId,
              cloudinary_url: uploadResult.secure_url,
              thumbnail_url: result.variants.thumbnail?.url || null,
              duration: uploadResult.duration || null
            }, {
              onConflict: 'product_id,url'
            });

          if (error) {
            console.error('❌ Video database update error:', error);
          } else {
            console.log('✅ Video updated with version-aware URLs');
          }
        } else {
          const updateData = {
            cloudinary_public_id: cloudinaryPublicId,
            cloudinary_url: uploadResult.secure_url,
            preview_image_url: result.variants.preview?.url || getCloudinaryPreviewUrl(cloudinaryPublicId, extractedVersion || undefined)
          };
          
          console.log('📝 Updating product with version-aware URLs:', {
            productId,
            cloudinaryPublicId,
            extractedVersion,
            previewUrl: updateData.preview_image_url,
            hasVersionInPreview: updateData.preview_image_url.includes('/v')
          });
          
          const { error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', productId);

          if (error) {
            console.error('❌ Database update error:', error);
            // Don't throw here - the upload was successful, just log the DB error
          } else {
            console.log('✅ Product updated with version-aware preview URL');
          }
        }
      } catch (dbError) {
        console.error('⚠️ Database operation failed:', dbError);
        // Don't fail the entire request for DB errors
      }
    }
    
    console.log(`🎉 SUCCESS! Cloudinary ${isVideo ? 'video' : 'image'} upload completed:`, {
      cloudinaryPublicId: result.publicId,
      extractedVersion: extractedVersion,
      format: result.format,
      sizeKB: Math.round(result.originalSize / 1024),
      hasVersionInPreview: result.variants.preview?.url?.includes('/v') || false,
      previewTransformation: 'w_400,h_300,c_fit,g_auto,q_auto:good,f_webp'
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
