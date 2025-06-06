
import React, { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, X, Camera, Star, StarOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { cn } from "@/lib/utils";

interface MobileOptimizedImageUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxImages?: number;
  existingImages?: string[];
  onImageDelete?: (url: string) => void;
  onSetPrimaryImage?: (url: string) => void;
  primaryImage?: string;
  className?: string;
  productId?: string;
  showOnlyButton?: boolean;
  showGalleryOnly?: boolean;
  buttonText?: string;
  buttonIcon?: React.ReactNode;
}

export const MobileOptimizedImageUpload: React.FC<MobileOptimizedImageUploadProps> = ({
  onUploadComplete,
  maxImages = 30,
  existingImages = [],
  onImageDelete,
  onSetPrimaryImage,
  primaryImage,
  className,
  productId,
  showOnlyButton = false,
  showGalleryOnly = false,
  buttonText = "Загрузить фотографии",
  buttonIcon = <Upload className="h-4 w-4" />
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { uploadToCloudinary, isLoading } = useCloudinaryUpload();

  const handleFileSelect = useCallback(async (files: FileList) => {
    if (existingImages.length + files.length > maxImages) {
      toast({
        title: "Превышен лимит",
        description: `Максимальное количество изображений: ${maxImages}`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const result = await uploadToCloudinary(file, productId);
        return result.success ? result.url : null;
      });

      const uploadResults = await Promise.all(uploadPromises);
      const successfulUploads = uploadResults.filter((url): url is string => url !== null);
      
      if (successfulUploads.length > 0) {
        onUploadComplete(successfulUploads);
        toast({
          title: "Успех",
          description: `Загружено ${successfulUploads.length} изображений`,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить изображения",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [existingImages.length, maxImages, onUploadComplete, uploadToCloudinary, productId, toast]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  const handleDelete = (url: string) => {
    if (onImageDelete) {
      onImageDelete(url);
    }
  };

  const handleSetPrimary = (url: string) => {
    if (onSetPrimaryImage) {
      onSetPrimaryImage(url);
    }
  };

  // Показывать только кнопку
  if (showOnlyButton) {
    return (
      <div className={cn("w-full", className)}>
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          disabled={isUploading || isLoading || existingImages.length >= maxImages}
          className="w-full h-12"
        >
          {isUploading || isLoading ? (
            <Upload className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            buttonIcon
          )}
          {buttonText}
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  // Показывать только галерею
  if (showGalleryOnly && existingImages.length > 0) {
    return (
      <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
        {existingImages.map((url, index) => (
          <div key={index} className="relative aspect-square">
            <img
              src={url}
              alt={`Uploaded ${index + 1}`}
              className="w-full h-full object-cover rounded-lg border"
            />
            
            <div className="absolute top-2 right-2 flex gap-1">
              {onSetPrimaryImage && (
                <Button
                  type="button"
                  size="sm"
                  variant={primaryImage === url ? "default" : "secondary"}
                  onClick={() => handleSetPrimary(url)}
                  className="h-6 w-6 p-0"
                >
                  {primaryImage === url ? (
                    <Star className="h-3 w-3" />
                  ) : (
                    <StarOff className="h-3 w-3" />
                  )}
                </Button>
              )}
              
              {onImageDelete && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(url)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Полный компонент (по умолчанию)
  return (
    <div className={cn("space-y-4", className)}>
      <Button
        type="button"
        variant="outline"
        onClick={handleButtonClick}
        disabled={isUploading || isLoading || existingImages.length >= maxImages}
        className="w-full h-12"
      >
        {isUploading || isLoading ? (
          <Upload className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          buttonIcon
        )}
        {buttonText}
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {existingImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {existingImages.map((url, index) => (
            <div key={index} className="relative aspect-square">
              <img
                src={url}
                alt={`Uploaded ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border"
              />
              
              <div className="absolute top-2 right-2 flex gap-1">
                {onSetPrimaryImage && (
                  <Button
                    type="button"
                    size="sm"
                    variant={primaryImage === url ? "default" : "secondary"}
                    onClick={() => handleSetPrimary(url)}
                    className="h-6 w-6 p-0"
                  >
                    {primaryImage === url ? (
                      <Star className="h-3 w-3" />
                    ) : (
                      <StarOff className="h-3 w-3" />
                    )}
                  </Button>
                )}
                
                {onImageDelete && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(url)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
