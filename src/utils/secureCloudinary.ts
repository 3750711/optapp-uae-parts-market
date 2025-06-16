
// Безопасная работа с Cloudinary через Supabase secrets
interface CloudinaryConfig {
  cloudName: string;
  uploadPreset?: string;
}

interface UploadOptions {
  file: File;
  productId?: string;
  customPublicId?: string;
  resourceType?: 'image' | 'video';
  maxSize?: number; // в байтах
}

interface UploadResult {
  success: boolean;
  publicId?: string;
  cloudinaryUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

class SecureCloudinaryService {
  private config: CloudinaryConfig;
  
  constructor() {
    // Получаем конфигурацию из переменных окружения
    this.config = {
      cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dcuziurrb',
      uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
    };

    if (!this.config.cloudName) {
      console.error('❌ Cloudinary cloud name not configured');
    }
  }

  async uploadFile(options: UploadOptions): Promise<UploadResult> {
    const { file, productId, customPublicId, resourceType = 'image', maxSize = 10 * 1024 * 1024 } = options;

    try {
      // Валидация файла
      if (file.size > maxSize) {
        return { 
          success: false, 
          error: `Файл слишком большой. Максимум: ${Math.round(maxSize / 1024 / 1024)}MB` 
        };
      }

      // Определяем endpoint в зависимости от типа ресурса
      const endpoint = resourceType === 'video' 
        ? '/functions/v1/cloudinary-video-upload'
        : '/functions/v1/cloudinary-upload';

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        return { 
          success: false, 
          error: 'Конфигурация Supabase отсутствует' 
        };
      }

      // Создаем FormData для отправки файла
      const formData = new FormData();
      formData.append('file', file);
      
      if (productId) {
        formData.append('productId', productId);
      }
      
      if (customPublicId) {
        formData.append('customPublicId', customPublicId);
      }

      console.log(`📤 Uploading ${resourceType} to Cloudinary via Supabase Edge Function...`);

      const response = await fetch(`${supabaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Upload failed: ${response.status}`, errorText);
        return { 
          success: false, 
          error: `Ошибка загрузки: ${response.status}` 
        };
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ ${resourceType} uploaded successfully:`, result.publicId);
        return result;
      } else {
        console.error('❌ Upload failed:', result.error);
        return { 
          success: false, 
          error: result.error || 'Неизвестная ошибка загрузки' 
        };
      }

    } catch (error) {
      console.error('💥 Upload error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
      };
    }
  }

  // Генерация безопасных URL для изображений
  generateImageUrl(publicId: string, options?: {
    width?: number;
    height?: number;
    quality?: string;
    format?: string;
  }): string {
    const { width, height, quality = 'auto', format = 'auto' } = options || {};
    
    let transformation = `q_${quality},f_${format}`;
    
    if (width || height) {
      transformation += `,w_${width || 'auto'},h_${height || 'auto'},c_fill`;
    }

    return `https://res.cloudinary.com/${this.config.cloudName}/image/upload/${transformation}/${publicId}`;
  }

  // Генерация безопасных URL для видео
  generateVideoUrl(publicId: string, options?: {
    width?: number;
    height?: number;
    quality?: string;
  }): string {
    const { width, height, quality = 'auto' } = options || {};
    
    let transformation = `q_${quality}`;
    
    if (width || height) {
      transformation += `,w_${width || 'auto'},h_${height || 'auto'},c_fill`;
    }

    return `https://res.cloudinary.com/${this.config.cloudName}/video/upload/${transformation}/${publicId}`;
  }

  // Проверка доступности сервиса
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`https://res.cloudinary.com/${this.config.cloudName}/image/upload/sample.jpg`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Создаем единственный экземпляр сервиса
export const secureCloudinary = new SecureCloudinaryService();

// Утилитарные функции для компонентов
export const uploadImage = (file: File, productId?: string) => 
  secureCloudinary.uploadFile({ file, productId, resourceType: 'image' });

export const uploadVideo = (file: File, productId?: string) => 
  secureCloudinary.uploadFile({ file, productId, resourceType: 'video' });

export const generateOptimizedImageUrl = (publicId: string, width?: number, height?: number) =>
  secureCloudinary.generateImageUrl(publicId, { width, height, quality: 'auto', format: 'webp' });
