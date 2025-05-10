
import React, { useState, useRef } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductGalleryProps {
  images: string[];
  title: string;
  compressed?: boolean;
}

const SWIPE_THRESHOLD = 50; // минимальное расстояние в пикселях для активации свайпа

const ProductGallery: React.FC<ProductGalleryProps> = ({ images, title, compressed = true }) => {
  const [activeImage, setActiveImage] = useState<string>(images[0] || "");
  const [isOpen, setIsOpen] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string>("");

  // для touch-событий
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleImageClick = (image: string) => {
    setFullScreenImage(image);
    setIsOpen(true);
  };

  const handleThumbnailClick = (image: string) => {
    setActiveImage(image);
  };

  const handleNextImage = () => {
    const currentIndex = images.indexOf(fullScreenImage);
    const nextIndex = (currentIndex + 1) % images.length;
    setFullScreenImage(images[nextIndex]);
  };

  const handlePrevImage = () => {
    const currentIndex = images.indexOf(fullScreenImage);
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setFullScreenImage(images[prevIndex]);
  };

  // Touch events для свайпа на мобильных
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current !== null) {
      touchEndX.current = e.touches[0].clientX;
    }
  };

  const onTouchEnd = () => {
    if (
      touchStartX.current !== null &&
      touchEndX.current !== null
    ) {
      const diffX = touchStartX.current - touchEndX.current;

      if (diffX > SWIPE_THRESHOLD) {
        // свайп влево -> следующая картинка
        handleNextImage();
      } else if (diffX < -SWIPE_THRESHOLD) {
        // свайп вправо -> предыдущая картинка
        handlePrevImage();
      }
    }
    // Сбросить значения
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div>
      <div 
        className="mb-4 overflow-hidden rounded-lg cursor-pointer"
        onClick={() => handleImageClick(activeImage)}
      >
        <AspectRatio ratio={16 / 9}>
          <img 
            src={activeImage} 
            alt={title}
            className={`w-full h-full ${compressed ? 'object-contain' : 'object-cover'} transition-transform duration-200 hover:scale-105`}
          />
        </AspectRatio>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {images.map((image, index) => (
          <div 
            key={index} 
            className={`overflow-hidden rounded-md border-2 aspect-square ${
              activeImage === image ? 'border-optapp-yellow' : 'border-transparent'
            } hover:border-optapp-yellow cursor-pointer`}
            onClick={() => handleThumbnailClick(image)}
          >
            <img 
              src={image} 
              alt={`${title} ${index + 1}`} 
              className={`w-full h-full ${compressed ? 'object-contain' : 'object-cover'}`}
            />
          </div>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[90vw] h-[90vh] p-0">
          <div
            className="relative w-full h-full flex items-center justify-center bg-black/95"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 text-white hover:bg-white/20 z-50"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={handlePrevImage}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
            
            <img
              src={fullScreenImage}
              alt={title}
              className="max-h-full max-w-full object-contain"
              loading="lazy"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductGallery;
