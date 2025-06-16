
import { corsHeaders } from '../_shared/cors.ts'

const CLOUDINARY_CLOUD_NAME = 'dcuziurrb';

interface CloudinaryVideoResponse {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  bytes: number;
  format: string;
  version: number;
  duration?: number;
  resource_type: 'video';
  bit_rate?: number;
  frame_rate?: number;
  video?: {
    pix_format: string;
    codec: string;
    level?: number;
    bit_rate?: number;
  };
  audio?: {
    codec: string;
    bit_rate?: number;
    frequency?: number;
    channels?: number;
  };
}

interface VideoUploadResponse {
  success: boolean;
  publicId?: string;
  cloudinaryUrl?: string;
  thumbnailUrl?: string;
  originalSize?: number;
  compressedSize?: number;
  format?: string;
  duration?: number;
  width?: number;
  height?: number;
  bitRate?: number;
  frameRate?: number;
  error?: string;
}

// Строгие ограничения для видео
const ALLOWED_VIDEO_FORMATS = ['mp4', 'webm', 'mov', 'avi'];
const MAX_VIDEO_SIZE_MB = 20; // Уменьшено с 100MB до 20MB
const MAX_DURATION_SECONDS = 180; // 3 минуты вместо 5
const UPLOAD_TIMEOUT_MS = 30000; // 30 секунд

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎥 Упрощенная загрузка видео начата');
    
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY')?.trim();
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')?.trim();
    
    console.log('🔑 Проверка Cloudinary credentials:', {
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      apiKeyLength: apiKey?.length || 0
    });
    
    if (!apiKey || !apiSecret) {
      console.error('❌ Отсутствуют Cloudinary credentials');
      throw new Error('Cloudinary credentials не настроены');
    }

    // Обработка FormData
    console.log('📋 Обработка FormData запроса');
    const formData = await req.formData();
    
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;
    const customPublicId = formData.get('customPublicId') as string;
    
    console.log('📁 Содержимое FormData:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      productId,
      customPublicId
    });

    if (!file) {
      throw new Error('Файл видео не предоставлен в FormData');
    }

    // СТРОГАЯ валидация файла
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    console.log('🔍 Строгая валидация файла:', {
      fileName: file.name,
      extension: fileExtension,
      allowedFormats: ALLOWED_VIDEO_FORMATS,
      fileType: file.type
    });
    
    if (!fileExtension || !ALLOWED_VIDEO_FORMATS.includes(fileExtension)) {
      throw new Error(`Неподдерживаемый формат видео. Разрешенные форматы: ${ALLOWED_VIDEO_FORMATS.join(', ')}`);
    }

    // Строгая проверка типа MIME
    const allowedMimeTypes = [
      'video/mp4', 
      'video/webm', 
      'video/quicktime', 
      'video/x-msvideo'
    ];
    
    if (!allowedMimeTypes.includes(file.type) && !file.type.startsWith('video/')) {
      throw new Error(`Неверный MIME тип: ${file.type}. Ожидается видео файл.`);
    }

    // СТРОГАЯ проверка размера файла
    const fileSizeMB = file.size / (1024 * 1024);
    console.log('📏 Строгая проверка размера:', {
      sizeBytes: file.size,
      sizeMB: fileSizeMB.toFixed(2),
      maxMB: MAX_VIDEO_SIZE_MB
    });
    
    if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
      throw new Error(`Видео файл слишком большой. Максимальный размер: ${MAX_VIDEO_SIZE_MB}MB, ваш файл: ${fileSizeMB.toFixed(2)}MB`);
    }

    console.log('📹 Начало базовой загрузки видео в Cloudinary:', {
      fileName: file.name,
      sizeKB: Math.round(file.size / 1024),
      format: fileExtension
    });

    // Генерация простого public_id
    const timestamp = Date.now();
    const publicId = customPublicId || `video_${productId || timestamp}_${timestamp}_${Math.random().toString(36).substring(7)}`;
    
    console.log('🏷️ Сгенерированный public ID:', publicId);
    
    // Создание БАЗОВОЙ FormData для Cloudinary (БЕЗ сложных трансформаций)
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('api_key', apiKey);
    cloudinaryFormData.append('timestamp', Math.round(timestamp / 1000).toString());
    cloudinaryFormData.append('public_id', publicId);
    cloudinaryFormData.append('folder', 'videos');
    cloudinaryFormData.append('resource_type', 'video');
    
    // БАЗОВАЯ трансформация (минимальная)
    const basicTransformation = 'q_auto:good,f_auto';
    cloudinaryFormData.append('transformation', basicTransformation);
    
    console.log('🎨 Базовая трансформация видео:', basicTransformation);

    // ТОЧНАЯ генерация подписи - КОПИРУЕМ АЛГОРИТМ ИЗ ФУНКЦИИ ИЗОБРАЖЕНИЙ
    const timestampString = Math.round(timestamp / 1000).toString();
    
    console.log('🔐 Шаг 1 - Создание параметров для подписи:');
    
    // Создаем объект с параметрами (БЕЗ api_key, file и signature)
    const signatureParams: Record<string, string> = {
      folder: 'videos',
      public_id: publicId,
      resource_type: 'video',
      timestamp: timestampString,
      transformation: basicTransformation
    };
    
    console.log('🔐 Шаг 2 - Параметры подписи:', signatureParams);
    
    // Сортируем ключи в алфавитном порядке
    const sortedKeys = Object.keys(signatureParams).sort();
    console.log('🔐 Шаг 3 - Отсортированные ключи:', sortedKeys);
    
    // Создаем строку запроса
    const queryString = sortedKeys
      .map(key => `${key}=${signatureParams[key]}`)
      .join('&');
    
    console.log('🔐 Шаг 4 - Строка запроса:', queryString);
    
    // Добавляем API secret в конце
    const stringToSign = `${queryString}${apiSecret}`;
    
    console.log('🔐 Шаг 5 - Финальная строка для подписи:', {
      queryString,
      stringToSignLength: stringToSign.length,
      stringToSignStart: stringToSign.substring(0, 100),
      apiSecretPresent: !!apiSecret
    });
    
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    cloudinaryFormData.append('signature', signature);
    
    console.log('🔏 Шаг 6 - Сгенерированная подпись:', {
      signature: signature.substring(0, 10) + '...',
      signatureLength: signature.length
    });

    console.log('☁️ Загрузка в Cloudinary с тайм-аутом 30 сек...');

    // Создание промиса с тайм-аутом
    const uploadWithTimeout = Promise.race([
      fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`, {
        method: 'POST',
        body: cloudinaryFormData,
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Тайм-аут загрузки (30 сек)')), UPLOAD_TIMEOUT_MS)
      )
    ]);

    const uploadResponse = await uploadWithTimeout;

    console.log('📥 Ответ Cloudinary:', {
      status: uploadResponse.status,
      statusText: uploadResponse.statusText,
      ok: uploadResponse.ok
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Ошибка загрузки в Cloudinary:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        errorText
      });
      throw new Error(`Ошибка Cloudinary: ${uploadResponse.status} ${errorText}`);
    }

    const cloudinaryResult: CloudinaryVideoResponse = await uploadResponse.json();
    
    console.log('✅ Видео успешно загружено:', {
      publicId: cloudinaryResult.public_id,
      secureUrl: cloudinaryResult.secure_url,
      duration: cloudinaryResult.duration,
      format: cloudinaryResult.format,
      sizeKB: Math.round(cloudinaryResult.bytes / 1024),
      width: cloudinaryResult.width,
      height: cloudinaryResult.height
    });

    // Проверка длительности видео
    if (cloudinaryResult.duration && cloudinaryResult.duration > MAX_DURATION_SECONDS) {
      console.warn('⚠️ Видео превышает рекомендуемую длительность:', {
        duration: cloudinaryResult.duration,
        maxDuration: MAX_DURATION_SECONDS
      });
      // Не блокируем загрузку, только предупреждаем
    }

    // Генерация простых URL без сложных трансформаций
    const optimizedVideoUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/${basicTransformation}/${cloudinaryResult.public_id}`;
    const thumbnailUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/f_jpg,w_300,h_200,c_fill,q_auto:good/${cloudinaryResult.public_id}.jpg`;

    console.log('🖼️ Сгенерированные URL:', {
      optimizedVideoUrl,
      thumbnailUrl
    });

    const response: VideoUploadResponse = {
      success: true,
      publicId: cloudinaryResult.public_id,
      cloudinaryUrl: optimizedVideoUrl,
      thumbnailUrl,
      originalSize: cloudinaryResult.bytes,
      compressedSize: Math.round(cloudinaryResult.bytes * 0.8), // Примерная оценка
      format: cloudinaryResult.format,
      duration: cloudinaryResult.duration,
      width: cloudinaryResult.width,
      height: cloudinaryResult.height,
      bitRate: cloudinaryResult.bit_rate,
      frameRate: cloudinaryResult.frame_rate
    };

    console.log('🎉 Возвращаем успешный ответ');

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('💥 Ошибка загрузки видео:', error);
    
    const errorResponse: VideoUploadResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка при загрузке видео'
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
