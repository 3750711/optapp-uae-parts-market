
import React from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  onError?: () => void;
  onLoad?: () => void;
  placeholder?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  onError,
  onLoad,
  ...props
}) => {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={onError}
      onLoad={onLoad}
      loading="lazy"
    />
  );
};

export default OptimizedImage;
