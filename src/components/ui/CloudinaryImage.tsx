
import React, { useState, useCallback } from 'react';

interface CloudinaryImageProps {
  publicId: string;
  alt: string;
  className?: string;
  size?: 'thumbnail' | 'card' | 'detail' | 'telegramCard';
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
    detail: { width: 800, height: undefined, quality: 'auto:good' as const },
    telegramCard: { width: 720, height: 540, quality: 'auto:good' as const }
  };

  const config = sizeConfig[size];

  // Generate optimized Cloudinary URL with correct cloud name
  const generateCloudinaryUrl = () => {
    const baseUrl = 'https://res.cloudinary.com/dcuziurrb/image/upload';
    
    let transformations: string[];
    
    if (size === 'telegramCard') {
      // Special transformations for telegram cards with sharpening
      transformations = [
        'f_auto',
        'q_auto:good',
        'dpr_auto',
        'c_fill',
        'g_auto',
        'e_sharpen:100',
        `w_${config.width}`,
        `h_${config.height}`,
        'fl_progressive'
      ];
    } else if (size === 'thumbnail' && config.height) {
      // For thumbnails, use c_fit to preserve image proportions
      transformations = [
        `w_${config.width}`,
        `h_${config.height}`,
        `c_fit`,
        `q_${config.quality}`,
        'f_auto',
        'fl_progressive'
      ];
    } else {
      // For other sizes, use original logic
      transformations = [
        `w_${config.width}`,
        `c_limit`,
        `q_${config.quality}`,
        'f_auto',
        'fl_progressive'
      ];
    }

    return `${baseUrl}/${transformations.join(',')}/${publicId}`;
  };

  const imageUrl = generateCloudinaryUrl();

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
      
      <img
        src={imageUrl}
        alt={alt}
        className={`${className} object-contain transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
      />
    </div>
  );
};

export default CloudinaryImage;
