
import { corsHeaders } from '../_shared/cors.ts'

const CLOUDINARY_CLOUD_NAME = 'dcuziurrb';

interface CloudinaryResponse {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  version: number;
  resource_type: 'image';
}

interface ImageUploadResponse {
  success: boolean;
  publicId?: string;
  cloudinaryUrl?: string;
  mainImageUrl?: string;
  originalSize?: number;
  compressedSize?: number;
  error?: string;
}

// Строгие ограничения для изображений
const ALLOWED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_IMAGE_SIZE_MB = 10;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🖼️ Image upload function started');
    
    // Получаем безопасные API ключи из Supabase secrets
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY')?.trim();
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')?.trim();
    const uploadPreset = Deno.env.get('CLOUDINARY_UPLOAD_PRESET')?.trim();
    
    console.log('🔑 Checking Cloudinary credentials:', {
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      hasUploadPreset: !!uploadPreset,
      apiKeyLength: apiKey?.length || 0
    });
    
    if (!apiKey || !apiSecret) {
      console.error('❌ Missing Cloudinary credentials');
      throw new Error('Cloudinary credentials not configured properly');
    }

    // Handle FormData or JSON input
    let file: File | null = null;
    let productId: string | undefined;
    let customPublicId: string | undefined;

    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Optimized FormData path
      const formData = await req.formData();
      file = formData.get('file') as File;
      productId = formData.get('productId') as string;
      customPublicId = formData.get('customPublicId') as string;
    } else {
      // Fallback JSON path (base64)
      const { fileData, fileName, productId: pid, customPublicId: cpid } = await req.json();
      if (fileData && fileName) {
        const base64Data = fileData.startsWith('data:') 
          ? fileData.split(',')[1] 
          : fileData;
        const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        file = new File([bytes], fileName);
        productId = pid;
        customPublicId = cpid;
      }
    }

    console.log('📁 FormData contents:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      productId,
      customPublicId
    });

    if (!file) {
      throw new Error('No image file provided');
    }

    // Строгая валидация файла
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    console.log('🔍 File validation:', {
      fileName: file.name,
      extension: fileExtension,
      allowedFormats: ALLOWED_IMAGE_FORMATS,
      fileType: file.type
    });
    
    if (!fileExtension || !ALLOWED_IMAGE_FORMATS.includes(fileExtension)) {
      throw new Error(`Unsupported image format. Allowed: ${ALLOWED_IMAGE_FORMATS.join(', ')}`);
    }

    // Строгая проверка MIME типа
    const allowedMimeTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/webp'
    ];
    
    if (!allowedMimeTypes.includes(file.type)) {
      throw new Error(`Invalid MIME type: ${file.type}. Expected image file.`);
    }

    // Строгая проверка размера файла
    const fileSizeMB = file.size / (1024 * 1024);
    console.log('📏 File size check:', {
      sizeBytes: file.size,
      sizeMB: fileSizeMB.toFixed(2),
      maxMB: MAX_IMAGE_SIZE_MB
    });
    
    if (fileSizeMB > MAX_IMAGE_SIZE_MB) {
      throw new Error(`Image file too large. Max size: ${MAX_IMAGE_SIZE_MB}MB, your file: ${fileSizeMB.toFixed(2)}MB`);
    }

    console.log('🖼️ Starting image upload to Cloudinary:', {
      fileName: file.name,
      sizeKB: Math.round(file.size / 1024),
      format: fileExtension
    });

    // Генерируем безопасный public_id
    const timestamp = Date.now();
    const publicId = customPublicId || `image_${productId || timestamp}_${timestamp}_${Math.random().toString(36).substring(7)}`;
    
    console.log('🏷️ Generated public ID:', publicId);
    
    // Создаем FormData для Cloudinary с безопасными параметрами
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('api_key', apiKey);
    cloudinaryFormData.append('timestamp', Math.round(timestamp / 1000).toString());
    cloudinaryFormData.append('public_id', publicId);
    cloudinaryFormData.append('folder', 'images');
    
    // Оптимизация изображения
    const transformation = 'q_auto:good,f_auto,w_1920,h_1920,c_limit';
    cloudinaryFormData.append('transformation', transformation);
    
    console.log('🎨 Image transformation:', transformation);

    // Генерация подписи для безопасности
    const timestampString = Math.round(timestamp / 1000).toString();
    const stringToSign = `folder=images&public_id=${publicId}&timestamp=${timestampString}&transformation=${transformation}${apiSecret}`;
    
    console.log('🔐 Signature generation:', {
      timestampString,
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
    
    console.log('🔏 Generated signature:', {
      signature: signature.substring(0, 10) + '...',
      signatureLength: signature.length
    });

    console.log('☁️ Uploading to Cloudinary...');

    // Upload to Cloudinary с retry логикой
    let uploadResponse: Response;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      try {
        console.log(`📤 Upload attempt ${retryCount + 1}/${maxRetries + 1}`);
        
        uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: cloudinaryFormData,
          }
        );

        console.log('📥 Cloudinary response status:', uploadResponse.status);

        if (uploadResponse.ok) break;
        
        if (retryCount === maxRetries) {
          const errorText = await uploadResponse.text();
          console.error('❌ Cloudinary upload failed after all retries:', {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            errorText
          });
          throw new Error(`Cloudinary upload failed: ${uploadResponse.status} ${errorText}`);
        }
      } catch (error) {
        console.error(`❌ Upload attempt ${retryCount + 1} failed:`, error);
        if (retryCount === maxRetries) {
          throw error;
        }
      }
      
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
    }

    const cloudinaryResult: CloudinaryResponse = await uploadResponse!.json();
    
    console.log('✅ Image successfully uploaded:', {
      publicId: cloudinaryResult.public_id,
      secureUrl: cloudinaryResult.secure_url,
      format: cloudinaryResult.format,
      sizeKB: Math.round(cloudinaryResult.bytes / 1024),
      dimensions: `${cloudinaryResult.width}x${cloudinaryResult.height}`
    });

    // Генерация оптимизированных URL
    const optimizedUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformation}/${cloudinaryResult.public_id}`;
    const thumbnailUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_300,h_300,c_fill,q_auto:good/${cloudinaryResult.public_id}`;

    console.log('🖼️ Generated URLs:', {
      optimizedUrl,
      thumbnailUrl
    });

    const response: ImageUploadResponse = {
      success: true,
      publicId: cloudinaryResult.public_id,
      cloudinaryUrl: optimizedUrl,
      mainImageUrl: optimizedUrl,
      originalSize: cloudinaryResult.bytes,
      compressedSize: Math.round(cloudinaryResult.bytes * 0.7) // Примерная оценка сжатия
    };

    console.log('🎉 Returning successful response');

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('💥 Image upload error:', error);
    
    const errorResponse: ImageUploadResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
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
