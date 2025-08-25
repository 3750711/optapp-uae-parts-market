
import React, { useState, useCallback } from 'react';
import CloudinaryImage from './CloudinaryImage';
import { getCatalogImageUrl } from '@/utils/previewImageUtils';
import { extractPublicIdFromUrl } from '@/utils/cloudinaryUtils';
import { useImageFallback } from '@/hooks/useImageFallback';

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
  const [isLoaded, setIsLoaded] = useState(false);

  // Use enhanced fallback system
  const { currentSrc, isLoading, hasError, sourceType, retry } = useImageFallback({
    src,
    cloudinaryPublicId,
    cloudinaryUrl,
    fallbackSrc: '/placeholder.svg',
    size
  });

  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleImageError = useCallback(() => {
    onError?.();
    // The fallback hook will automatically try the next source
  }, [onError]);

  return (
    <div className={`relative ${className}`}>
      {/* Loading placeholder */}
      {(isLoading || !isLoaded) && !priority && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse rounded" />
      )}
      
      {/* Debug indicator for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1 py-0.5 rounded z-10">
          {sourceType}
        </div>
      )}
      
      <img
        src={currentSrc}
        alt={alt}
        className={`${className} object-contain transition-opacity duration-300 ${
          isLoaded && !hasError ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        sizes={sizes}
      />
      
      {/* Error state with retry */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-500">
          <span className="text-sm mb-2">Ошибка загрузки</span>
          <button 
            onClick={retry}
            className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            Повторить
          </button>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
