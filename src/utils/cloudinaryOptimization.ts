export interface CloudinaryTransformOptions {
  width: number;
  height?: number;
  quality?: 'auto' | 'auto:good' | 'auto:eco' | 'auto:low' | number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  crop?: 'limit' | 'fill' | 'scale' | 'fit' | 'pad';
  gravity?: 'auto' | 'center' | 'face';
}

export interface OptimizedImage {
  original: string;
  optimized: string;
  srcSet: string;
}

// Cache для оптимизированных URL
const urlCache = new Map<string, OptimizedImage>();

/**
 * Проверяет, является ли URL Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('cloudinary.com') && 
         url.includes('/upload/') && 
         !url.includes('placeholder.svg');
}

/**
 * Добавляет Cloudinary трансформации в URL
 */
export function optimizeCloudinaryUrl(
  url: string, 
  options: CloudinaryTransformOptions
): string {
  if (!isCloudinaryUrl(url)) return url;
  
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;
  
  // Проверка: есть ли уже трансформации?
  const afterUpload = url.slice(uploadIndex + 8);
  const hasTransformations = /^[wchqfgdl]_/.test(afterUpload);
  
  // Если трансформации уже есть - возвращаем как есть
  if (hasTransformations) {
    return url;
  }
  
  const {
    width, 
    height, 
    quality = 'auto:good', 
    format = 'auto', 
    crop = 'limit',
    gravity
  } = options;
  
  const transforms = [
    `w_${width}`,
    height && `h_${height}`,
    `c_${crop}`,
    gravity && `g_${gravity}`,
    `q_${quality}`,
    `f_${format}`,
    'dpr_auto',
    'fl_progressive',
    'fl_lossy'
  ].filter(Boolean).join(',');
  
  const baseUrl = url.slice(0, uploadIndex + 8);
  const assetPath = url.slice(uploadIndex + 8);
  
  return `${baseUrl}${transforms}/${assetPath}`;
}

/**
 * Генерирует srcSet для responsive images
 */
export function generateCloudinarySrcSet(
  url: string, 
  baseWidth: number, 
  baseHeight?: number
): string {
  if (!isCloudinaryUrl(url)) return '';
  
  return [1, 1.5, 2].map(dpr => {
    const width = Math.round(baseWidth * dpr);
    const height = baseHeight ? Math.round(baseHeight * dpr) : undefined;
    
    return `${optimizeCloudinaryUrl(url, {width, height})} ${dpr}x`;
  }).join(', ');
}

/**
 * Получить оптимизированный URL с кешированием
 */
export function getOptimizedImage(
  url: string, 
  options: CloudinaryTransformOptions
): OptimizedImage {
  const cacheKey = `${url}:${JSON.stringify(options)}`;
  
  if (urlCache.has(cacheKey)) {
    return urlCache.get(cacheKey)!;
  }
  
  const result: OptimizedImage = {
    original: url,
    optimized: optimizeCloudinaryUrl(url, options),
    srcSet: generateCloudinarySrcSet(url, options.width, options.height)
  };
  
  urlCache.set(cacheKey, result);
  
  return result;
}

/**
 * Пресеты для разных use cases
 */
export const CLOUDINARY_PRESETS = {
  CATALOG_CARD: {
    width: 400,
    height: 300,
    quality: 'auto:good' as const,
    format: 'auto' as const,
    crop: 'limit' as const
  },
  CATALOG_CARD_MOBILE: {
    width: 320,
    height: 240,
    quality: 'auto:eco' as const,
    format: 'auto' as const,
    crop: 'limit' as const
  },
  SELLER_CARD: {
    width: 400,
    height: 280,
    quality: 'auto:good' as const,
    format: 'auto' as const,
    crop: 'limit' as const
  },
  THUMBNAIL: {
    width: 200,
    height: 200,
    quality: 'auto:eco' as const,
    format: 'auto' as const,
    crop: 'fill' as const,
    gravity: 'auto' as const
  }
} as const;

/**
 * Очистить cache (для тестирования)
 */
export function clearOptimizationCache(): void {
  urlCache.clear();
}
