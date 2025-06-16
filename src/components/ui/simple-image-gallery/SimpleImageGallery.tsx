
import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SimpleImageGalleryProps {
  images: string[];
  onDelete: (url: string) => void;
  disabled?: boolean;
  isUploading?: boolean;
}

const SimpleImageGallery: React.FC<SimpleImageGalleryProps> = ({
  images,
  onDelete,
  disabled = false,
  isUploading = false
}) => {
  if (images.length === 0 && !isUploading) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {images.map((url, index) => (
        <div key={`image-${index}`} className="relative aspect-square group">
          <img
            src={url}
            alt={`Фото ${index + 1}`}
            className="w-full h-full object-cover rounded-lg border"
            loading="lazy"
          />
          
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => onDelete(url)}
            className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Удалить фото"
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
      
      {isUploading && (
        <div className="aspect-square rounded-lg border border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
          <span className="text-sm text-gray-500">Загружается...</span>
        </div>
      )}
    </div>
  );
};

export default SimpleImageGallery;
