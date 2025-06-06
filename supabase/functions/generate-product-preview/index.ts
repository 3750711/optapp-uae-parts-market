
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dcuziurrb';

// Generate Cloudinary preview URL with NEW parameters (400x300, auto:good, webp)
function getCloudinaryPreviewUrl(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_400,h_300,c_fill,g_auto,q_auto:good,f_webp/${publicId}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 NEW Generate preview function started (Cloudinary-only)');
    
    const { imageUrl, productId } = await req.json();
    
    console.log('📋 Request params:', {
      imageUrl: imageUrl ? `${imageUrl.substring(0, 50)}...` : 'undefined',
      productId: productId || 'undefined',
      hasImageUrl: !!imageUrl,
      hasProductId: !!productId
    });
    
    if (!imageUrl) {
      console.error('❌ No imageUrl provided');
      return new Response(
        JSON.stringify({ success: false, error: 'Image URL is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log('🔧 Initializing Supabase client...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseServiceKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
      throw new Error('Service role key not configured');
    }
    
    const supabase = createClient(supabaseUrl!, supabaseServiceKey);

    // Check if the product has Cloudinary data
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('cloudinary_public_id, cloudinary_url, preview_image_url')
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('❌ Failed to fetch product:', productError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch product data' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    if (product?.cloudinary_public_id) {
      // Generate NEW Cloudinary preview URL (400x300, auto:good, webp)
      const previewUrl = getCloudinaryPreviewUrl(product.cloudinary_public_id);
      
      console.log('✅ Generated NEW Cloudinary preview URL:', {
        publicId: product.cloudinary_public_id,
        previewUrl,
        productId,
        parameters: '400x300, quality auto:good, format webp'
      });

      // Update product with the NEW preview URL
      const { error: updateError } = await supabase
        .from('products')
        .update({ preview_image_url: previewUrl })
        .eq('id', productId);

      if (updateError) {
        console.error('❌ Failed to update product with preview URL:', updateError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to update product with preview URL'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }

      const result = {
        success: true,
        previewUrl,
        originalSize: 0, // Not applicable for transformations
        previewSize: 25000, // Estimated 20-25KB
        compressionRatio: 100, // Direct transformation
        productUpdated: true,
        method: 'cloudinary_transformation'
      };
      
      console.log('🎉 SUCCESS! NEW Cloudinary preview generation completed:', {
        previewUrl: previewUrl.substring(previewUrl.lastIndexOf('/') + 1),
        estimatedKB: Math.round(result.previewSize / 1024),
        productUpdated: result.productUpdated,
        method: result.method
      });

      return new Response(
        JSON.stringify(result),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      console.log('⚠️ No Cloudinary public_id found for product:', productId);
      
      // Fallback: suggest uploading to Cloudinary first
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No Cloudinary data found. Please upload image to Cloudinary first.',
          suggestion: 'Use cloudinary upload function to get public_id'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

  } catch (error) {
    console.error('💥 FUNCTION ERROR:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to generate preview',
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
