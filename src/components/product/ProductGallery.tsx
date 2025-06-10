
import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  // Combine images and videos
  const allMedia = [...images, ...videos];
  
  const [internalActiveMedia, setInternalActiveMedia] = useState<string>(allMedia[0] || "");
  const activeMedia = selectedImage || internalActiveMedia;
  
  const [isZoomed, setIsZoomed] = useState(false);

  const handleMainImageClick = () => {
    setIsZoomed(true);
  };

  const handleThumbnailClick = (url: string) => {
    if (onImageClick) {
      onImageClick(url);
    } else {
      setInternalActiveMedia(url);
    }
  };

  const isVideo = (url: string) => {
    return videos.includes(url);
  };

  if (allMedia.length === 0) return null;

  return (
    <div className="w-full">
      {/* Main Image */}
      <div className="mb-4 relative group">
        <div className="w-full min-h-[400px] bg-gray-50 rounded-lg border flex items-center justify-center p-4">
          <div 
            className="w-full h-full cursor-pointer relative overflow-hidden flex items-center justify-center"
            onClick={handleMainImageClick}
          >
            {isVideo(activeMedia) ? (
              <video
                src={activeMedia}
                className="max-w-full max-h-full object-contain"
                controls
                preload="metadata"
              />
            ) : (
              <img
                src={activeMedia}
                alt={title}
                className="max-w-full max-h-full object-contain"
              />
            )}
            
            {/* Zoom icon overlay */}
            {!isVideo(activeMedia) && (
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Thumbnails */}
      {allMedia.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
          {allMedia.map((media, index) => (
            <div 
              key={index}
              className={`h-20 cursor-pointer overflow-hidden rounded-md border-2 transition-all bg-gray-50 flex items-center justify-center ${
                activeMedia === media 
                  ? 'border-primary ring-2 ring-primary/30' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleThumbnailClick(media)}
            >
              {isVideo(media) ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    src={media}
                    className="max-w-full max-h-full object-contain"
                    preload="metadata"
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
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Zoom Modal */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-white">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-50 bg-white shadow-md hover:bg-gray-100"
              onClick={() => setIsZoomed(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="p-4">
              <img
                src={activeMedia}
                alt={title}
                className="w-full h-auto max-h-[85vh] object-contain"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductGallery;
