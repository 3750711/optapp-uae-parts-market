
import React, { useState } from 'react';
import { Play } from 'lucide-react';

interface MediaItemProps {
  url: string;
  type: 'image' | 'video';
  alt?: string;
  className?: string;
  lazy?: boolean;
  showPlayButton?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const MediaItem: React.FC<MediaItemProps> = ({
  url,
  type,
  alt = '',
  className = '',
  lazy = true,
  showPlayButton = true,
  onLoad,
  onError
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  if (hasError) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <div className="text-gray-400 text-center p-4">
          <div className="text-sm">Не удалось загрузить медиа</div>
        </div>
      </div>
    );
  }

  if (type === 'video') {
    return (
      <div className={`relative ${className}`}>
        <video 
          src={url}
          className="w-full h-full object-contain"
          preload="metadata"
          muted
          onLoadedData={handleLoad}
          onError={handleError}
        />
        {showPlayButton && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 pointer-events-none">
            <Play className="w-8 h-8 text-white" fill="white" />
          </div>
        )}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <img 
        src={url}
        alt={alt}
        className="w-full h-full object-contain"
        loading={lazy ? "lazy" : "eager"}
        onLoad={handleLoad}
        onError={handleError}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
};

export default MediaItem;
