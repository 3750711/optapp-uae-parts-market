
import React, { useState } from 'react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface StoreImage {
  id: string;
  url: string;
  is_primary?: boolean;
}

interface StoreImageGalleryProps {
  images: StoreImage[];
  storeName: string;
  className?: string;
}

const StoreImageGallery: React.FC<StoreImageGalleryProps> = ({
  images,
  storeName,
  className = ''
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const openModal = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeModal = () => {
    setSelectedImageIndex(null);
  };

  const goToPrevious = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex(
        selectedImageIndex > 0 ? selectedImageIndex - 1 : images.length - 1
      );
    }
  };

  const goToNext = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex(
        selectedImageIndex < images.length - 1 ? selectedImageIndex + 1 : 0
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') closeModal();
  };

  if (!images || images.length === 0) {
    return (
      <div className={`aspect-square bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-muted-foreground">
          <div className="text-4xl mb-2">🏪</div>
          <div className="text-sm">Нет изображений</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={className}>
        {/* Main image */}
        <div 
          className="aspect-square overflow-hidden rounded-lg mb-4 cursor-pointer group"
          onClick={() => openModal(0)}
        >
          <OptimizedImage
            src={images[0].url}
            alt={`${storeName} - главное фото`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            priority
          />
        </div>

        {/* Thumbnail grid */}
        {images.length > 1 && (
          <div className="grid grid-cols-3 gap-2">
            {images.slice(1, 4).map((image, index) => (
              <div
                key={image.id}
                className="aspect-square overflow-hidden rounded-md cursor-pointer group"
                onClick={() => openModal(index + 1)}
              >
                <OptimizedImage
                  src={image.url}
                  alt={`${storeName} - фото ${index + 2}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            ))}
            
            {/* Show remaining count if more than 4 images */}
            {images.length > 4 && (
              <div 
                className="aspect-square bg-muted rounded-md flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => openModal(4)}
              >
                <span className="text-sm font-medium">
                  +{images.length - 4}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal for full-size images */}
      <Dialog open={selectedImageIndex !== null} onOpenChange={() => closeModal()}>
        <DialogContent 
          className="max-w-4xl w-full p-0 border-0"
          onKeyDown={handleKeyDown}
        >
          {selectedImageIndex !== null && (
            <div className="relative bg-black">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                onClick={closeModal}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Navigation buttons */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                    onClick={goToPrevious}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                    onClick={goToNext}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}

              {/* Image */}
              <div className="flex items-center justify-center min-h-[50vh] max-h-[80vh]">
                <OptimizedImage
                  src={images[selectedImageIndex].url}
                  alt={`${storeName} - фото ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {selectedImageIndex + 1} / {images.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StoreImageGallery;
