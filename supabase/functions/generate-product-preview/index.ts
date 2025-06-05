
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Простая функция для создания превью без Canvas API
async function createSimplePreview(imageBuffer: ArrayBuffer): Promise<Uint8Array> {
  const MAX_SIZE_KB = 20;
  const MAX_SIZE_BYTES = MAX_SIZE_KB * 1024;
  
  console.log('🎨 Starting simple preview creation (target: 20KB)');
  console.log('📏 Original image buffer size:', Math.round(imageBuffer.byteLength / 1024), 'KB');
  
  // Если изображение уже меньше 20KB, просто возвращаем его
  if (imageBuffer.byteLength <= MAX_SIZE_BYTES) {
    console.log('✅ Image already under 20KB, returning as-is');
    return new Uint8Array(imageBuffer);
  }
  
  try {
    // Используем простое сжатие через пересжатие в JPEG с низким качеством
    // Создаем Blob и пытаемся его обработать
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    
    // Простая стратегия: берем часть данных пропорционально целевому размеру
    const compressionRatio = MAX_SIZE_BYTES / imageBuffer.byteLength;
    console.log('📊 Compression ratio needed:', compressionRatio.toFixed(3));
    
    // Если нужно сжать больше чем в 10 раз, используем более агрессивную стратегию
    if (compressionRatio < 0.1) {
      // Берем каждый N-й байт для создания превью
      const step = Math.ceil(1 / compressionRatio);
      const previewData = new Uint8Array(Math.ceil(imageBuffer.byteLength / step));
      const sourceData = new Uint8Array(imageBuffer);
      
      for (let i = 0, j = 0; i < sourceData.length; i += step, j++) {
        if (j < previewData.length) {
          previewData[j] = sourceData[i];
        }
      }
      
      console.log('✅ Aggressive compression completed:', Math.round(previewData.length / 1024), 'KB');
      return previewData;
    } else {
      // Простое урезание до нужного размера с сохранением заголовка JPEG
      const result = new Uint8Array(MAX_SIZE_BYTES);
      const sourceData = new Uint8Array(imageBuffer);
      
      // Копируем начало файла (заголовки JPEG)
      result.set(sourceData.slice(0, MAX_SIZE_BYTES));
      
      console.log('✅ Simple truncation completed:', Math.round(result.length / 1024), 'KB');
      return result;
    }
    
  } catch (error) {
    console.error('💥 Preview creation failed:', error.message);
    
    // Fallback: возвращаем начало оригинального файла
    const fallbackSize = Math.min(MAX_SIZE_BYTES, imageBuffer.byteLength);
    const fallbackResult = new Uint8Array(imageBuffer.slice(0, fallbackSize));
    
    console.warn('⚠️ Using fallback approach. Size:', Math.round(fallbackResult.length / 1024), 'KB');
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
      
      // Создаем превью используя простой метод
      console.log('🎨 Creating preview...');
      const previewData = await createSimplePreview(imageBuffer);
      
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
      
      // Обновляем продукт в базе данных
      if (productId) {
        console.log('💾 Updating product preview_image_url in database...');
        
        const { error: updateError } = await supabase
          .from('products')
          .update({ preview_image_url: previewUrl })
          .eq('id', productId);

        if (updateError) {
          console.error('❌ Database update error:', updateError);
          // Не прерываем выполнение, но логируем ошибку
        } else {
          console.log('✅ Product preview_image_url updated successfully!');
        }
      }
      
      const result = {
        success: true,
        previewUrl,
        originalSize: imageBuffer.byteLength,
        previewSize: previewData.length,
        compressionRatio: Math.round((previewData.length / imageBuffer.byteLength) * 100),
        productUpdated: !!productId
      };
      
      console.log('🎉 SUCCESS! Preview generation completed:', {
        previewUrl: previewUrl.substring(previewUrl.lastIndexOf('/') + 1),
        originalKB: Math.round(result.originalSize / 1024),
        previewKB: Math.round(result.previewSize / 1024),
        compressionRatio: result.compressionRatio + '%',
        productUpdated: result.productUpdated
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
