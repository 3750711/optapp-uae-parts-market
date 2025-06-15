
import React, { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProductGalleryProps {
  images: string[];
  videos?: string[];
  title?: string;
  selectedImage?: string;
  onImageClick?: (url: string) => void;
}

const ProductGallery: React.FC<ProductGalleryProps> = ({ 
  images, 
  videos = [],
  title = "",
  selectedImage,
  onImageClick
}) => {
  const isMobile = useIsMobile();
  const allMedia = [...images, ...videos];
  
  const [internalActiveMedia, setInternalActiveMedia] = useState<string>(allMedia[0] || "");
  const activeMedia = selectedImage !== undefined ? selectedImage : internalActiveMedia;
  
  const [isZoomed, setIsZoomed] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: allMedia.length > 1 });

  const handleMainImageClick = () => {
    if (!isVideo(activeMedia)) {
      setIsZoomed(true);
    }
  };

  const handleThumbnailClick = useCallback((url: string) => {
    const index = allMedia.indexOf(url);
    if (emblaApi && index !== -1) {
      emblaApi.scrollTo(index);
    }
    if (onImageClick) {
      onImageClick(url);
    } else {
      setInternalActiveMedia(url);
    }
  }, [emblaApi, allMedia, onImageClick]);

  const onCarouselSelect = useCallback(() => {
    if (!emblaApi) return;
    const newActiveMediaUrl = allMedia[emblaApi.selectedScrollSnap()];
    if (onImageClick) {
      onImageClick(newActiveMediaUrl);
    } else {
      setInternalActiveMedia(newActiveMediaUrl);
    }
  }, [emblaApi, allMedia, onImageClick]);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on('select', onCarouselSelect);
      return () => { emblaApi.off('select', onCarouselSelect) };
    }
  }, [emblaApi, onCarouselSelect]);

  useEffect(() => {
    if (emblaApi && activeMedia) {
      const activeIndex = allMedia.indexOf(activeMedia);
      if (activeIndex !== -1 && activeIndex !== emblaApi.selectedScrollSnap()) {
        emblaApi.scrollTo(activeIndex);
      }
    }
  }, [activeMedia, allMedia, emblaApi]);

  const isVideo = (url: string) => {
    return videos.includes(url);
  };

  if (allMedia.length === 0) return null;

  return (
    <div className="w-full">
      {/* Main Image Carousel */}
      <div className="mb-4 overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {allMedia.map((media, index) => (
            <div className="flex-[0_0_100%] min-w-0" key={index}>
              <AspectRatio ratio={4 / 3}>
                <div 
                  className="w-full h-full cursor-pointer relative overflow-hidden rounded-lg border group"
                  onClick={handleMainImageClick}
                >
                  {isVideo(media) ? (
                    <video
                      src={media}
                      className="w-full h-full object-contain bg-black"
                      controls
                      preload="metadata"
                      playsInline
                    />
                  ) : (
                    <img
                      src={media}
                      alt={title}
                      className="w-full h-full object-contain"
                    />
                  )}
                  
                  {!isVideo(media) && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                  )}
                </div>
              </AspectRatio>
            </div>
          ))}
        </div>
      </div>

      {/* Thumbnails */}
      {allMedia.length > 1 && (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex space-x-2 pb-2">
            {allMedia.map((media, index) => (
              <div 
                key={index}
                className={`w-20 h-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-md border-2 transition-all ${
                  activeMedia === media 
                    ? 'border-primary ring-2 ring-primary/30' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleThumbnailClick(media)}
              >
                {isVideo(media) ? (
                  <div className="relative w-full h-full">
                    <video
                      src={media}
                      className="w-full h-full object-cover"
                      preload="metadata"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                      <div className="w-6 h-6 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[6px] border-l-black border-y-[4px] border-y-transparent ml-0.5"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={media}
                    alt={`${title} - изображение ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* Zoom Modal */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className={isMobile ? "p-0 h-full w-full max-w-full border-0 rounded-none" : "max-w-4xl p-2"}>
          <div className="relative w-full h-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-50 bg-white/80 shadow-md hover:bg-gray-100"
              onClick={() => setIsZoomed(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={activeMedia}
                alt={title}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Need to import ScrollArea components
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default ProductGallery;
