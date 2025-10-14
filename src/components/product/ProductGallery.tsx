
import React, { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { X, ZoomIn, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import { useImagePreloader } from "@/hooks/useImagePreloader";
import { useLazyImage } from "@/hooks/useLazyImage";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";

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
  const allMedia = [...images, ...videos];
  
  // Early return before any hooks
  if (allMedia.length === 0) return null;
  
  const isMobile = useIsMobile();
  const [internalActiveMedia, setInternalActiveMedia] = useState<string>(allMedia[0] || "");
  const activeMedia = selectedImage !== undefined ? selectedImage : internalActiveMedia;
  
  const [isZoomed, setIsZoomed] = useState(false);
  const [currentZoomIndex, setCurrentZoomIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: allMedia.length > 1,
    dragFree: true,
    skipSnaps: false,
    containScroll: 'trimSnaps'
  });

  // Preload priority images (first 2 images)
  const { preloadImage } = useImagePreloader({ 
    images: images.slice(0, 2), 
    priority: 2 
  });

  const handleMainImageClick = () => {
    if (!isVideo(activeMedia)) {
      const currentIndex = allMedia.indexOf(activeMedia);
      setCurrentZoomIndex(currentIndex !== -1 ? currentIndex : 0);
      setIsZoomed(true);
    }
  };

  // Swipe navigation for zoomed view
  const swipeRef = useSwipeNavigation({
    onSwipeLeft: () => navigateZoom('next'),
    onSwipeRight: () => navigateZoom('prev'),
    threshold: 50
  });

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

  const handleShare = async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url,
        });
      } catch (error) {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Ссылка скопирована",
          description: "Изображение скопировано в буфер обмена",
        });
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Ссылка скопирована", 
          description: "Изображение скопировано в буфер обмена",
        });
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось скопировать ссылку",
          variant: "destructive",
        });
      }
    }
  };

  const navigateZoom = (direction: 'prev' | 'next') => {
    const imageUrls = allMedia.filter(url => !isVideo(url));
    if (imageUrls.length <= 1) return;
    
    const currentImageIndex = imageUrls.indexOf(allMedia[currentZoomIndex]);
    if (currentImageIndex === -1) return;
    
    let nextImageIndex;
    if (direction === 'next') {
      nextImageIndex = (currentImageIndex + 1) % imageUrls.length;
    } else {
      nextImageIndex = currentImageIndex === 0 ? imageUrls.length - 1 : currentImageIndex - 1;
    }
    
    const nextImageUrl = imageUrls[nextImageIndex];
    const nextGlobalIndex = allMedia.indexOf(nextImageUrl);
    setCurrentZoomIndex(nextGlobalIndex);
  };

  const currentActiveIndex = allMedia.indexOf(activeMedia);
  const imageUrls = allMedia.filter(url => !isVideo(url));

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
                      loading={index === 0 ? 'eager' : 'lazy'}
                      decoding={index === 0 ? 'sync' : 'async'}
                      onLoad={() => {
                        // Preload next image when current loads
                        if (index < allMedia.length - 1 && !isVideo(allMedia[index + 1])) {
                          preloadImage(allMedia[index + 1]);
                        }
                      }}
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                        e.currentTarget.onerror = null;
                      }}
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

      {/* Swipe indicator */}
      {allMedia.length > 1 && (
        <div className="text-center text-xs text-muted-foreground mt-2 mb-2 animate-pulse">
          ← Swipe for more photos →
        </div>
      )}

      {/* Progress Indicators */}
      {allMedia.length > 1 && (
        <div className="flex justify-center gap-1 mb-4">
          {allMedia.map((_, index) => (
            <button
              key={index}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center touch-target"
              onClick={() => {
                if (emblaApi) emblaApi.scrollTo(index);
                if (onImageClick) {
                  onImageClick(allMedia[index]);
                } else {
                  setInternalActiveMedia(allMedia[index]);
                }
              }}
            >
              <span className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentActiveIndex 
                  ? 'bg-primary scale-125' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`} />
            </button>
          ))}
        </div>
      )}

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
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                      e.currentTarget.onerror = null;
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* Zoom Modal */}
      {isMobile ? (
        <Sheet open={isZoomed} onOpenChange={setIsZoomed}>
          <SheetContent 
            side="bottom" 
            className="h-[100dvh] max-h-[100dvh] p-0 border-0 rounded-none overflow-hidden"
          >
            <div className="relative w-full h-full bg-black">
              {/* Header with controls */}
              <div className="absolute top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-sm p-4 pt-safe mt-safe">
                <div className="flex items-center justify-between text-white">
                  <div className="text-sm font-medium">
                    {currentZoomIndex + 1} из {imageUrls.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleShare(allMedia[currentZoomIndex])}
                      className="text-white hover:bg-white/20"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsZoomed(false)}
                      className="text-white hover:bg-white/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Main image */}
              <div ref={swipeRef} className="absolute inset-0 flex items-center justify-center">
                <img
                  src={allMedia[currentZoomIndex]}
                  alt={title}
                  className="max-w-[100vw] max-h-[calc(100dvh-80px)] object-contain"
                  style={{ 
                    touchAction: 'pan-x pan-y pinch-zoom',
                    userSelect: 'none',
                    width: 'auto',
                    height: 'auto'
                  }}
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                    e.currentTarget.onerror = null;
                  }}
                />
              </div>

            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
          <DialogContent className="max-w-4xl p-2">
            <div className="relative w-full h-full">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">
                  {currentZoomIndex + 1} из {imageUrls.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleShare(allMedia[currentZoomIndex])}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsZoomed(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <img
                  src={allMedia[currentZoomIndex]}
                  alt={title}
                  className="w-full max-h-[70vh] object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                    e.currentTarget.onerror = null;
                  }}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ProductGallery;
