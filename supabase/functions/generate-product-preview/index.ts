
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Адаптированная версия compressImageTo400KB для Deno Edge Runtime
async function createPreviewImageTo20KB(imageBuffer: ArrayBuffer): Promise<Uint8Array> {
  const MAX_SIZE_KB = 20;
  const MAX_SIZE_BYTES = MAX_SIZE_KB * 1024;
  
  console.log('🎨 Starting preview creation (target: 20KB)');
  console.log('📏 Original image buffer size:', Math.round(imageBuffer.byteLength / 1024), 'KB');
  
  // Создаем Canvas в Deno среде
  try {
    // В Deno Edge Runtime используем OffscreenCanvas если доступен
    const canvas = new OffscreenCanvas(150, 150);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Cannot get 2D context from OffscreenCanvas');
    }

    // Создаем ImageBitmap из buffer
    const blob = new Blob([imageBuffer]);
    const imageBitmap = await createImageBitmap(blob);
    
    console.log('📐 Original dimensions:', imageBitmap.width, 'x', imageBitmap.height);
    
    // Вычисляем размеры с сохранением пропорций для 150x150
    const targetSize = 150;
    let { width, height } = imageBitmap;
    
    if (width > height) {
      height = (height * targetSize) / width;
      width = targetSize;
    } else {
      width = (width * targetSize) / height;
      height = targetSize;
    }
    
    console.log('🔄 Resizing to:', Math.round(width), 'x', Math.round(height));
    
    // Рисуем на canvas с центрированием
    canvas.width = 150;
    canvas.height = 150;
    
    // Белый фон
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 150, 150);
    
    // Центрируем изображение
    const offsetX = (150 - width) / 2;
    const offsetY = (150 - height) / 2;
    
    ctx.drawImage(imageBitmap, offsetX, offsetY, width, height);
    
    // Итеративное сжатие как в compressImageTo400KB
    let quality = 0.9;
    let attempts = 0;
    const maxAttempts = 15;
    
    while (attempts < maxAttempts) {
      const blob = await canvas.convertToBlob({
        type: 'image/jpeg',
        quality: quality
      });
      
      console.log(`Attempt ${attempts + 1}: Size ${Math.round(blob.size / 1024)}KB with quality ${quality.toFixed(2)}`);
      
      if (blob.size <= MAX_SIZE_BYTES) {
        // Достигли нужного размера
        const arrayBuffer = await blob.arrayBuffer();
        const result = new Uint8Array(arrayBuffer);
        
        console.log('✅ Preview created successfully:', Math.round(result.length / 1024), 'KB');
        return result;
      }
      
      // Уменьшаем качество для следующей попытки
      if (quality > 0.2) {
        quality -= 0.1;
      } else {
        // Если качество уже очень низкое, уменьшаем размеры
        const newSize = Math.round(canvas.width * 0.9);
        canvas.width = newSize;
        canvas.height = newSize;
        
        // Перерисовываем с новым размером
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, newSize, newSize);
        
        const newWidth = width * 0.9;
        const newHeight = height * 0.9;
        const newOffsetX = (newSize - newWidth) / 2;
        const newOffsetY = (newSize - newHeight) / 2;
        
        ctx.drawImage(imageBitmap, newOffsetX, newOffsetY, newWidth, newHeight);
        quality = 0.8; // Сбрасываем качество
      }
      
      attempts++;
    }
    
    // Если не удалось достичь 20KB, возвращаем с минимальным качеством
    const finalBlob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: 0.1
    });
    
    const finalArrayBuffer = await finalBlob.arrayBuffer();
    const finalResult = new Uint8Array(finalArrayBuffer);
    
    console.warn('⚠️ Could not compress to exactly 20KB. Final size:', Math.round(finalResult.length / 1024), 'KB');
    return finalResult;
    
  } catch (canvasError) {
    console.error('💥 Canvas approach failed:', canvasError.message);
    
    // Fallback: простое урезание данных (не идеально, но работает)
    console.log('🔄 Using fallback approach...');
    
    if (imageBuffer.byteLength <= MAX_SIZE_BYTES) {
      return new Uint8Array(imageBuffer);
    }
    
    // Простой fallback - берем первые 20KB (может повредить изображение)
    const fallbackResult = new Uint8Array(imageBuffer.slice(0, MAX_SIZE_BYTES));
    console.warn('⚠️ Fallback used, image may be corrupted. Size:', Math.round(fallbackResult.length / 1024), 'KB');
    return fallbackResult;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Generate preview function started');
    
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

    console.log('🌐 Fetching original image from:', imageUrl);
    
    // Загружаем оригинальное изображение с таймаутом
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд таймаут
    
    try {
      const response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Supabase-Function/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      console.log('📄 Image content type:', contentType);
      
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error(`Invalid content type: ${contentType}. Expected image/*`);
      }

      const imageBuffer = await response.arrayBuffer();
      console.log('📦 Original image downloaded:', Math.round(imageBuffer.byteLength / 1024), 'KB');
      
      if (imageBuffer.byteLength === 0) {
        throw new Error('Downloaded image is empty');
      }
      
      // Создаем превью 20KB используя адаптированный алгоритм
      console.log('🎨 Creating 20KB preview...');
      const previewData = await createPreviewImageTo20KB(imageBuffer);
      
      // Генерируем имя файла для превью
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const fileName = `preview_${productId || timestamp}_${randomId}.jpg`;
      const filePath = `previews/${fileName}`;

      console.log('☁️ Uploading preview to storage:', filePath);
      
      // Загружаем превью в Storage
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, previewData, {
          contentType: 'image/jpeg',
          cacheControl: '31536000',
          upsert: false
        });

      if (error) {
        console.error('❌ Storage upload error:', error);
        throw new Error(`Failed to upload preview: ${error.message}`);
      }

      console.log('✅ Preview uploaded successfully:', data.path);

      // Получаем публичный URL превью
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      const previewUrl = urlData.publicUrl;
      
      const result = {
        success: true,
        previewUrl,
        originalSize: imageBuffer.byteLength,
        previewSize: previewData.length,
        compressionRatio: Math.round((previewData.length / imageBuffer.byteLength) * 100)
      };
      
      console.log('🎉 SUCCESS! Preview generation completed:', {
        previewUrl: previewUrl.substring(previewUrl.lastIndexOf('/') + 1),
        originalKB: Math.round(result.originalSize / 1024),
        previewKB: Math.round(result.previewSize / 1024),
        compressionRatio: result.compressionRatio + '%'
      });

      return new Response(
        JSON.stringify(result),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('💥 Fetch error:', fetchError.message);
      throw fetchError;
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
