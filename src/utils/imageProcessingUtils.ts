
import { uploadDirectToCloudinary } from "./directCloudinaryUpload";

// Система загрузки с прямым подключением к Cloudinary (откат к рабочему состоянию)
export const uploadImageToCloudinary = async (
  file: File,
  productId?: string,
  customPublicId?: string
): Promise<{
  success: boolean;
  cloudinaryUrl?: string;
  publicId?: string;
  mainImageUrl?: string;
  originalSize?: number;
  compressedSize?: number;
  error?: string;
}> => {
  console.log('🚀 Starting direct Cloudinary upload system:', {
    fileName: file.name,
    fileSize: file.size,
    productId,
    customPublicId
  });

  try {
    // Validate file
    const validation = validateImageForMarketplace(file);
    if (!validation.isValid) {
      throw new Error(validation.errorMessage || 'Invalid file');
    }

    // Upload directly to Cloudinary (как было до изменений)
    const result = await uploadDirectToCloudinary(file, productId, customPublicId);

    if (result.success && result.publicId && result.mainImageUrl) {
      console.log('✅ Direct Cloudinary upload successful:', {
        publicId: result.publicId,
        mainImageUrl: result.mainImageUrl,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize
      });

      logImageProcessing('DirectCloudinaryUploadSuccess', {
        fileName: file.name,
        publicId: result.publicId,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        mainImageUrl: result.mainImageUrl
      });

      return {
        success: true,
        cloudinaryUrl: result.mainImageUrl,
        publicId: result.publicId,
        mainImageUrl: result.mainImageUrl,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize
      };
    } else {
      throw new Error(result.error || 'Direct Cloudinary upload failed');
    }
  } catch (error) {
    console.error('💥 Direct Cloudinary upload failed:', error);
    
    logImageProcessing('DirectCloudinaryUploadError', {
      fileName: file.name,
      error: error instanceof Error ? error.message : 'Unknown error',
      productId
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const validateImageForMarketplace = (file: File) => {
  const maxSize = 50 * 1024 * 1024; // 50MB
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
      errorMessage: 'Файл слишком большой. Максимальный размер: 50MB.'
    };
  }

  return { isValid: true };
};

export const logImageProcessing = (eventType: string, data: any) => {
  console.log(`[${eventType}]`, {
    ...data,
    timestamp: new Date().toISOString(),
    uploadMethod: 'direct_cloudinary'
  });
};

// Утилита для получения всех вариантов изображения из publicId
export const getImageVariants = (publicId: string) => {
  if (!publicId) return null;

  const cloudName = 'dcuziurrb';
  return {
    original: `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`,
    main: `https://res.cloudinary.com/${cloudName}/image/upload/q_auto:good,f_auto,c_limit,w_1920,h_1920/${publicId}`,
    thumbnail: `https://res.cloudinary.com/${cloudName}/image/upload/w_150,h_150,q_auto:good,f_auto,c_fill/${publicId}`,
    card: `https://res.cloudinary.com/${cloudName}/image/upload/w_400,h_300,q_auto:good,f_auto,c_fill/${publicId}`,
    detail: `https://res.cloudinary.com/${cloudName}/image/upload/w_800,h_600,q_auto:good,f_auto,c_fit/${publicId}`
  };
};
