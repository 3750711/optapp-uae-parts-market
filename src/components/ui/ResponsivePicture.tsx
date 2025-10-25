
import React, { useState, useCallback } from 'react';
import { generatePictureSources, RESPONSIVE_PRESETS, isCloudinaryUrl } from '@/utils/cloudinaryResponsive';

interface ResponsivePictureProps {
  src: string;
  alt: string;
  className?: string;
  preset?: keyof typeof RESPONSIVE_PRESETS;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
}

/**
 * ResponsivePicture Component
 * 
 * Modern <picture> element with:
 * - AVIF format (best compression, ~50% smaller than JPEG)
 * - WebP fallback (~30% smaller than JPEG)
 * - JPEG fallback for older browsers
 * - Blur-up placeholder for perceived performance
 * - Responsive srcSet for all formats
 */
export const ResponsivePicture: React.FC<ResponsivePictureProps> = ({
  src,
  alt,
  className = '',
  preset = 'card',
  priority = false,
  onLoad,
  onError,
  fallbackSrc = '/placeholder.svg'
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    console.log('Picture element error for src:', src);
    setImageError(true);
    onError?.();
  }, [onError, src]);

  // Generate picture sources with all format variants
  const pictureSources = generatePictureSources(src, preset);

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

  // For non-Cloudinary URLs, use simple img tag
  if (!isCloudinaryUrl(src)) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
      />
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Blur placeholder (loads instantly, ~1-2KB) */}
      {pictureSources.blurDataUrl && (
        <img
          src={pictureSources.blurDataUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          style={{
            filter: 'blur(20px) saturate(1.2)',
            transform: 'scale(1.1)', // Remove blur edge artifacts
            opacity: isLoaded ? 0 : 1,
          }}
        />
      )}
      
      {/* Full quality picture with format fallbacks */}
      <picture>
        {/* AVIF - Best compression (~50% smaller than JPEG) */}
        {pictureSources.avifSrcSet && (
          <source
            type="image/avif"
            srcSet={pictureSources.avifSrcSet}
            sizes={pictureSources.sizes}
          />
        )}
        
        {/* WebP - Good compression (~30% smaller than JPEG) */}
        {pictureSources.webpSrcSet && (
          <source
            type="image/webp"
            srcSet={pictureSources.webpSrcSet}
            sizes={pictureSources.sizes}
          />
        )}
        
        {/* JPEG - Universal fallback */}
        <img
          srcSet={pictureSources.jpegSrcSet}
          sizes={pictureSources.sizes}
          src={src}
          alt={alt}
          className={`${className} relative z-10 transition-opacity duration-300`}
          style={{ opacity: isLoaded ? 1 : 0 }}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
        />
      </picture>
    </div>
  );
};

export default ResponsivePicture;
