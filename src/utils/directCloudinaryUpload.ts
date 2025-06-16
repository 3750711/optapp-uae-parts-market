
// Прямая загрузка в Cloudinary без Edge Functions
interface CloudinaryUploadResult {
  success: boolean;
  publicId?: string;
  cloudinaryUrl?: string;
  mainImageUrl?: string;
  originalSize?: number;
  compressedSize?: number;
  error?: string;
}

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

const CLOUDINARY_CLOUD_NAME = 'dcuziurrb';
const CLOUDINARY_UPLOAD_PRESET = 'marketplace'; // Публичный upload preset

// Прямая загрузка в Cloudinary (как было до изменений)
export const uploadDirectToCloudinary = async (
  file: File,
  productId?: string,
  customPublicId?: string
): Promise<CloudinaryUploadResult> => {
  try {
    console.log('📤 Direct Cloudinary upload started:', {
      fileName: file.name,
      fileSize: file.size,
      productId,
      customPublicId
    });

    // Валидация файла
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Неподдерживаемый тип файла. Используйте JPEG, PNG или WebP.');
    }

    if (file.size > maxSize) {
      throw new Error('Файл слишком большой. Максимальный размер: 10MB.');
    }

    // Генерируем безопасный public_id
    const timestamp = Date.now();
    const publicId = customPublicId || `product_${productId || timestamp}_${timestamp}_${Math.random().toString(36).substring(7)}`;

    // Создаем FormData для прямой загрузки
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('public_id', publicId);
    formData.append('folder', 'marketplace/products');
    
    // Автоматическая оптимизация
    formData.append('transformation', 'q_auto:good,f_auto,w_1920,h_1920,c_limit');

    console.log('☁️ Uploading directly to Cloudinary...');

    // Прямая загрузка в Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudinary upload failed: ${response.status} ${errorText}`);
    }

    const result: CloudinaryResponse = await response.json();

    console.log('✅ Direct Cloudinary upload successful:', {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      format: result.format,
      sizeKB: Math.round(result.bytes / 1024),
      dimensions: `${result.width}x${result.height}`
    });

    // Генерируем оптимизированный URL
    const optimizedUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/q_auto:good,f_auto,w_1920,h_1920,c_limit/${result.public_id}`;

    return {
      success: true,
      publicId: result.public_id,
      cloudinaryUrl: optimizedUrl,
      mainImageUrl: optimizedUrl,
      originalSize: result.bytes,
      compressedSize: Math.round(result.bytes * 0.7) // Примерная оценка сжатия
    };

  } catch (error) {
    console.error('💥 Direct Cloudinary upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
};

// Основная функция загрузки изображений (откат к рабочему состоянию)
export const uploadImageToCloudinary = async (
  file: File,
  productId?: string,
  customPublicId?: string
): Promise<CloudinaryUploadResult> => {
  console.log('🚀 Starting image upload (direct to Cloudinary)');
  
  // Используем прямую загрузку в Cloudinary
  return await uploadDirectToCloudinary(file, productId, customPublicId);
};
