
import React, { useState, useCallback, useEffect } from 'react';
import { OptimizedImageVariant } from '@/hooks/useOptimizedProductImages';
import { cn } from '@/lib/utils';

interface OptimizedProductImageProps {
  image: OptimizedImageVariant;
  alt: string;
  className?: string;
  size?: 'thumbnail' | 'card' | 'gallery' | 'fullscreen';
  onLoad?: () => void;
  onError?: (error: React.SyntheticEvent<HTMLImageElement>) => void;
  'data-testid'?: string;
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
 * - Automatic retry mechanism on load failures
 * - Comprehensive error logging for debugging
 * 
 * Browser support: All modern browsers (97%+ market share)
 * Fallback: Graceful degradation to JPEG for legacy browsers
 */
export const OptimizedProductImage: React.FC<OptimizedProductImageProps> = ({
  image,
  alt,
  className = '',
  size = 'card',
  onLoad,
  onError,
  'data-testid': testId,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryAttempted, setRetryAttempted] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    
    // Detailed error logging for debugging
    console.warn('[OptimizedProductImage] Load error:', {
      alt,
      size,
      currentSrc: target.currentSrc,
      naturalWidth: target.naturalWidth,
      imageId: image.id,
      retryAttempted,
    });
    
    // Retry with JPEG fallback if this was AVIF/WebP
    if (!retryAttempted && target.currentSrc && 
        (target.currentSrc.includes('f_avif') || target.currentSrc.includes('f_webp'))) {
      console.info('[OptimizedProductImage] Retrying with JPEG fallback');
      setRetryAttempted(true);
      const imageUrl = size === 'thumbnail' ? image.thumbnail 
        : size === 'gallery' ? image.detail
        : size === 'fullscreen' ? image.zoom
        : image.card;
      target.src = imageUrl;
      return;
    }
    
    // All attempts exhausted - show placeholder
    setHasError(true);
    onError?.(e);
  }, [onError, alt, size, image, retryAttempted]);

  // Select appropriate srcSets based on size
  const avifSrcSet = image.avifSrcSets?.[size];
  const webpSrcSet = image.webpSrcSets?.[size];
  const jpegSrcSet = image.srcSets?.[size];
  const sizes = image.sizes?.[size];
  
  // Select appropriate image URL based on size
  const imageUrl = size === 'thumbnail' ? image.thumbnail 
    : size === 'gallery' ? image.detail
    : size === 'fullscreen' ? image.zoom
    : image.card;

  // Monitor missing optimized formats in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      if (!avifSrcSet || !webpSrcSet) {
        console.warn('[OptimizedProductImage] Missing optimized formats:', {
          hasAVIF: !!avifSrcSet,
          hasWebP: !!webpSrcSet,
          size,
          imageId: image.id,
          original: image.original,
        });
      }
    }
  }, [avifSrcSet, webpSrcSet, size, image.id, image.original]);

  // Validate critical data before rendering
  if (!jpegSrcSet || !sizes || !imageUrl) {
    console.error('[OptimizedProductImage] Missing required data:', {
      size,
      hasJpegSrcSet: !!jpegSrcSet,
      hasSizes: !!sizes,
      hasImageUrl: !!imageUrl,
      imageId: image.id,
    });
    
    return (
      <img
        src={image.card || '/placeholder.svg'}
        alt={alt}
        className={cn('object-contain', className)}
        data-testid={testId}
      />
    );
  }

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
          role="presentation"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          style={{
            filter: 'blur(20px) saturate(1.2)',
            transform: 'scale(1.1)',
            opacity: isLoaded ? 0 : 1,
          }}
        />
      )}
      
      {/* Full quality picture with format fallbacks */}
      <picture data-testid={testId || 'optimized-product-image'}>
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
