
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Cloudinary upload function started (Direct Base64 Upload)');
    
    const { fileData, fileName, productId, publicId, createVariants = true } = await req.json();
    
    console.log('📋 Request params:', {
      fileName: fileName || 'undefined',
      productId: productId || 'undefined',
      publicId: publicId || 'undefined',
      createVariants,
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

    console.log('☁️ Uploading to Cloudinary with automatic transformations...');
    
    // Generate timestamp and signature for Cloudinary API
    const timestamp = Math.round(Date.now() / 1000);
    
    // Upload with automatic compression transformations
    const transformations = [
      'q_auto:low',  // Automatic quality optimization for smaller file size
      'f_auto',      // Automatic format selection (WebP/AVIF)
      'c_fill'       // Fill crop mode
    ].join(',');
    
    const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}&transformation=${transformations}`;
    
    // Create signature using crypto
    const encoder = new TextEncoder();
    const data = encoder.encode(paramsToSign + apiSecret);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Upload main image with compression using base64 data
    const formData = new FormData();
    formData.append('file', `data:image/jpeg;base64,${fileData}`);
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', apiKey);
    formData.append('signature', signature);
    formData.append('transformation', transformations);

    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Cloudinary upload failed:', errorText);
      throw new Error(`Cloudinary upload failed: ${uploadResponse.status}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('✅ Main image upload successful:', {
      public_id: uploadResult.public_id,
      secure_url: uploadResult.secure_url,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
      width: uploadResult.width,
      height: uploadResult.height
    });

    const result = {
      success: true,
      cloudinaryUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      originalSize: uploadResult.bytes,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
      variants: {}
    };

    // Create preview variant (20KB) if requested
    if (createVariants) {
      console.log('🎨 Creating preview variant (20KB)...');
      
      try {
        // Use transformation URL for preview instead of separate upload
        const previewUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_200,h_150,q_60,f_webp,c_fill/${uploadResult.public_id}`;
        
        result.variants.preview = {
          url: previewUrl,
          transformation: 'w_200,h_150,q_60,f_webp,c_fill',
          estimatedSize: 20000 // ~20KB
        };
        
        console.log('✅ Preview variant created:', previewUrl);
      } catch (previewError) {
        console.error('⚠️ Preview variant creation failed:', previewError);
      }
    }

    // Update product with Cloudinary data if productId provided
    if (productId) {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.7.1');
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        const updateData = {
          cloudinary_public_id: uploadResult.public_id,
          cloudinary_url: uploadResult.secure_url,
          preview_image_url: result.variants.preview?.url || uploadResult.secure_url
        };
        
        const { error } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', productId);

        if (error) {
          console.error('❌ Database update error:', error);
        } else {
          console.log('✅ Product updated with Cloudinary data');
        }
      }
    }
    
    console.log('🎉 SUCCESS! Direct base64 Cloudinary upload completed:', {
      publicId: result.publicId,
      format: result.format,
      sizeKB: Math.round(result.originalSize / 1024),
      hasPreview: !!result.variants.preview
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
