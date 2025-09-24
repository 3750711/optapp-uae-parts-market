
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Check, Loader2 } from "lucide-react";
import { LazyImage } from "@/components/ui/lazy-image";
import { usePerformanceOptimization } from "@/utils/performanceOptimizer";

interface ProductImagesGalleryProps {
  images: string[];
  onImageDelete: (url: string) => void;
  onSetPrimaryImage?: (url: string) => void;
  primaryImage?: string;
  deletingImage: string | null;
  settingPrimary: string | null;
}

export const ProductImagesGallery: React.FC<ProductImagesGalleryProps> = ({
  images,
  onImageDelete,
  onSetPrimaryImage,
  primaryImage,
  deletingImage,
  settingPrimary
}) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const { throttle } = usePerformanceOptimization();

  // Memoize optimized image URLs
  const optimizedImages = useMemo(() => 
    images.map(url => ({
      original: url,
      thumbnail: url.includes('cloudinary.com') 
        ? url.replace('/upload/', '/upload/c_fill,w_300,h_300,q_auto/')
        : url,
      webp: url.includes('cloudinary.com')
        ? url.replace('/upload/', '/upload/f_webp,c_fill,w_300,h_300,q_auto/')
        : url
    }))
  , [images]);

  const throttledDelete = useMemo(() => 
    onImageDelete ? throttle(onImageDelete, 500) : undefined
  , [onImageDelete, throttle]);

  const throttledSetPrimary = useMemo(() => 
    onSetPrimaryImage ? throttle(onSetPrimaryImage, 500) : undefined
  , [onSetPrimaryImage, throttle]);
  return (<>
    <div className="mb-3 grid grid-cols-3 gap-2">
      {optimizedImages.map((image, index) => (
        <div 
          key={`${image.original}-${index}`} 
          className={`relative group rounded-md overflow-hidden border aspect-square ${primaryImage === image.original ? 'ring-2 ring-primary' : ''}`}
        >
          <LazyImage 
            src={image.webp || image.thumbnail}
            alt={`Фото ${index + 1}`} 
            className="w-full h-full object-cover cursor-zoom-in transition-transform duration-200 group-hover:scale-105" 
            onClick={() => { setViewerIndex(index); setViewerOpen(true); }}
            placeholder="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='300' height='300' fill='%23f3f4f6'/%3E%3C/svg%3E"
            threshold={0.1}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
            {onSetPrimaryImage && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-7 w-7 rounded-full p-0"
                onClick={(e) => { e.stopPropagation(); throttledSetPrimary?.(image.original); }}
                disabled={settingPrimary === image.original || primaryImage === image.original}
              >
                {settingPrimary === image.original ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="h-7 w-7 rounded-full p-0"
              onClick={(e) => { e.stopPropagation(); throttledDelete?.(image.original); }}
              disabled={deletingImage === image.original || images.length <= 1}
            >
              <span className="sr-only">Удалить</span>
              {deletingImage === image.original ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              )}
            </Button>
          </div>
          {primaryImage === image.original && (
            <div className="absolute bottom-0 left-0 right-0 bg-primary bg-opacity-70 p-1">
              <p className="text-primary-foreground text-xs text-center">Основное</p>
            </div>
          )}
        </div>
      ))}
    </div>
    <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
      <DialogContent className="max-w-4xl p-0">
        {viewerIndex !== null && (
          <img
            src={images[viewerIndex]}
            alt={`Фото ${(viewerIndex ?? 0) + 1}`}
            className="w-full h-auto max-h-[80vh] object-contain rounded-md"
          />
        )}
      </DialogContent>
    </Dialog>
  </>);
};
