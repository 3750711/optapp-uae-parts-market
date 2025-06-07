
import React, { useState } from 'react';
import CloudinaryImage from './CloudinaryImage';
import { getCatalogImageUrl } from '@/utils/previewImageUtils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  cloudinaryPublicId?: string;
  cloudinaryUrl?: string;
  size?: 'thumbnail' | 'card' | 'detail' | 'preview';
  useCatalogOptimization?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  priority = false,
  sizes,
  onLoad,
  onError,
  cloudinaryPublicId,
  cloudinaryUrl,
  size = 'card',
  useCatalogOptimization = false
}) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
    onError?.();
  };

  // Если включена каталожная оптимизация, используем такую же логику как для основных изображений
  if (useCatalogOptimization) {
    const optimizedSrc = getCatalogImageUrl(src, cloudinaryPublicId, '/placeholder.svg', cloudinaryUrl);
    
    console.log('🎨 Using catalog optimization:', {
      originalSrc: src,
      cloudinaryPublicId,
      cloudinaryUrl,
      optimizedSrc,
      imageError
    });

    return (
      <img
        src={optimizedSrc}
        alt={alt}
        className={`${className} object-contain`}
        onLoad={onLoad}
        onError={handleImageError}
        loading={priority ? 'eager' : 'lazy'}
        sizes={sizes}
      />
    );
  }

  // Debug logging
  console.log('OptimizedImage debug:', {
    src,
    cloudinaryPublicId,
    imageError,
    hasValidSrc: src && src !== '/placeholder.svg'
  });

  // Приоритет готовому URL (preview_image_url или product_images) - используем как есть
  if (src && src !== '/placeholder.svg' && !imageError) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${className} object-contain`}
        onLoad={onLoad}
        onError={handleImageError}
        loading={priority ? 'eager' : 'lazy'}
        sizes={sizes}
      />
    );
  }

  // Fallback к Cloudinary если основное изображение не загрузилось
  if (cloudinaryPublicId && imageError) {
    console.log('🔧 Using Cloudinary fallback for:', cloudinaryPublicId);
    return (
      <CloudinaryImage
        publicId={cloudinaryPublicId}
        alt={alt}
        size={size}
        className={className}
        priority={priority}
        onLoad={onLoad}
        onError={onError}
        fallbackSrc="/placeholder.svg"
      />
    );
  }

  // Финальный fallback
  return (
    <img
      src="/placeholder.svg"
      alt={alt}
      className={`${className} object-contain`}
      onLoad={onLoad}
      loading={priority ? 'eager' : 'lazy'}
      sizes={sizes}
    />
  );
};

export default OptimizedImage;
