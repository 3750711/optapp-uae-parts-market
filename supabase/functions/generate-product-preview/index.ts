
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Функция для создания превью изображения 20KB
async function createPreviewImage(imageBuffer: ArrayBuffer): Promise<Uint8Array> {
  try {
    const blob = new Blob([imageBuffer]);
    const imageBitmap = await createImageBitmap(blob);
    
    // Размер превью 150x150 для каталога
    const canvas = new OffscreenCanvas(150, 150);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Cannot get canvas context');
    }
    
    // Вычисляем размеры с сохранением пропорций
    const { width, height } = imageBitmap;
    const aspectRatio = width / height;
    
    let newWidth, newHeight;
    if (aspectRatio > 1) {
      newWidth = 150;
      newHeight = 150 / aspectRatio;
    } else {
      newWidth = 150 * aspectRatio;
      newHeight = 150;
    }
    
    // Центрируем изображение на canvas
    const offsetX = (150 - newWidth) / 2;
    const offsetY = (150 - newHeight) / 2;
    
    // Заливаем фон белым цветом
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 150, 150);
    
    // Рисуем изображение
    ctx.drawImage(imageBitmap, offsetX, offsetY, newWidth, newHeight);
    
    // Создаем превью с максимальным сжатием для достижения 20KB
    let quality = 0.3;
    let previewBlob: Blob;
    
    do {
      previewBlob = await canvas.convertToBlob({
        type: 'image/webp',
        quality: quality
      });
      
      if (previewBlob.size <= 20 * 1024) { // 20KB
        break;
      }
      
      quality -= 0.05;
    } while (quality > 0.1);
    
    const arrayBuffer = await previewBlob.arrayBuffer();
    
    console.log(`Preview created: ${Math.round(arrayBuffer.byteLength / 1024)}KB with quality ${quality}`);
    
    return new Uint8Array(arrayBuffer);
    
  } catch (error) {
    console.error('Error creating preview:', error);
    throw error;
  }
}

serve(async (req) => {
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

    console.log('Generating 20KB preview for:', imageUrl, 'productId:', productId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not found');
      throw new Error('Service role key not configured');
    }
    
    const supabase = createClient(supabaseUrl!, supabaseServiceKey);

    // Загружаем оригинальное изображение
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    console.log('Original image size:', Math.round(imageBuffer.byteLength / 1024), 'KB');
    
    // Создаем превью 20KB
    const previewData = await createPreviewImage(imageBuffer);
    
    // Генерируем имя файла для превью
    const timestamp = Date.now();
    const fileName = `preview_${productId || timestamp}_${Math.random().toString(36).substring(7)}.webp`;
    const filePath = `previews/${fileName}`;

    // Загружаем превью в Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, previewData, {
        contentType: 'image/webp',
        cacheControl: '31536000',
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
    
    console.log('Preview uploaded successfully:', previewUrl, 'Size:', Math.round(previewData.length / 1024), 'KB');

    return new Response(
      JSON.stringify({ 
        success: true,
        previewUrl,
        originalSize: imageBuffer.byteLength,
        previewSize: previewData.length,
        compressionRatio: Math.round((previewData.length / imageBuffer.byteLength) * 100)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error generating preview:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
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
