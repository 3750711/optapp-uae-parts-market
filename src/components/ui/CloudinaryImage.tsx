
import React, { useState, useCallback } from 'react';

interface CloudinaryImageProps {
  publicId: string;
  alt: string;
  className?: string;
  size?: 'thumbnail' | 'card' | 'detail' | 'telegramCard' | 'preview';
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
    thumbnail: { width: 200, height: 200, quality: 'auto:good' as const },
    card: { width: 600, height: 450, quality: 'auto:good' as const },
    detail: { width: 1200, height: undefined, quality: 'auto:best' as const },
    telegramCard: { width: 720, height: 540, quality: 'auto:good' as const },
    preview: { width: 800, height: undefined, quality: 'auto:good' as const }
  };

  const config = sizeConfig[size];

  // Generate blur placeholder URL (tiny, blurred image for instant display)
  const generateBlurPlaceholderUrl = () => {
    const baseUrl = 'https://res.cloudinary.com/dcuziurrb/image/upload';
    const transformations = [
      'w_30',           // Tiny width
      'h_30',           // Tiny height
      'c_fill',         // Fill to ensure aspect ratio
      'q_1',            // Minimal quality
      'e_blur:1000',    // Heavy blur
      'f_auto'          // Auto format
    ];
    return `${baseUrl}/${transformations.join(',')}/${publicId}`;
  };

  // Generate optimized Cloudinary URL with correct cloud name
  const generateCloudinaryUrl = () => {
    const baseUrl = 'https://res.cloudinary.com/dcuziurrb/image/upload';
    
    let transformations: string[];
    
    if (size === 'preview') {
      // Optimal transformations for preview (~100KB, high quality)
      transformations = [
        'f_auto',           // Auto format (WebP/AVIF when supported)
        'q_auto:good',      // Good quality with smart compression
        'dpr_auto',         // Adapt to device pixel density
        'c_limit',          // Limit size while preserving aspect ratio
        `w_${config.width}`,
        'fl_progressive'    // Progressive loading
      ];
    } else if (size === 'telegramCard') {
      // Special transformations for telegram cards WITHOUT cropping
      transformations = [
        'f_auto',           // Auto format (WebP/AVIF when supported)
        'q_auto:good',      // Good quality with smart compression
        'dpr_auto',         // Adapt to device pixel density
        'c_fit',            // Fit image without cropping (preserves aspect ratio)
        'g_center',         // Center positioning
        'e_sharpen:100',    // Sharpening for better quality
        `w_${config.width}`,
        `h_${config.height}`,
        'fl_progressive'    // Progressive loading
      ];
    } else if (size === 'thumbnail' && config.height) {
      // For thumbnails, use c_fit to preserve image proportions
      transformations = [
        `w_${config.width}`,
        `h_${config.height}`,
        `c_fit`,
        `g_center`,
        `q_${config.quality}`,
        'f_auto',
        'dpr_auto',
        'fl_progressive'
      ];
    } else if (size === 'card' && config.height) {
      // For card size, use c_fit to preserve aspect ratio WITHOUT cropping
      transformations = [
        `w_${config.width}`,
        `h_${config.height}`,
        `c_fit`,
        `g_center`,
        `q_${config.quality}`,
        'f_auto',
        'dpr_auto',
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
  const blurPlaceholderUrl = generateBlurPlaceholderUrl();

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
    <div className="relative w-full h-full overflow-hidden">
      {/* Blur placeholder (loads instantly, ~1-2KB) */}
      <img
        src={blurPlaceholderUrl}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
        style={{
          filter: 'blur(20px) saturate(1.2)',
          transform: 'scale(1.1)', // Remove blur edge artifacts
          opacity: isLoaded ? 0 : 1,
        }}
      />
      
      {/* Full quality image (fades in smoothly) */}
      <img
        src={imageUrl}
        alt={alt}
        className={`${className} relative z-10 transition-opacity duration-300`}
        style={{ opacity: isLoaded ? 1 : 0 }}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
      />
    </div>
  );
};

export default CloudinaryImage;
