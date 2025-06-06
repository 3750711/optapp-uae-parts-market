
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

  // Use Cloudinary if publicId is available and no error occurred
  if (cloudinaryPublicId && !imageError) {
    return (
      <CloudinaryImage
        publicId={cloudinaryPublicId}
        alt={alt}
        size={size}
        className={className}
        priority={priority}
        onLoad={onLoad}
        onError={handleImageError}
        fallbackSrc={src}
      />
    );
  }

  // Fallback to regular image with object-contain
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
};

export default OptimizedImage;
