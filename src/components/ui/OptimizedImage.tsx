
import React, { useState, useCallback } from 'react';
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
  const [isLoaded, setIsLoaded] = useState(false);

  const handleImageError = useCallback(() => {
    console.log('Image loading error for src:', src);
    setImageError(true);
    onError?.();
  }, [src, onError]);

  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  // Determine the best public_id to use
  const workingPublicId = cloudinaryPublicId || 
    (cloudinaryUrl && cloudinaryUrl.includes('cloudinary.com') ? extractPublicIdFromUrl(cloudinaryUrl) : null) ||
    (src && src.includes('cloudinary.com') ? extractPublicIdFromUrl(src) : null);

  console.log('OptimizedImage debug:', {
    src,
    cloudinaryPublicId,
    cloudinaryUrl,
    workingPublicId,
    imageError
  });

  // Use CloudinaryImage if we have a valid public_id and no errors
  if (workingPublicId && !imageError) {
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

  // Fallback to regular image with optimized URL
  const imageUrl = imageError ? '/placeholder.svg' : (getCatalogImageUrl(src, cloudinaryPublicId, '/placeholder.svg', cloudinaryUrl));

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && !priority && !imageError && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse rounded" />
      )}
      <img
        src={imageUrl}
        alt={alt}
        className={`${className} object-contain transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        sizes={sizes}
      />
    </div>
  );
};

export default OptimizedImage;
