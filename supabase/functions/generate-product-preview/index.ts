
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Функция для создания превью изображения 20KB с использованием ImageScript
async function createPreviewImage(imageBuffer: ArrayBuffer): Promise<Uint8Array> {
  try {
    console.log('🎨 Starting preview creation with ImageScript');
    console.log('📏 Original image buffer size:', Math.round(imageBuffer.byteLength / 1024), 'KB');
    
    // Декодируем изображение с помощью ImageScript
    const originalImage = await Image.decode(new Uint8Array(imageBuffer));
    console.log('📐 Original dimensions:', originalImage.width, 'x', originalImage.height);
    
    // Вычисляем размеры с сохранением пропорций для 150x150
    const targetSize = 150;
    const aspectRatio = originalImage.width / originalImage.height;
    
    let newWidth, newHeight;
    if (aspectRatio > 1) {
      // Широкое изображение
      newWidth = targetSize;
      newHeight = Math.round(targetSize / aspectRatio);
    } else {
      // Высокое изображение
      newWidth = Math.round(targetSize * aspectRatio);
      newHeight = targetSize;
    }
    
    console.log('🔄 Resizing to:', newWidth, 'x', newHeight);
    
    // Изменяем размер изображения
    const resized = originalImage.resize(newWidth, newHeight);
    
    // Создаем canvas 150x150 с белым фоном
    const canvas = new Image(150, 150);
    canvas.fill(0xFFFFFFFF); // Белый фон
    
    // Центрируем изображение на canvas
    const offsetX = Math.floor((150 - newWidth) / 2);
    const offsetY = Math.floor((150 - newHeight) / 2);
    
    // Композитируем изображения
    canvas.composite(resized, offsetX, offsetY);
    
    // Сначала пробуем WEBP с высоким сжатием
    try {
      const webpData = await canvas.encodeWebP(30); // Низкое качество для минимального размера
      console.log('📦 WEBP preview size:', Math.round(webpData.length / 1024), 'KB');
      
      if (webpData.length <= 20 * 1024) { // 20KB
        return webpData;
      }
    } catch (webpError) {
      console.warn('⚠️ WEBP encoding failed, trying JPEG:', webpError.message);
    }
    
    // Если WEBP не подходит или не поддерживается, используем JPEG
    let quality = 30;
    let jpegData: Uint8Array;
    
    do {
      jpegData = await canvas.encodeJPEG(quality);
      console.log(`📷 JPEG quality ${quality}%, size:`, Math.round(jpegData.length / 1024), 'KB');
      
      if (jpegData.length <= 20 * 1024) { // 20KB
        break;
      }
      
      quality -= 5;
    } while (quality > 5);
    
    console.log('✅ Final preview created:', Math.round(jpegData.length / 1024), 'KB');
    return jpegData;
    
  } catch (error) {
    console.error('💥 Error in createPreviewImage:', error.message);
    console.error('🔍 Error stack:', error.stack);
    throw new Error(`Preview creation failed: ${error.message}`);
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
      
      // Создаем превью 20KB
      console.log('🎨 Creating preview...');
      const previewData = await createPreviewImage(imageBuffer);
      
      // Генерируем имя файла для превью
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const fileName = `preview_${productId || timestamp}_${randomId}.webp`;
      const filePath = `previews/${fileName}`;

      console.log('☁️ Uploading preview to storage:', filePath);
      
      // Загружаем превью в Storage
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, previewData, {
          contentType: 'image/webp',
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
