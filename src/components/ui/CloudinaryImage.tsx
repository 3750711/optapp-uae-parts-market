
import React, { useState, useCallback } from 'react';

interface CloudinaryImageProps {
  publicId: string;
  alt: string;
  className?: string;
  size?: 'thumbnail' | 'card' | 'detail';
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
}

const CloudinaryImage: React.FC<CloudinaryImageProps> = ({
  publicId,
  alt,
  className = '',
  size = 'card',
  priority = false,
  onLoad,
  onError,
  fallbackSrc = '/placeholder.svg'
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Size configurations for different use cases
  const sizeConfig = {
    thumbnail: { width: 120, height: 90, quality: 'auto:low' as const },
    card: { width: 400, height: undefined, quality: 'auto:low' as const },
    detail: { width: 800, height: undefined, quality: 'auto:good' as const }
  };

  const config = sizeConfig[size];

  // Generate optimized Cloudinary URL with correct cloud name
  const generateCloudinaryUrl = (format: 'webp' | 'jpg' = 'webp') => {
    const baseUrl = 'https://res.cloudinary.com/dcuziurrb/image/upload';
    
    let transformations: string[];
    
    if (size === 'thumbnail' && config.height) {
      // For thumbnails, use c_fit to preserve image proportions
      transformations = [
        `w_${config.width}`,
        `h_${config.height}`,
        `c_fit`,
        `q_${config.quality}`,
        `f_${format}`,
        'fl_progressive'
      ];
    } else {
      // For other sizes, use original logic
      transformations = [
        `w_${config.width}`,
        `c_limit`,
        `q_${config.quality}`,
        `f_${format}`,
        'fl_progressive'
      ];
    }

    return `${baseUrl}/${transformations.join(',')}/${publicId}`;
  };

  const webpUrl = generateCloudinaryUrl('webp');
  const fallbackUrl = generateCloudinaryUrl('jpg');

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    console.log('Cloudinary image error for publicId:', publicId);
    setImageError(true);
    onError?.();
  }, [onError, publicId]);

  if (imageError) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={`${className} object-contain`}
        onLoad={handleLoad}
        loading={priority ? 'eager' : 'lazy'}
      />
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && !priority && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse rounded" />
      )}
      
      <picture>
        <source srcSet={webpUrl} type="image/webp" />
        <img
          src={fallbackUrl}
          alt={alt}
          className={`${className} object-contain transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
        />
      </picture>
    </div>
  );
};

export default CloudinaryImage;
