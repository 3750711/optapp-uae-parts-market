
import React from 'react';
import { Button } from '@/components/ui/button';
import { Star, StarOff, X } from 'lucide-react';

interface OptimizedImageGalleryProps {
  images: string[];
  primaryImage?: string;
  onSetPrimary?: (url: string) => void;
  onDelete?: (url: string) => void;
  disabled?: boolean;
}

const OptimizedImageGallery: React.FC<OptimizedImageGalleryProps> = ({
  images,
  primaryImage,
  onSetPrimary,
  onDelete,
  disabled = false
}) => {
  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {images.map((url, index) => (
        <div key={`${url}-${index}`} className="relative aspect-square group">
          <img
            src={url}
            alt={`Upload ${index + 1}`}
            className="w-full h-full object-cover rounded-lg border"
            loading="lazy"
          />
          
          {/* Primary badge */}
          {primaryImage === url && (
            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
              Главное
            </div>
          )}
          
          {/* Controls */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onSetPrimary && (
              <Button
                type="button"
                size="sm"
                variant={primaryImage === url ? "default" : "secondary"}
                onClick={() => onSetPrimary(url)}
                className="h-6 w-6 p-0"
                disabled={disabled}
                title={primaryImage === url ? "Главное фото" : "Сделать главным"}
              >
                {primaryImage === url ? (
                  <Star className="h-3 w-3" />
                ) : (
                  <StarOff className="h-3 w-3" />
                )}
              </Button>
            )}
            
            {onDelete && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => onDelete(url)}
                className="h-6 w-6 p-0"
                disabled={disabled}
                title="Удалить фото"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OptimizedImageGallery;
