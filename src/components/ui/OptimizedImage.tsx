
import React, { useState } from 'react';
import CloudinaryImage from './CloudinaryImage';
import { getCatalogImageUrl } from '@/utils/previewImageUtils';
import { extractPublicIdFromUrl } from '@/utils/cloudinaryUtils';

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
  const [fallbackUsed, setFallbackUsed] = useState(false);

  const handleImageError = () => {
    console.log('🔴 Image error for:', src);
    if (!fallbackUsed) {
      setFallbackUsed(true);
    } else {
      setImageError(true);
    }
    onError?.();
  };

  const handleImageLoad = () => {
    console.log('✅ Image loaded:', src);
    onLoad?.();
  };

  // Try to get a usable public_id
  const workingPublicId = cloudinaryPublicId || 
    (cloudinaryUrl ? extractPublicIdFromUrl(cloudinaryUrl) : null) ||
    (src && src.includes('cloudinary.com') ? extractPublicIdFromUrl(src) : null);

  console.log('🎨 OptimizedImage analysis:', {
    originalSrc: src,
    cloudinaryPublicId,
    cloudinaryUrl,
    workingPublicId,
    imageError,
    fallbackUsed
  });

  // If we have a working public_id and no errors, use CloudinaryImage
  if (workingPublicId && !imageError && !fallbackUsed) {
    return (
      <CloudinaryImage
        publicId={workingPublicId}
        alt={alt}
        size={size}
        className={className}
        priority={priority}
        onLoad={handleImageLoad}
        onError={handleImageError}
        fallbackSrc="/placeholder.svg"
      />
    );
  }

  // Use original/optimized URL with fallback handling
  const imageUrl = fallbackUsed ? '/placeholder.svg' : (getCatalogImageUrl(src, cloudinaryPublicId, '/placeholder.svg', cloudinaryUrl));

  if (imageError || imageUrl === '/placeholder.svg') {
    return (
      <img
        src="/placeholder.svg"
        alt={alt}
        className={`${className} object-contain`}
        onLoad={handleImageLoad}
        loading={priority ? 'eager' : 'lazy'}
        sizes={sizes}
      />
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={`${className} object-contain`}
      onLoad={handleImageLoad}
      onError={handleImageError}
      loading={priority ? 'eager' : 'lazy'}
      sizes={sizes}
    />
  );
};

export default OptimizedImage;
