
import { uploadToCloudinary } from "./cloudinaryUpload";
import { getCompressedImageUrl, getPreviewImageUrl } from "./cloudinaryUtils";

// Система загрузки с автоматическим сжатием в Cloudinary
export const uploadImageToCloudinary = async (
  file: File,
  productId?: string,
  customPublicId?: string
): Promise<{
  success: boolean;
  cloudinaryUrl?: string;
  publicId?: string;
  previewUrl?: string;
  mainImageUrl?: string;
  originalSize?: number;
  compressedSize?: number;
  previewSize?: number;
  error?: string;
}> => {
  console.log('🚀 Starting new Cloudinary upload system:', {
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

    // Upload to Cloudinary with automatic compression
    const result = await uploadToCloudinary(file, productId, customPublicId);

    if (result.success && result.publicId && result.mainImageUrl) {
      console.log('✅ New Cloudinary upload successful:', {
        publicId: result.publicId,
        mainImageUrl: result.mainImageUrl,
        previewImageUrl: result.previewImageUrl,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        previewSize: result.previewSize
      });

      logImageProcessing('NewCloudinaryUploadSuccess', {
        fileName: file.name,
        publicId: result.publicId,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        previewSize: result.previewSize,
        mainImageUrl: result.mainImageUrl,
        previewImageUrl: result.previewImageUrl
      });

      return {
        success: true,
        cloudinaryUrl: result.mainImageUrl, // Main compressed image (~400KB)
        publicId: result.publicId,
        previewUrl: result.previewImageUrl, // Preview image (~20KB)
        mainImageUrl: result.mainImageUrl,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        previewSize: result.previewSize
      };
    } else {
      throw new Error(result.error || 'Cloudinary upload failed');
    }
  } catch (error) {
    console.error('💥 New Cloudinary upload failed:', error);
    
    logImageProcessing('NewCloudinaryUploadError', {
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
  const maxSize = 50 * 1024 * 1024; // 50MB (Cloudinary will handle compression)
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
    cloudinaryIntegration: 'v2'
  });
};

// Утилита для получения всех вариантов изображения из publicId
export const getImageVariants = (publicId: string) => {
  if (!publicId) return null;

  return {
    original: `https://res.cloudinary.com/dcuziurrb/image/upload/${publicId}`,
    main: `https://res.cloudinary.com/dcuziurrb/image/upload/q_auto:low,f_auto,c_limit,w_1920,h_1920/${publicId}`, // ~400KB
    preview: `https://res.cloudinary.com/dcuziurrb/image/upload/q_auto:eco,f_webp,c_fit,w_400,h_300/${publicId}`, // ~20KB
    thumbnail: `https://res.cloudinary.com/dcuziurrb/image/upload/w_150,h_150,q_auto:low,f_auto,c_fill/${publicId}`,
    card: `https://res.cloudinary.com/dcuziurrb/image/upload/w_400,h_300,q_auto:low,f_auto,c_fill/${publicId}`,
    detail: `https://res.cloudinary.com/dcuziurrb/image/upload/w_800,h_600,q_auto:low,f_auto,c_fit/${publicId}`
  };
};
