
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Загружаем оригинальное изображение
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    
    // Создаем canvas для обработки изображения
    const canvas = new OffscreenCanvas(1, 1);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to create canvas context');
    }

    // Создаем ImageBitmap из загруженного изображения
    const imageBitmap = await createImageBitmap(new Blob([imageBuffer]));
    
    // Вычисляем размеры для превью (максимум 200x200 пикселей для достижения ~20KB)
    const maxDimension = 200;
    let { width, height } = imageBitmap;
    
    if (width > height) {
      if (width > maxDimension) {
        height = (height * maxDimension) / width;
        width = maxDimension;
      }
    } else {
      if (height > maxDimension) {
        width = (width * maxDimension) / height;
        height = maxDimension;
      }
    }

    // Устанавливаем размеры canvas
    canvas.width = Math.round(width);
    canvas.height = Math.round(height);

    // Рисуем изображение на canvas
    ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);

    // Конвертируем в WebP с очень низким качеством для достижения 20KB
    const webpBlob = await canvas.convertToBlob({
      type: 'image/webp',
      quality: 0.3 // Очень низкое качество для малого размера
    });

    console.log('Preview blob size:', webpBlob.size, 'bytes');

    // Если размер больше 20KB, уменьшаем качество еще больше
    let finalBlob = webpBlob;
    let quality = 0.3;
    
    while (finalBlob.size > 20000 && quality > 0.1) {
      quality -= 0.05;
      finalBlob = await canvas.convertToBlob({
        type: 'image/webp',
        quality: quality
      });
      console.log(`Reduced quality to ${quality}, new size: ${finalBlob.size} bytes`);
    }

    // Генерируем уникальное имя файла для превью
    const timestamp = Date.now();
    const fileName = `preview_${productId || timestamp}_${Math.random().toString(36).substring(7)}.webp`;
    const filePath = `previews/${fileName}`;

    // Загружаем превью в Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, finalBlob, {
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
    console.log('Preview uploaded successfully:', previewUrl, 'Size:', finalBlob.size, 'bytes');

    return new Response(
      JSON.stringify({ 
        previewUrl,
        originalSize: imageBuffer.byteLength,
        previewSize: finalBlob.size,
        quality: quality
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

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
