
import React, { useState, useCallback } from 'react';
import { OptimizedImageVariant } from '@/hooks/useOptimizedProductImages';
import { cn } from '@/lib/utils';

interface OptimizedProductImageProps {
  image: OptimizedImageVariant;
  alt: string;
  className?: string;
  size?: 'thumbnail' | 'card' | 'gallery' | 'fullscreen';
  onLoad?: () => void;
  onError?: (e?: any) => void;
}

/**
 * OptimizedProductImage Component
 * 
 * Renders optimized images using <picture> element with:
 * - AVIF format (best compression, ~50% smaller than JPEG)
 * - WebP fallback (~30% smaller than JPEG)  
 * - JPEG fallback for older browsers
 * - Blur-up placeholder for instant display
 * - Responsive srcSet for different screen sizes
 */
export const OptimizedProductImage: React.FC<OptimizedProductImageProps> = ({
  image,
  alt,
  className = '',
  size = 'card',
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback((e: any) => {
    setHasError(true);
    onError?.(e);
  }, [onError]);

  // Select appropriate srcSets based on size
  const avifSrcSet = image.avifSrcSets?.[size];
  const webpSrcSet = image.webpSrcSets?.[size];
  const jpegSrcSet = image.srcSets[size];
  const sizes = image.sizes[size];
  
  // Select appropriate image URL based on size
  const imageUrl = size === 'thumbnail' ? image.thumbnail 
    : size === 'gallery' ? image.detail
    : size === 'fullscreen' ? image.zoom
    : image.card;

  if (hasError) {
    return (
      <img
        src="/placeholder.svg"
        alt={alt}
        className={cn('object-contain', className)}
      />
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Blur placeholder (loads instantly, ~1-2KB) */}
      {image.blurDataUrl && (
        <img
          src={image.blurDataUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          style={{
            filter: 'blur(20px) saturate(1.2)',
            transform: 'scale(1.1)',
            opacity: isLoaded ? 0 : 1,
          }}
        />
      )}
      
      {/* Full quality picture with format fallbacks */}
      <picture>
        {/* AVIF - Best compression (~50% smaller than JPEG) */}
        {avifSrcSet && (
          <source
            type="image/avif"
            srcSet={avifSrcSet}
            sizes={sizes}
          />
        )}
        
        {/* WebP - Good compression (~30% smaller than JPEG) */}
        {webpSrcSet && (
          <source
            type="image/webp"
            srcSet={webpSrcSet}
            sizes={sizes}
          />
        )}
        
        {/* JPEG - Universal fallback */}
        <img
          srcSet={jpegSrcSet}
          sizes={sizes}
          src={imageUrl}
          alt={alt}
          className={cn(
            'relative z-10 transition-opacity duration-300',
            className
          )}
          style={{ opacity: isLoaded ? 1 : 0 }}
          onLoad={handleLoad}
          onError={handleError}
          loading={image.priority ? 'eager' : 'lazy'}
          decoding={image.priority ? 'sync' : 'async'}
        />
      </picture>
    </div>
  );
};

export default OptimizedProductImage;
