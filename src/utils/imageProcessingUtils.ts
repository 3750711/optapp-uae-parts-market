import { supabase } from "@/integrations/supabase/client";
import { uploadToCloudinary } from "./cloudinaryUpload";

export const uploadImageToStorage = async (
  file: File,
  bucket: string = 'product-images',
  path: string = '',
  productId?: string
): Promise<string> => {
  console.log('🚀 Starting image upload:', {
    fileName: file.name,
    fileSize: file.size,
    bucket,
    path,
    productId
  });

  try {
    // Create unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    console.log('📤 Uploading to Supabase Storage...');
    
    // Upload to Supabase Storage first
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) {
      console.error('❌ Supabase upload error:', error);
      throw error;
    }

    console.log('✅ Supabase upload successful:', data.path);

    // Get public URL from Supabase
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    const supabaseUrl = urlData.publicUrl;
    console.log('📋 Supabase public URL:', supabaseUrl);

    // If productId is provided, also upload to Cloudinary
    if (productId) {
      console.log('☁️ Uploading to Cloudinary for product:', productId);
      
      try {
        const cloudinaryResult = await uploadToCloudinary(
          supabaseUrl,
          productId,
          `product_${productId}_${Date.now()}`
        );

        if (cloudinaryResult.success && cloudinaryResult.cloudinaryUrl) {
          console.log('✅ Cloudinary upload successful:', {
            cloudinaryUrl: cloudinaryResult.cloudinaryUrl,
            publicId: cloudinaryResult.publicId
          });

          // Update product with Cloudinary data
          if (cloudinaryResult.publicId) {
            const { error: updateError } = await supabase
              .from('products')
              .update({
                cloudinary_public_id: cloudinaryResult.publicId,
                cloudinary_url: cloudinaryResult.cloudinaryUrl,
                preview_image_url: cloudinaryResult.cloudinaryUrl
              })
              .eq('id', productId);

            if (updateError) {
              console.error('❌ Failed to update product with Cloudinary data:', updateError);
            } else {
              console.log('✅ Product updated with Cloudinary data');
            }
          }
        } else {
          console.warn('⚠️ Cloudinary upload failed, using Supabase URL');
        }
      } catch (cloudinaryError) {
        console.error('💥 Cloudinary upload error:', cloudinaryError);
        // Continue with Supabase URL if Cloudinary fails
      }
    }

    logImageProcessing('UploadSuccess', {
      fileName: file.name,
      filePath: data.path,
      fileSize: file.size,
      bucket,
      hasCloudinary: !!productId
    });

    return supabaseUrl;
  } catch (error) {
    console.error('💥 Image upload failed:', error);
    
    logImageProcessing('UploadError', {
      fileName: file.name,
      error: error instanceof Error ? error.message : 'Unknown error',
      bucket,
      path
    });
    
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
