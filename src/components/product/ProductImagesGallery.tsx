
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Check, Loader2 } from "lucide-react";

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
  return (<>
    <div className="mb-3 grid grid-cols-3 gap-2">
      {images.map((url, index) => (
        <div 
          key={url} 
          className={`relative group rounded-md overflow-hidden border aspect-square ${primaryImage === url ? 'ring-2 ring-blue-500' : ''}`}
        >
          <img 
            src={url} 
            alt={`Фото ${index + 1}`} 
            className="w-full h-full object-cover cursor-zoom-in" 
            onClick={() => { setViewerIndex(index); setViewerOpen(true); }}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
            {onSetPrimaryImage && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-7 w-7 rounded-full p-0"
                onClick={(e) => { e.stopPropagation(); onSetPrimaryImage(url); }}
                disabled={settingPrimary === url || primaryImage === url}
              >
                {settingPrimary === url ? (
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
              onClick={(e) => { e.stopPropagation(); onImageDelete(url); }}
              disabled={deletingImage === url || images.length <= 1}
            >
              <span className="sr-only">Удалить</span>
              {deletingImage === url ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              )}
            </Button>
          </div>
          {primaryImage === url && (
            <div className="absolute bottom-0 left-0 right-0 bg-blue-500 bg-opacity-70 p-1">
              <p className="text-white text-xs text-center">Основное</p>
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
