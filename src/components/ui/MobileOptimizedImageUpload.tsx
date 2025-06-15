import React, { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, X, Camera, Star, StarOff, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMobileOptimizedUpload } from "@/hooks/useMobileOptimizedUpload";
import { cn } from "@/lib/utils";
import { UploadProgressCard } from "@/components/ui/image-upload/UploadProgressCard";

interface MobileOptimizedImageUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxImages?: number;
  existingImages?: string[];
  onImageDelete?: (url:string) => void;
  onSetPrimaryImage?: (url: string) => void;
  primaryImage?: string;
  className?: string;
  productId?: string;
  showOnlyButton?: boolean;
  showGalleryOnly?: boolean;
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  disabled?: boolean;
  disableToast?: boolean;
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
  buttonIcon = <Upload className="h-4 w-4" />,
  disabled = false,
  disableToast = false,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { 
    isUploading, 
    uploadProgress, 
    canCancel, 
    uploadFilesBatch, 
    cancelUpload, 
    clearProgress,
    isMobileDevice 
  } = useMobileOptimizedUpload();

  const handleFileSelect = useCallback(async (files: FileList) => {
    if (existingImages.length + files.length > maxImages) {
      if (!disableToast) {
        toast({
          title: "Превышен лимит",
          description: `Максимальное количество изображений: ${maxImages}`,
          variant: "destructive",
        });
      }
      return;
    }

    const uploadedUrls = await uploadFilesBatch(Array.from(files), {
      productId,
      batchSize: 2,
      batchDelay: 1000,
      disableToast,
    });
    
    if (uploadedUrls.length > 0) {
      onUploadComplete(uploadedUrls);
    }
  }, [existingImages.length, maxImages, onUploadComplete, uploadFilesBatch, productId, toast, disableToast]);

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Показывать только кнопку
  if (showOnlyButton) {
    return (
      <div className={cn("w-full space-y-4", className)}>
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          disabled={disabled || isUploading || existingImages.length >= maxImages}
          className="w-full h-12"
        >
          {isUploading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            buttonIcon
          )}
          {isUploading ? "Загрузка..." : buttonText}
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        {/* Show upload progress */}
        <UploadProgressCard
          uploadProgress={uploadProgress}
          isUploading={isUploading}
          onClearProgress={clearProgress}
          formatFileSize={formatFileSize}
        />

        {/* Cancel button */}
        {canCancel && (
          <Button
            type="button"
            variant="destructive"
            onClick={cancelUpload}
            className="w-full"
            disabled={disabled}
          >
            <X className="mr-2 h-4 w-4" />
            Отменить загрузку
          </Button>
        )}
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
                  disabled={disabled}
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
                  disabled={disabled}
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
        disabled={disabled || isUploading || existingImages.length >= maxImages}
        className="w-full h-12"
      >
        {isUploading ? (
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          buttonIcon
        )}
        {isUploading ? "Загрузка..." : buttonText}
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Show upload progress */}
      <UploadProgressCard
        uploadProgress={uploadProgress}
        isUploading={isUploading}
        onClearProgress={clearProgress}
        formatFileSize={formatFileSize}
      />

      {/* Cancel button */}
      {canCancel && (
        <Button
          type="button"
          variant="destructive"
          onClick={cancelUpload}
          className="w-full"
          disabled={disabled}
        >
          <X className="mr-2 h-4 w-4" />
          Отменить загрузку
        </Button>
      )}

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
                    disabled={disabled}
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
                    disabled={disabled}
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
