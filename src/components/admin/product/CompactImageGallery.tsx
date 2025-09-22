import React, { useState, useCallback } from 'react';
import { Package, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';

interface CompactImageGalleryProps {
  images: Array<{ url: string; is_primary?: boolean }>;
  title: string;
  onImageClick?: (imageUrl: string) => void;
  className?: string;
}

export const CompactImageGallery: React.FC<CompactImageGalleryProps> = ({
  images,
  title,
  onImageClick,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const navigate = useCallback((direction: 'prev' | 'next') => {
    setCurrentIndex(prev => {
      if (direction === 'prev') return prev === 0 ? images.length - 1 : prev - 1;
      return prev === images.length - 1 ? 0 : prev + 1;
    });
  }, [images.length]);

  const hasMultipleImages = images.length > 1;
  const currentImage = images[currentIndex];

  // Swipe handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    (e.currentTarget as HTMLElement).dataset.startX = touch.clientX.toString();
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const startX = parseFloat((e.currentTarget as HTMLElement).dataset.startX || '0');
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    
    if (Math.abs(diff) > 50) { // Minimum swipe distance
      if (diff > 0) navigate('next');
      else navigate('prev');
    }
  }, [navigate]);

  if (!images.length) {
    return (
      <div className={`relative h-48 bg-muted flex items-center justify-center ${className}`}>
        <Package className="h-12 w-12 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div 
      className={`relative h-48 bg-muted overflow-hidden group ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main Image */}
      <div 
        className="relative w-full h-full cursor-zoom-in"
        onClick={() => onImageClick?.(currentImage.url)}
      >
        <img
          src={currentImage.url}
          alt={title}
          className="w-full h-full object-cover transition-all duration-300"
          loading="lazy"
          decoding="async"
        />
        
        {/* Zoom Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Navigation - Only for multiple images */}
      {hasMultipleImages && (
        <>
          {/* Previous Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate('prev');
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Предыдущее фото"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          {/* Next Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate('next');
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Следующее фото"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          
          {/* Compact Counter */}
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {currentIndex + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  );
};