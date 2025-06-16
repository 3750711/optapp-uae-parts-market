
import React, { useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { useSimpleOrderUpload } from '@/hooks/useSimpleOrderUpload';

interface SimpleMediaSectionProps {
  images: string[];
  onImagesUpload: (urls: string[]) => void;
  onImageDelete?: (url: string) => void;
  disabled?: boolean;
  maxImages?: number;
}

const SimpleMediaSection: React.FC<SimpleMediaSectionProps> = ({
  images,
  onImagesUpload,
  onImageDelete,
  disabled = false,
  maxImages = 25
}) => {
  const { uploadFiles, isUploading } = useSimpleOrderUpload();

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const uploadedUrls = await uploadFiles(fileArray);
    
    if (uploadedUrls.length > 0) {
      onImagesUpload([...images, ...uploadedUrls]);
    }

    // Reset input
    event.target.value = '';
  }, [uploadFiles, images, onImagesUpload]);

  const handleImageDelete = useCallback((url: string) => {
    const newImages = images.filter(img => img !== url);
    onImagesUpload(newImages);
    if (onImageDelete) {
      onImageDelete(url);
    }
  }, [images, onImagesUpload, onImageDelete]);

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div>
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('simple-image-input')?.click()}
          disabled={disabled || isUploading || images.length >= maxImages}
          className="w-full"
        >
          {isUploading ? (
            <>Загрузка...</>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Загрузить фото
            </>
          )}
        </Button>
        
        <input
          id="simple-image-input"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
              <img
                src={url}
                alt={`Изображение ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleImageDelete(url)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              {index === 0 && (
                <div className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                  Главное
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimpleMediaSection;
