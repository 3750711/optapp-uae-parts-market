import { supabase } from "@/integrations/supabase/client";

export const uploadImageToStorage = async (
  file: File,
  bucket: string = 'product-images',
  path: string = ''
): Promise<string> => {
  try {
    console.log(`Starting upload for ${file.name} (${Math.round(file.size / 1024)}KB)`);
    
    // Обязательно сжимаем до 400KB
    const compressedFile = await compressImageTo400KB(file);
    
    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExtension = compressedFile.type === 'image/jpeg' ? 'jpg' : 'webp';
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;
    const fullPath = path ? `${path}/${fileName}` : fileName;

    console.log(`Uploading compressed file: ${Math.round(compressedFile.size / 1024)}KB`);

    // Загружаем файл
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fullPath, compressedFile, {
        contentType: compressedFile.type,
        cacheControl: '31536000',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Получаем публичный URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    const publicUrl = urlData.publicUrl;
    
    logImageProcessing('UploadSuccess', {
      fileName: file.name,
      originalSize: file.size,
      compressedSize: compressedFile.size,
      compressionRatio: Math.round((compressedFile.size / file.size) * 100),
      publicUrl
    });

    console.log(`Upload completed: ${publicUrl}`);
    return publicUrl;

  } catch (error) {
    logImageProcessing('UploadError', {
      fileName: file.name,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const validateImageForMarketplace = (file: File) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      errorMessage: 'Неподдерживаемый тип файла. Используйте JPEG, PNG или WebP.'
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      errorMessage: 'Файл слишком большой. Максимальный размер: 10MB.'
    };
  }

  return { isValid: true };
};

export const logImageProcessing = (eventType: string, data: any) => {
  console.log(`[${eventType}]`, data);
};

// Функция для сжатия изображения до строго 400KB
export const compressImageTo400KB = async (file: File): Promise<File> => {
  const MAX_SIZE_KB = 400;
  const MAX_SIZE_BYTES = MAX_SIZE_KB * 1024;
  
  // Если файл уже меньше 400KB, возвращаем как есть
  if (file.size <= MAX_SIZE_BYTES) {
    console.log(`File ${file.name} is already under 400KB (${Math.round(file.size / 1024)}KB)`);
    return file;
  }

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = async () => {
      try {
        // Начинаем с оригинального размера
        let { width, height } = img;
        let quality = 0.9;
        
        // Если изображение очень большое, сначала уменьшим размеры
        const maxDimension = 1920;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        // Итеративно уменьшаем качество до достижения 400KB
        let attempts = 0;
        const maxAttempts = 20;
        
        while (attempts < maxAttempts) {
          const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg', quality);
          });

          if (!blob) {
            throw new Error('Failed to create blob');
          }

          console.log(`Attempt ${attempts + 1}: Size ${Math.round(blob.size / 1024)}KB with quality ${quality.toFixed(2)}`);

          if (blob.size <= MAX_SIZE_BYTES) {
            // Достигли нужного размера
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            console.log(`Successfully compressed ${file.name} from ${Math.round(file.size / 1024)}KB to ${Math.round(compressedFile.size / 1024)}KB`);
            resolve(compressedFile);
            return;
          }

          // Уменьшаем качество для следующей попытки
          if (quality > 0.3) {
            quality -= 0.1;
          } else {
            // Если качество уже очень низкое, уменьшаем размеры
            width *= 0.9;
            height *= 0.9;
            canvas.width = width;
            canvas.height = height;
            ctx?.clearRect(0, 0, width, height);
            ctx?.drawImage(img, 0, 0, width, height);
            quality = 0.8; // Сбрасываем качество
          }

          attempts++;
        }

        // Если не удалось достичь 400KB за максимальное количество попыток
        const finalBlob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', 0.3);
        });

        if (finalBlob) {
          const finalFile = new File([finalBlob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          console.warn(`Could not compress ${file.name} to exactly 400KB. Final size: ${Math.round(finalFile.size / 1024)}KB`);
          resolve(finalFile);
        } else {
          reject(new Error('Failed to create final compressed file'));
        }

      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};
