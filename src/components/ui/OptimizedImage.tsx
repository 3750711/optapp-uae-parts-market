
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
  placeholder?: boolean;
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
  onError,
  placeholder = true
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setImageError(true);
    setIsLoading(false);
    onError?.();
  }, [onError]);

  // Generate optimized URLs for Supabase
  const generateSrcSet = (originalSrc: string) => {
    if (originalSrc.includes('placeholder.svg') || imageError) {
      return originalSrc;
    }

    if (originalSrc.includes('supabase')) {
      const baseUrl = originalSrc.split('?')[0];
      return `
        ${baseUrl}?width=400&quality=75&format=webp 400w,
        ${baseUrl}?width=800&quality=80&format=webp 800w,
        ${baseUrl}?width=1200&quality=85&format=webp 1200w
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
        ${baseUrl}?width=400&quality=75 400w,
        ${baseUrl}?width=800&quality=80 800w,
        ${baseUrl}?width=1200&quality=85 1200w
      `.trim();
    }

    return originalSrc;
  };

  if (imageError) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-gray-100 text-gray-400 rounded-lg',
        className
      )}>
        <div className="text-center p-4">
          <div className="text-2xl mb-2">📷</div>
          <div className="text-sm">Изображение недоступно</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Loading placeholder */}
      {placeholder && isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          </div>
        </div>
      )}
      
      <picture>
        {/* WebP version with srcset */}
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
            'transition-all duration-500',
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105',
            'w-full h-full object-cover',
            className
          )}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
          decoding={priority ? 'sync' : 'async'}
        />
      </picture>
    </div>
  );
};

export default OptimizedImage;
