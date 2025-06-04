
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
  onClick?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  onError,
  onLoad,
  onClick,
  ...props
}) => {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={onError}
      onLoad={onLoad}
      onClick={onClick}
      loading="lazy"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    />
  );
};

export default OptimizedImage;
