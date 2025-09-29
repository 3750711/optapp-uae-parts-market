export const CLOUDINARY_CONFIG = {
  cloudName: 'dcuziurrb',
  uploadPreset: 'ml_default', // Или ваш кастомный preset
  apiKey: process.env.VITE_CLOUDINARY_API_KEY, // Опционально для signed uploads
  folder: 'product-images', // Папка для организации файлов
  maxFileSize: 10000000, // 10MB
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'] as const,
  transformations: {
    thumbnail: 'w_200,h_200,c_fill,f_auto,q_auto',
    medium: 'w_500,h_500,c_fit,f_auto,q_auto',
    large: 'w_1200,h_1200,c_fit,f_auto,q_auto'
  }
} as const;

export const getCloudinaryUrl = (publicId: string, transformation?: string) => {
  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
  if (transformation) {
    return `${baseUrl}/${transformation}/${publicId}`;
  }
  return `${baseUrl}/${publicId}`;
};