
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Star, Cloud } from "lucide-react";

interface ExistingImagesGalleryProps {
  existingImages: string[];
  maxImages: number;
  primaryImage?: string;
  onSetPrimaryImage?: (url: string) => void;
  onImageDelete?: (url: string) => void;
  isMobileDevice: boolean;
}

export const ExistingImagesGallery: React.FC<ExistingImagesGalleryProps> = ({
  existingImages,
  maxImages,
  primaryImage,
  onSetPrimaryImage,
  onImageDelete,
  isMobileDevice
}) => {
  const handleSetPrimaryImage = (url: string) => {
    if (onSetPrimaryImage) {
      onSetPrimaryImage(url);
    }
  };

  if (existingImages.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          Загруженные изображения ({existingImages.length}/{maxImages})
          <Badge variant="secondary" className="text-xs">
            <Cloud className="h-3 w-3 mr-1" />
            Cloudinary
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {existingImages.map((url, index) => (
            <div 
              key={url} 
              className={`relative group rounded-md overflow-hidden border aspect-square ${
                primaryImage === url ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <img 
                src={url} 
                alt={`Фото ${index + 1}`} 
                className="w-full h-full object-cover" 
              />
              
              {/* Desktop overlay controls */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                {onSetPrimaryImage && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 rounded-full p-0 touch-manipulation"
                    onClick={() => handleSetPrimaryImage(url)}
                    disabled={primaryImage === url}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                
                {onImageDelete && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="h-8 w-8 rounded-full p-0 touch-manipulation"
                    onClick={() => onImageDelete(url)}
                    disabled={existingImages.length <= 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Primary image indicator */}
              {primaryImage === url && (
                <div className="absolute bottom-0 left-0 right-0 bg-blue-500 bg-opacity-80 p-1">
                  <p className="text-white text-xs text-center font-medium flex items-center justify-center gap-1">
                    <Star className="h-3 w-3" />
                    Основное
                  </p>
                </div>
              )}
              
              {/* Mobile tap controls */}
              {isMobileDevice && (
                <div className="absolute top-1 right-1 flex gap-1">
                  {onSetPrimaryImage && primaryImage !== url && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-6 w-6 rounded-full p-0 bg-white/90 hover:bg-white"
                      onClick={() => handleSetPrimaryImage(url)}
                    >
                      <Star className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {onImageDelete && existingImages.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="h-6 w-6 rounded-full p-0 bg-red-500/90 hover:bg-red-500"
                      onClick={() => onImageDelete(url)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
