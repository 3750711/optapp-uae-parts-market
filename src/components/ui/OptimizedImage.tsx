
import React, { useState } from 'react';
import CloudinaryImage from './CloudinaryImage';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  cloudinaryPublicId?: string;
  size?: 'thumbnail' | 'card' | 'detail' | 'preview';
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
  size = 'card'
}) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
    onError?.();
  };

  // Debug logging
  console.log('OptimizedImage debug:', {
    src,
    cloudinaryPublicId,
    imageError,
    hasValidSrc: src && src !== '/placeholder.svg'
  });

  // Приоритет готовому URL (preview_image_url) - используем Cloudinary только как fallback
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

  // Fallback к Cloudinary если основное изображение не загрузилось или нет src
  if (cloudinaryPublicId && imageError) {
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
