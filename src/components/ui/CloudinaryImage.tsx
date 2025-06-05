
import React, { useState } from 'react';
import { getProductImageUrl, getResponsiveImageUrls } from '@/utils/cloudinaryUtils';

interface CloudinaryImageProps {
  publicId: string;
  alt: string;
  size?: 'thumbnail' | 'card' | 'detail' | 'preview';
  className?: string;
  responsive?: boolean;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
}

const CloudinaryImage: React.FC<CloudinaryImageProps> = ({
  publicId,
  alt,
  size = 'card',
  className = '',
  responsive = false,
  priority = false,
  onLoad,
  onError,
  fallbackSrc = '/placeholder.svg'
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageLoad = () => {
    setImageLoading(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
    onError?.();
  };

  // Use fallback if no publicId or error occurred
  if (!publicId || imageError) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
        onLoad={handleImageLoad}
        loading={priority ? 'eager' : 'lazy'}
      />
    );
  }

  if (responsive) {
    const urls = getResponsiveImageUrls(publicId);
    return (
      <picture className={className}>
        <source media="(max-width: 768px)" srcSet={urls.mobile} />
        <source media="(max-width: 1024px)" srcSet={urls.tablet} />
        <img
          src={urls.desktop}
          alt={alt}
          className="w-full h-full object-cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={priority ? 'eager' : 'lazy'}
        />
      </picture>
    );
  }

  return (
    <img
      src={getProductImageUrl(publicId, size)}
      alt={alt}
      className={className}
      onLoad={handleImageLoad}
      onError={handleImageError}
      loading={priority ? 'eager' : 'lazy'}
    />
  );
};

export default CloudinaryImage;
