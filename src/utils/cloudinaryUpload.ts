
import { uploadDirectToCloudinary } from "./directCloudinaryUpload";

interface CloudinaryUploadResult {
  success: boolean;
  publicId?: string;
  mainImageUrl?: string;
  originalSize?: number;
  compressedSize?: number;
  error?: string;
}

// Откат к прямой загрузке в Cloudinary (как было до изменений)
export const uploadToCloudinary = async (
  file: File,
  productId?: string,
  customPublicId?: string
): Promise<CloudinaryUploadResult> => {
  console.log('📤 uploadToCloudinary called - using direct upload method');
  
  // Используем прямую загрузку в Cloudinary
  const result = await uploadDirectToCloudinary(file, productId, customPublicId);
  
  return {
    success: result.success,
    publicId: result.publicId,
    mainImageUrl: result.mainImageUrl,
    originalSize: result.originalSize,
    compressedSize: result.compressedSize,
    error: result.error
  };
};

// Legacy function - now redirects to direct upload
export const uploadDirectToCloudinary = uploadDirectToCloudinary;
