/**
 * File validation utilities for reliable media uploads
 * Includes fallback validation for Telegram WebView on Android
 */

// Allowed image types - expanded for mobile compatibility
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/avif'
]);

// Allowed video types
const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/mov',
  'video/avi'
]);

/**
 * Check if filename looks like image by extension
 * Fallback for when MIME type is empty/incorrect in Telegram
 */
const looksLikeImageByExtension = (filename: string): boolean => {
  return /\.(jpe?g|png|webp|heic|heif|avif)$/i.test(filename);
};

/**
 * Check if filename looks like video by extension
 */
const looksLikeVideoByExtension = (filename: string): boolean => {
  return /\.(mp4|webm|mov|quicktime|avi)$/i.test(filename);
};

/**
 * Comprehensive image validation with fallback
 * Works reliably in Telegram WebView on Android
 */
export const isAllowedImage = (file: File): boolean => {
  const mimeType = (file.type || '').toLowerCase();
  
  // First check: valid MIME type
  if (mimeType && (mimeType.startsWith('image/') || ALLOWED_IMAGE_TYPES.has(mimeType))) {
    return true;
  }
  
  // Fallback: MIME empty/unknown - check by extension
  return looksLikeImageByExtension(file.name || '');
};

/**
 * Comprehensive video validation with fallback
 */
export const isAllowedVideo = (file: File): boolean => {
  const mimeType = (file.type || '').toLowerCase();
  
  // Handle .mov files which sometimes have type 'video/quicktime'
  if (mimeType && (mimeType.startsWith('video/') || ALLOWED_VIDEO_TYPES.has(mimeType))) {
    return true;
  }
  
  // Fallback: check by extension
  return looksLikeVideoByExtension(file.name || '');
};

/**
 * Get human-readable error message for invalid files
 */
export const getFileValidationError = (file: File, type: 'image' | 'video'): string => {
  const isImage = type === 'image';
  const fileName = file.name || 'Unknown file';
  
  if (!isImage && !isAllowedVideo(file)) {
    return `"${fileName}" не является поддерживаемым видео файлом. Разрешены: MP4, WebM, MOV, AVI`;
  }
  
  if (isImage && !isAllowedImage(file)) {
    return `"${fileName}" не является поддерживаемым изображением. Разрешены: JPEG, PNG, WebP, HEIC, HEIF, AVIF`;
  }
  
  return '';
};

/**
 * Enhanced accept attribute for file inputs
 * Includes common mobile formats
 */
export const getImageAcceptAttribute = (): string => {
  return 'image/*,image/heic,image/heif,image/avif,.jpg,.jpeg,.png,.webp,.heic,.heif,.avif';
};

export const getVideoAcceptAttribute = (): string => {
  return 'video/*,.mp4,.webm,.mov,.avi';
};