
import { uploadDirectToCloudinary } from "./cloudinaryUpload";
import { getCompressedImageUrl, getPreviewImageUrl } from "./cloudinaryUtils";

// Полностью переработанная система - только Cloudinary
export const uploadImageToCloudinary = async (
  file: File,
  productId?: string,
  customPublicId?: string
): Promise<{
  success: boolean;
  cloudinaryUrl?: string;
  publicId?: string;
  previewUrl?: string;
  error?: string;
}> => {
  console.log('🚀 Starting Cloudinary-only upload:', {
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

    // Upload directly to Cloudinary with automatic compression
    const result = await uploadDirectToCloudinary(file, productId, customPublicId);

    if (result.success && result.publicId && result.cloudinaryUrl) {
      // Generate optimized URLs
      const compressedUrl = getCompressedImageUrl(result.publicId);
      const previewUrl = getPreviewImageUrl(result.publicId);

      console.log('✅ Cloudinary upload successful:', {
        cloudinaryUrl: result.cloudinaryUrl,
        compressedUrl,
        previewUrl,
        publicId: result.publicId,
        originalSize: result.originalSize
      });

      logImageProcessing('CloudinaryUploadSuccess', {
        fileName: file.name,
        publicId: result.publicId,
        originalSize: result.originalSize,
        compressedUrl,
        previewUrl
      });

      return {
        success: true,
        cloudinaryUrl: compressedUrl, // Use compressed version as main URL
        publicId: result.publicId,
        previewUrl
      };
    } else {
      throw new Error(result.error || 'Cloudinary upload failed');
    }
  } catch (error) {
    console.error('💥 Cloudinary upload failed:', error);
    
    logImageProcessing('CloudinaryUploadError', {
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
  const maxSize = 50 * 1024 * 1024; // 50MB (since Cloudinary will handle compression)
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
      errorMessage: 'Файл слишком большой. Максимальный размер: 50MB (будет автоматически сжат).'
    };
  }

  return { isValid: true };
};

export const logImageProcessing = (eventType: string, data: any) => {
  console.log(`[${eventType}]`, {
    ...data,
    timestamp: new Date().toISOString(),
    cloudinaryIntegration: true
  });
};

// Удаляем старые функции локального сжатия - теперь все делает Cloudinary
// compressImageTo400KB больше не нужна

// Утилита для получения всех вариантов изображения из publicId
export const getImageVariants = (publicId: string) => {
  if (!publicId) return null;

  return {
    original: `https://res.cloudinary.com/dcuziurrb/image/upload/${publicId}`,
    compressed: getCompressedImageUrl(publicId),
    preview: getPreviewImageUrl(publicId),
    thumbnail: `https://res.cloudinary.com/dcuziurrb/image/upload/w_150,h_150,q_auto:low,f_auto,c_fill/${publicId}`,
    card: `https://res.cloudinary.com/dcuziurrb/image/upload/w_400,h_300,q_auto:low,f_auto,c_fill/${publicId}`,
    detail: `https://res.cloudinary.com/dcuziurrb/image/upload/w_800,h_600,q_auto:low,f_auto,c_fit/${publicId}`
  };
};
