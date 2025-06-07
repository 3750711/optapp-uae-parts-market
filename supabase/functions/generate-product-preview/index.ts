import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dcuziurrb';

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

// Generate Cloudinary preview URL with version support
function getCloudinaryPreviewUrl(publicId: string, version?: string): string {
  const versionedPublicId = version ? `v${version}/${publicId}` : publicId;
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_400,h_300,c_fit,g_auto,q_auto:good,f_webp/${versionedPublicId}`;
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

// Helper to validate public_id format
function isValidPublicId(publicId: string): boolean {
  if (!publicId || typeof publicId !== 'string') return false;
  
  // Valid public_id should not contain version prefix
  if (publicId.startsWith('v') && /^v\d+\//.test(publicId)) {
    console.warn('Invalid public_id with version prefix:', publicId);
    return false;
  }
  
  // Should contain valid characters (letters, numbers, underscores, hyphens)
  const validFormat = /^[a-zA-Z0-9_-]+$/.test(publicId.replace(/\//g, '_'));
  
  if (!validFormat) {
    console.warn('Invalid public_id format:', publicId);
  }
  
  return validFormat;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Generate preview function started (with version-aware handling)');
    
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

    if (product?.cloudinary_public_id && product?.cloudinary_url) {
      // 🔧 Extract version from the original cloudinary_url
      const version = extractVersionFromUrl(product.cloudinary_url);
      
      // Clean the public_id from version prefix
      const originalPublicId = product.cloudinary_public_id;
      const cleanedPublicId = cleanPublicId(originalPublicId);
      
      // Validate the cleaned public_id
      if (!isValidPublicId(cleanedPublicId)) {
        console.error('❌ Invalid public_id after cleaning:', {
          original: originalPublicId,
          cleaned: cleanedPublicId,
          productId
        });
        
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid public_id format after cleaning'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
      }
      
      // 🔧 Generate preview URL with version support
      const previewUrl = getCloudinaryPreviewUrl(cleanedPublicId, version || undefined);
      
      console.log('✅ Generated preview URL with version:', {
        originalPublicId,
        cleanedPublicId,
        version,
        previewUrl,
        productId,
        transformation: 'w_400,h_300,c_fit,g_auto,q_auto:good,f_webp'
      });

      // Update product with preview URL
      const updateData: any = { preview_image_url: previewUrl };
      
      // Always update public_id to ensure it's cleaned
      if (originalPublicId !== cleanedPublicId) {
        updateData.cloudinary_public_id = cleanedPublicId;
        console.log('🧹 Updating public_id in database:', {
          from: originalPublicId,
          to: cleanedPublicId
        });
      }
      
      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
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
        method: 'cloudinary_transformation_with_version',
        publicIdCleaned: originalPublicId !== cleanedPublicId,
        cleanedPublicId: cleanedPublicId,
        version: version
      };
      
      console.log('🎉 SUCCESS! Preview generation with version completed:', {
        previewUrl: previewUrl.substring(previewUrl.lastIndexOf('/') + 1),
        estimatedKB: Math.round(result.previewSize / 1024),
        productUpdated: result.productUpdated,
        method: result.method,
        publicIdCleaned: result.publicIdCleaned,
        cleanedPublicId: result.cleanedPublicId,
        version: result.version
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
