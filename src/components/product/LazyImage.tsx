import React from 'react';
import { useLazyImage } from '@/hooks/useLazyImage';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = '/placeholder.svg',
  onLoad,
  onError,
  priority = false
}) => {
  const { imgRef, imageSrc, isLoaded, hasError } = useLazyImage({ 
    src, 
    fallbackSrc 
  });

  const handleLoad = () => {
    onLoad?.();
  };

  const handleError = () => {
    onError?.();
  };

  return (
    <div ref={imgRef} className="relative">
      {!isLoaded && !priority && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded" />
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
      />
    </div>
  );
};

export default LazyImage;