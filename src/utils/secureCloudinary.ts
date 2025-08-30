import { supabase } from "@/integrations/supabase/client";

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

      // Определяем функцию Edge в зависимости от типа ресурса
      const functionName = resourceType === 'video' 
        ? 'cloudinary-video-upload'
        : 'cloudinary-upload';

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

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: formData,
      });

      if (error) {
        console.error(`❌ Upload failed:`, error);
        return { 
          success: false, 
          error: error.message || 'Ошибка вызова функции' 
        };
      }

      const result = data as UploadResult;
      
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
      transformation += `,w_${width || 'auto'},h_${height || 'auto'},c_limit`;
    }
    
    // Add automatic orientation correction
    transformation += ',angle_auto_right';

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
