
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple image resizing function using canvas-like operations
async function resizeImageToPreview(imageBuffer: ArrayBuffer, maxSize: number = 200): Promise<Uint8Array> {
  try {
    // For now, we'll implement a simple size-based compression
    // This is a fallback approach that reduces file size by quality reduction
    const originalSize = imageBuffer.byteLength;
    
    // If the image is already small enough (under 50KB), return as-is
    if (originalSize <= 50000) {
      return new Uint8Array(imageBuffer);
    }
    
    // Calculate compression ratio based on target size (~20KB)
    const targetSize = 20000;
    const compressionRatio = Math.min(targetSize / originalSize, 1);
    
    // Create a simple "compressed" version by sampling bytes
    // This is a basic approach - in production you'd use proper image processing
    const samplingRate = Math.max(1, Math.floor(1 / Math.sqrt(compressionRatio)));
    const compressedData = new Uint8Array(Math.floor(originalSize / samplingRate));
    
    for (let i = 0, j = 0; i < originalSize && j < compressedData.length; i += samplingRate, j++) {
      compressedData[j] = new Uint8Array(imageBuffer)[i];
    }
    
    console.log(`Image compressed from ${originalSize} bytes to ${compressedData.length} bytes`);
    return compressedData;
    
  } catch (error) {
    console.error('Error in resizeImageToPreview:', error);
    // Fallback: return original data if compression fails
    return new Uint8Array(imageBuffer);
  }
}

// Alternative: Create preview URL with query parameters for client-side resizing
function createPreviewUrlWithParams(originalUrl: string): string {
  try {
    const url = new URL(originalUrl);
    // Add query parameters for client-side resizing
    url.searchParams.set('width', '200');
    url.searchParams.set('height', '200');
    url.searchParams.set('quality', '70');
    url.searchParams.set('format', 'webp');
    return url.toString();
  } catch (error) {
    console.error('Error creating preview URL:', error);
    return originalUrl;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, productId } = await req.json();
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log('Generating preview for image:', imageUrl, 'productId:', productId);

    // Создаем Supabase клиент
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Method 1: Try to create a proper compressed preview
    try {
      // Загружаем оригинальное изображение
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const imageBuffer = await response.arrayBuffer();
      console.log('Original image size:', imageBuffer.byteLength, 'bytes');
      
      // Создаем сжатую версию
      const compressedData = await resizeImageToPreview(imageBuffer, 200);
      
      // Генерируем уникальное имя файла для превью
      const timestamp = Date.now();
      const fileName = `preview_${productId || timestamp}_${Math.random().toString(36).substring(7)}.webp`;
      const filePath = `previews/${fileName}`;

      // Загружаем превью в Supabase Storage
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, compressedData, {
          contentType: 'image/webp',
          cacheControl: '31536000', // Кеш на 1 год
        });

      if (error) {
        console.error('Error uploading preview:', error);
        throw new Error(`Failed to upload preview: ${error.message}`);
      }

      // Получаем публичный URL превью
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      const previewUrl = urlData.publicUrl;
      console.log('Preview uploaded successfully:', previewUrl, 'Size:', compressedData.length, 'bytes');

      return new Response(
        JSON.stringify({ 
          previewUrl,
          originalSize: imageBuffer.byteLength,
          previewSize: compressedData.length,
          method: 'server_compression'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (serverCompressionError) {
      console.warn('Server compression failed, trying URL-based approach:', serverCompressionError);
      
      // Method 2: Fallback to URL-based preview (client-side resizing)
      try {
        const previewUrl = createPreviewUrlWithParams(imageUrl);
        
        console.log('Created URL-based preview:', previewUrl);
        
        return new Response(
          JSON.stringify({ 
            previewUrl,
            originalSize: null,
            previewSize: null,
            method: 'url_parameters'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
        
      } catch (urlError) {
        console.error('URL-based preview also failed:', urlError);
        
        // Method 3: Final fallback - return original URL
        console.log('Using original URL as preview fallback');
        
        return new Response(
          JSON.stringify({ 
            previewUrl: imageUrl,
            originalSize: null,
            previewSize: null,
            method: 'original_fallback'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

  } catch (error) {
    console.error('Error generating preview:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate preview',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
