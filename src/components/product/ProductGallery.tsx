
import React, { useState, useRef } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";

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

const SWIPE_THRESHOLD = 50;

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
  const isMobile = useIsMobile();

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const getMediaType = (url: string): 'image' | 'video' => {
    return mediaItems.find(item => item.url === url)?.type || 'image';
  };

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

  const handleNextMedia = () => {
    const currentIndex = mediaItems.findIndex(item => item.url === fullScreenMedia);
    const nextIndex = (currentIndex + 1) % mediaItems.length;
    const nextItem = mediaItems[nextIndex];
    setFullScreenMedia(nextItem.url);
    setFullScreenMediaType(nextItem.type);
  };

  const handlePrevMedia = () => {
    const currentIndex = mediaItems.findIndex(item => item.url === fullScreenMedia);
    const prevIndex = (currentIndex - 1 + mediaItems.length) % mediaItems.length;
    const prevItem = mediaItems[prevIndex];
    setFullScreenMedia(prevItem.url);
    setFullScreenMediaType(prevItem.type);
  };

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current !== null) {
      touchEndX.current = e.touches[0].clientX;
    }
  };

  const onTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const diffX = touchStartX.current - touchEndX.current;

      if (diffX > SWIPE_THRESHOLD) {
        handleNextMedia();
      } else if (diffX < -SWIPE_THRESHOLD) {
        handlePrevMedia();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const renderMediaPreview = (url: string, isActive?: boolean, className?: string) => {
    const mediaType = getMediaType(url);
    
    if (mediaType === 'video') {
      return (
        <div className={`relative ${className || ''}`}>
          <video 
            src={url} 
            className="w-full h-full object-contain"
            preload="metadata"
            muted
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
            <Play className="w-8 h-8 text-white" fill="white" />
          </div>
        </div>
      );
    }
    
    return (
      <img 
        src={url} 
        alt={title}
        className={className || "w-full h-full object-contain"}
      />
    );
  };

  const renderMainMedia = () => (
    <div 
      className="mb-4 overflow-hidden rounded-lg cursor-pointer"
      onClick={() => isPreview ? null : handleMediaClick(activeMedia)}
    >
      <AspectRatio ratio={16 / 9}>
        {renderMediaPreview(activeMedia, true, "w-full h-full object-contain")}
      </AspectRatio>
    </div>
  );

  const renderThumbnails = () => (
    <div className="grid grid-cols-4 gap-2">
      {mediaItems.map((item, index) => (
        <div 
          key={index} 
          className={`overflow-hidden rounded-md border-2 aspect-square ${
            activeMedia === item.url ? 'border-optapp-yellow' : 'border-transparent'
          } hover:border-optapp-yellow cursor-pointer`}
          onClick={() => handleThumbnailClick(item.url)}
        >
          {renderMediaPreview(item.url, false, "w-full h-full object-contain")}
        </div>
      ))}
    </div>
  );

  const renderMobileCarousel = () => (
    <div className="mb-4">
      <Carousel className="w-full">
        <CarouselContent>
          {mediaItems.map((item, index) => (
            <CarouselItem key={index} className="basis-full">
              <div 
                className="overflow-hidden rounded-lg cursor-pointer h-full flex items-center justify-center"
                onClick={() => isPreview ? null : handleMediaClick(item.url)}
              >
                {renderMediaPreview(item.url, false, "w-full h-auto object-contain max-h-[50vh]")}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {mediaItems.length > 1 && (
          <>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </>
        )}
      </Carousel>
    </div>
  );

  if (mediaItems.length === 0) return null;

  return (
    <div>
      {isMobile && mediaItems.length > 1 ? renderMobileCarousel() : renderMainMedia()}
      
      {!isMobile && renderThumbnails()}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] p-0 bg-black">
          <div
            className="relative w-full h-full flex items-center justify-center"
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
            
            {mediaItems.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-40"
                  onClick={handlePrevMedia}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-40"
                  onClick={handleNextMedia}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
            
            <div className="w-full h-full flex items-center justify-center p-8">
              {fullScreenMediaType === 'video' ? (
                <video
                  src={fullScreenMedia}
                  controls
                  autoPlay
                  className="max-w-full max-h-full object-contain"
                  preload="metadata"
                />
              ) : (
                <img
                  src={fullScreenMedia}
                  alt={title}
                  className="max-w-full max-h-full object-contain"
                  loading="lazy"
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductGallery;
