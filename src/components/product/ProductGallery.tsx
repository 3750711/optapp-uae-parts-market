import React, { useState, useEffect, useCallback } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious,
  CarouselApi
} from "@/components/ui/carousel";
import { useMediaGestures } from "@/hooks/useMediaGestures";
import MediaItem from "./MediaItem";
import CarouselDots from "./CarouselDots";

interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

interface ProductGalleryProps {
  images: string[];
  videos?: string[];
  title?: string;
  compressed?: boolean;
  isPreview?: boolean;
  selectedImage?: string;
  onImageClick?: (url: string) => void;
}

const ProductGallery: React.FC<ProductGalleryProps> = ({ 
  images, 
  videos = [],
  title = "",
  compressed = true,
  isPreview = false,
  selectedImage,
  onImageClick
}) => {
  // Combine images and videos into media array
  const mediaItems: MediaItem[] = [
    ...images.map(url => ({ url, type: 'image' as const })),
    ...videos.map(url => ({ url, type: 'video' as const }))
  ];

  const [internalActiveMedia, setInternalActiveMedia] = useState<string>(mediaItems[0]?.url || "");
  const activeMedia = selectedImage || internalActiveMedia;
  
  const [isOpen, setIsOpen] = useState(false);
  const [fullScreenMedia, setFullScreenMedia] = useState<string>("");
  const [fullScreenMediaType, setFullScreenMediaType] = useState<'image' | 'video'>('image');
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  
  const isMobile = useIsMobile();

  const getMediaType = (url: string): 'image' | 'video' => {
    return mediaItems.find(item => item.url === url)?.type || 'image';
  };

  const getCurrentMediaIndex = useCallback(() => {
    return mediaItems.findIndex(item => item.url === (isOpen ? fullScreenMedia : activeMedia));
  }, [mediaItems, isOpen, fullScreenMedia, activeMedia]);

  const handleMediaClick = (url: string) => {
    if (isPreview) return;
    
    const mediaType = getMediaType(url);
    
    if (onImageClick) {
      onImageClick(url);
    } else {
      setInternalActiveMedia(url);
    }
    
    setFullScreenMedia(url);
    setFullScreenMediaType(mediaType);
    setIsOpen(true);
  };

  const handleThumbnailClick = (url: string) => {
    if (onImageClick) {
      onImageClick(url);
    } else {
      setInternalActiveMedia(url);
    }
  };

  const handleNextMedia = useCallback(() => {
    const currentIndex = getCurrentMediaIndex();
    const nextIndex = (currentIndex + 1) % mediaItems.length;
    const nextItem = mediaItems[nextIndex];
    
    if (isOpen) {
      setFullScreenMedia(nextItem.url);
      setFullScreenMediaType(nextItem.type);
    } else {
      if (onImageClick) {
        onImageClick(nextItem.url);
      } else {
        setInternalActiveMedia(nextItem.url);
      }
    }
  }, [getCurrentMediaIndex, mediaItems, isOpen, onImageClick]);

  const handlePrevMedia = useCallback(() => {
    const currentIndex = getCurrentMediaIndex();
    const prevIndex = (currentIndex - 1 + mediaItems.length) % mediaItems.length;
    const prevItem = mediaItems[prevIndex];
    
    if (isOpen) {
      setFullScreenMedia(prevItem.url);
      setFullScreenMediaType(prevItem.type);
    } else {
      if (onImageClick) {
        onImageClick(prevItem.url);
      } else {
        setInternalActiveMedia(prevItem.url);
      }
    }
  }, [getCurrentMediaIndex, mediaItems, isOpen, onImageClick]);

  const handleCloseFullscreen = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Media gestures for both normal and fullscreen modes
  const { handleTouchStart, handleTouchMove, handleTouchEnd, handleKeyDown } = useMediaGestures({
    itemsLength: mediaItems.length,
    onNext: handleNextMedia,
    onPrev: handlePrevMedia,
    onClose: isOpen ? handleCloseFullscreen : undefined
  });

  // Keyboard navigation for fullscreen
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Carousel API handling for mobile
  useEffect(() => {
    if (!carouselApi) return;

    carouselApi.on("select", () => {
      const index = carouselApi.selectedScrollSnap();
      setCurrentCarouselIndex(index);
      const selectedItem = mediaItems[index];
      if (selectedItem) {
        if (onImageClick) {
          onImageClick(selectedItem.url);
        } else {
          setInternalActiveMedia(selectedItem.url);
        }
      }
    });
  }, [carouselApi, mediaItems, onImageClick]);

  const handleDotClick = (index: number) => {
    carouselApi?.scrollTo(index);
  };

  const renderMainMedia = () => (
    <div 
      className="mb-4 overflow-hidden rounded-lg cursor-pointer"
      onClick={() => isPreview ? null : handleMediaClick(activeMedia)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AspectRatio ratio={16 / 9}>
        <MediaItem
          url={activeMedia}
          type={getMediaType(activeMedia)}
          alt={title}
          className="w-full h-full"
          lazy={false}
        />
      </AspectRatio>
    </div>
  );

  const renderThumbnails = () => (
    <div className="grid grid-cols-4 gap-2">
      {mediaItems.map((item, index) => (
        <div 
          key={index} 
          className={`overflow-hidden rounded-md border-2 aspect-square cursor-pointer transition-all ${
            activeMedia === item.url ? 'border-optapp-yellow ring-2 ring-optapp-yellow/30' : 'border-transparent hover:border-optapp-yellow/50'
          }`}
          onClick={() => handleThumbnailClick(item.url)}
        >
          <MediaItem
            url={item.url}
            type={item.type}
            alt={`${title} - изображение ${index + 1}`}
            className="w-full h-full"
            lazy={true}
          />
        </div>
      ))}
    </div>
  );

  const renderMobileCarousel = () => {
    const currentIndex = mediaItems.findIndex(item => item.url === activeMedia);
    
    return (
      <div className="mb-4 relative">
        <Carousel 
          className="w-full"
          setApi={setCarouselApi}
          opts={{
            startIndex: Math.max(0, currentIndex),
            align: "start",
            loop: true
          }}
        >
          <CarouselContent>
            {mediaItems.map((item, index) => (
              <CarouselItem key={index} className="basis-full">
                <div 
                  className="overflow-hidden rounded-lg cursor-pointer h-full flex items-center justify-center"
                  onClick={() => isPreview ? null : handleMediaClick(item.url)}
                >
                  <MediaItem
                    url={item.url}
                    type={item.type}
                    alt={`${title} - медиа ${index + 1}`}
                    className="w-full h-auto object-contain max-h-[50vh]"
                    lazy={Math.abs(index - currentCarouselIndex) <= 1}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        
        {/* Dots indicator */}
        <CarouselDots
          total={mediaItems.length}
          current={currentCarouselIndex}
          onDotClick={handleDotClick}
          className="mt-3"
        />
      </div>
    );
  };

  if (mediaItems.length === 0) return null;

  return (
    <div>
      {/* На мобильных всегда показываем carousel для лучшего UX */}
      {isMobile ? renderMobileCarousel() : renderMainMedia()}
      
      {/* Thumbnails только на десктопе */}
      {!isMobile && renderThumbnails()}

      {/* Fullscreen Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className="fixed inset-0 w-screen h-screen max-w-none max-h-none p-0 m-0 bg-black overflow-hidden border-0 rounded-none translate-x-0 translate-y-0 left-0 top-0"
          onPointerDownOutside={() => setIsOpen(false)}
          role="dialog"
          aria-label="Полноэкранный просмотр медиа"
        >
          <div
            className="relative w-full h-full flex items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className={`absolute top-4 right-4 ${isMobile ? 'w-12 h-12' : 'w-10 h-10'} text-white hover:bg-white/20 z-50 bg-black/70 ring-2 ring-white/30 backdrop-blur-sm transition-all duration-200`}
              onClick={() => setIsOpen(false)}
              aria-label="Закрыть"
            >
              <X className={isMobile ? "h-6 w-6" : "h-5 w-5"} />
            </Button>
            
            {/* Navigation arrows - показываем только на десктопе */}
            {mediaItems.length > 1 && !isMobile && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 text-white hover:bg-white/20 z-40 bg-black/70 ring-2 ring-white/30 backdrop-blur-sm transition-all duration-200"
                  onClick={handlePrevMedia}
                  aria-label="Предыдущее медиа"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-20 top-1/2 -translate-y-1/2 w-10 h-10 text-white hover:bg-white/20 z-40 bg-black/70 ring-2 ring-white/30 backdrop-blur-sm transition-all duration-200"
                  onClick={handleNextMedia}
                  aria-label="Следующее медиа"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
            
            {/* Media content */}
            <div className={`w-full h-full flex items-center justify-center ${isMobile ? 'p-16' : 'p-20'}`}>
              {fullScreenMediaType === 'video' ? (
                <video
                  src={fullScreenMedia}
                  controls
                  autoPlay
                  className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain"
                  preload="metadata"
                />
              ) : (
                <img
                  src={fullScreenMedia}
                  alt={title}
                  className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain"
                  loading="eager"
                />
              )}
            </div>
            
            {/* Media counter */}
            {mediaItems.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                {getCurrentMediaIndex() + 1} / {mediaItems.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductGallery;
