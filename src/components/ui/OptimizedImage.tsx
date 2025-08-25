
import React from 'react';
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
  // Use enhanced fallback system with native event handlers
  const { 
    currentSrc, 
    isLoading, 
    hasError, 
    sourceType, 
    retry,
    handleImageLoad,
    handleImageError 
  } = useImageFallback({
    src,
    cloudinaryPublicId,
    cloudinaryUrl,
    fallbackSrc: '/placeholder.svg',
    size
  });

  const handleLoad = () => {
    handleImageLoad();
    onLoad?.();
  };

  const handleError = () => {
    handleImageError();
    onError?.();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Loading placeholder */}
      {isLoading && !priority && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Загрузка...</div>
        </div>
      )}
      
      {/* Debug indicator for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-1 left-1 bg-black/80 text-white text-xs px-2 py-1 rounded z-10">
          {sourceType} - {isLoading ? 'loading' : hasError ? 'error' : 'ready'}
        </div>
      )}
      
      <img
        src={currentSrc}
        alt={alt}
        className={`${className} object-contain transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        sizes={sizes}
        style={{
          opacity: isLoading || hasError ? 0 : 1
        }}
      />
      
      {/* Error state with retry */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground">
          <span className="text-sm mb-2">Ошибка загрузки</span>
          <button 
            onClick={retry}
            className="text-xs px-3 py-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded transition-colors"
          >
            Повторить
          </button>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
