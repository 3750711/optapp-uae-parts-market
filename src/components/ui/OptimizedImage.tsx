
import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  onLoad,
  onError
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setImageError(true);
    onError?.();
  }, [onError]);

  // Generate WebP and responsive image URLs
  const generateSrcSet = (originalSrc: string) => {
    if (originalSrc.includes('placeholder.svg') || imageError) {
      return originalSrc;
    }

    // For Supabase storage, we can add transformation parameters
    if (originalSrc.includes('supabase')) {
      const baseUrl = originalSrc.split('?')[0];
      return `
        ${baseUrl}?width=400&format=webp 400w,
        ${baseUrl}?width=800&format=webp 800w,
        ${baseUrl}?width=1200&format=webp 1200w
      `.trim();
    }

    return originalSrc;
  };

  const generateFallbackSrcSet = (originalSrc: string) => {
    if (originalSrc.includes('placeholder.svg') || imageError) {
      return originalSrc;
    }

    if (originalSrc.includes('supabase')) {
      const baseUrl = originalSrc.split('?')[0];
      return `
        ${baseUrl}?width=400 400w,
        ${baseUrl}?width=800 800w,
        ${baseUrl}?width=1200 1200w
      `.trim();
    }

    return originalSrc;
  };

  if (imageError) {
    return (
      <img
        src="/placeholder.svg"
        alt={alt}
        className={cn('object-contain', className)}
        width={width}
        height={height}
      />
    );
  }

  return (
    <picture>
      {/* WebP version */}
      <source
        srcSet={generateSrcSet(src)}
        sizes={sizes}
        type="image/webp"
      />
      
      {/* Fallback to original format */}
      <img
        src={imageError ? '/placeholder.svg' : src}
        srcSet={generateFallbackSrcSet(src)}
        sizes={sizes}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          'object-contain',
          className
        )}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
      />
    </picture>
  );
};

export default OptimizedImage;
