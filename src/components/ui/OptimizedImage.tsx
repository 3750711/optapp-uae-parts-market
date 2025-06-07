
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
  size?: 'thumbnail' | 'card' | 'detail';
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
  size = 'card'
}) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
    onError?.();
  };

  // Use catalog optimization to get the best available image
  const optimizedSrc = getCatalogImageUrl(src, cloudinaryPublicId, '/placeholder.svg', cloudinaryUrl);
  
  console.log('🎨 OptimizedImage using:', {
    originalSrc: src,
    cloudinaryPublicId,
    cloudinaryUrl,
    optimizedSrc,
    imageError
  });

  // Priority to ready URL - use as is
  if (optimizedSrc && optimizedSrc !== '/placeholder.svg' && !imageError) {
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

  // Fallback to Cloudinary if main image failed
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

  // Final fallback
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
