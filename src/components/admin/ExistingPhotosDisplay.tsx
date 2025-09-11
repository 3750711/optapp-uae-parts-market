import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExistingPhotosDisplayProps {
  images: string[];
  onImageDelete?: (url: string) => void;
  disabled?: boolean;
  className?: string;
}

const ExistingPhotosDisplay: React.FC<ExistingPhotosDisplayProps> = ({
  images,
  onImageDelete,
  disabled = false,
  className
}) => {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-sm font-medium text-foreground">Uploaded Photos ({images.length})</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {images.map((imageUrl, index) => (
          <div
            key={`${imageUrl}-${index}`}
            className="relative group aspect-square rounded-lg border border-border overflow-hidden bg-muted"
          >
            <img
              src={imageUrl}
              alt={`Uploaded ${index + 1}`}
              loading="lazy"
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            
            {onImageDelete && !disabled && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onImageDelete(imageUrl)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExistingPhotosDisplay;