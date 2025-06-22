
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
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleImageError = useCallback(() => {
    if (!fallbackUsed) {
      setFallbackUsed(true);
    } else {
      setImageError(true);
    }
    onError?.();
  }, [fallbackUsed, onError]);

  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  // Try to get a usable public_id
  const workingPublicId = cloudinaryPublicId || 
    (cloudinaryUrl ? extractPublicIdFromUrl(cloudinaryUrl) : null) ||
    (src && src.includes('cloudinary.com') ? extractPublicIdFromUrl(src) : null);

  // If we have a working public_id and no errors, use optimized CloudinaryImage
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
    <div className={`relative ${className}`}>
      {!isLoaded && !priority && (
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
