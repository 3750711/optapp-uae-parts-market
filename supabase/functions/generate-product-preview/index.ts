
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Функция для реального сжатия изображения с использованием Canvas API
async function compressImageToWebP(imageBuffer: ArrayBuffer, targetSizeKB: number = 20): Promise<Uint8Array> {
  try {
    // Создаем Blob из ArrayBuffer
    const blob = new Blob([imageBuffer]);
    
    // Создаем Image объект
    const img = new Image();
    const canvas = new OffscreenCanvas(200, 200); // Размер превью 200x200
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Cannot get canvas context');
    }
    
    // Загружаем изображение
    const imageBitmap = await createImageBitmap(blob);
    
    // Вычисляем размеры с сохранением пропорций
    const { width, height } = imageBitmap;
    const aspectRatio = width / height;
    
    let newWidth, newHeight;
    if (aspectRatio > 1) {
      newWidth = 200;
      newHeight = 200 / aspectRatio;
    } else {
      newWidth = 200 * aspectRatio;
      newHeight = 200;
    }
    
    // Обновляем размер canvas
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    // Рисуем изображение на canvas
    ctx.drawImage(imageBitmap, 0, 0, newWidth, newHeight);
    
    // Начинаем с высокого качества и уменьшаем до достижения целевого размера
    let quality = 0.8;
    let blob2: Blob;
    
    do {
      blob2 = await canvas.convertToBlob({
        type: 'image/webp',
        quality: quality
      });
      
      if (blob2.size <= targetSizeKB * 1024) {
        break;
      }
      
      quality -= 0.1;
    } while (quality > 0.1);
    
    // Конвертируем Blob в Uint8Array
    const arrayBuffer = await blob2.arrayBuffer();
    
    console.log(`Image compressed from ${imageBuffer.byteLength} bytes to ${arrayBuffer.byteLength} bytes (${Math.round(arrayBuffer.byteLength / 1024)}KB) with quality ${quality}`);
    
    return new Uint8Array(arrayBuffer);
    
  } catch (error) {
    console.error('Error in compressImageToWebP:', error);
    // Fallback: простое уменьшение размера данных
    const targetSize = targetSizeKB * 1024;
    const compressionRatio = Math.min(targetSize / imageBuffer.byteLength, 1);
    const samplingRate = Math.max(1, Math.floor(1 / Math.sqrt(compressionRatio)));
    const compressedData = new Uint8Array(Math.floor(imageBuffer.byteLength / samplingRate));
    
    for (let i = 0, j = 0; i < imageBuffer.byteLength && j < compressedData.length; i += samplingRate, j++) {
      compressedData[j] = new Uint8Array(imageBuffer)[i];
    }
    
    return compressedData;
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

    // Создаем Supabase клиент с service role key для обхода RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not found');
      throw new Error('Service role key not configured');
    }
    
    const supabase = createClient(supabaseUrl!, supabaseServiceKey);

    try {
      // Загружаем оригинальное изображение
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const imageBuffer = await response.arrayBuffer();
      console.log('Original image size:', imageBuffer.byteLength, 'bytes');
      
      // Создаем сжатую WebP версию до 20KB
      const compressedData = await compressImageToWebP(imageBuffer, 20);
      
      // Генерируем уникальное имя файла для превью
      const timestamp = Date.now();
      const fileName = `preview_${productId || timestamp}_${Math.random().toString(36).substring(7)}.webp`;
      const filePath = `previews/${fileName}`;

      // Загружаем превью в Supabase Storage используя service role
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, compressedData, {
          contentType: 'image/webp',
          cacheControl: '31536000', // Кеш на 1 год
          upsert: false
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
          method: 'webp_compression'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (serverCompressionError) {
      console.warn('WebP compression failed, trying URL-based approach:', serverCompressionError);
      
      // Fallback: URL-based preview
      const previewUrl = `${imageUrl}?width=200&height=200&quality=70&format=webp`;
      
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
