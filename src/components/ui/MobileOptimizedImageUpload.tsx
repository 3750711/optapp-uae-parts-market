
import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, X, Camera, Star, StarOff, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSimpleCloudinaryUpload } from "@/hooks/useSimpleCloudinaryUpload";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import UploadProgressIndicator from './optimized-image-upload/UploadProgressIndicator';

import { UploadProgress } from '@/hooks/useSimpleCloudinaryUpload';

interface MobileOptimizedImageUploadProps {
  onUploadComplete?: (urls: string[]) => void;
  onFilesUpload?: (files: File[]) => Promise<void>;
  uploadProgress?: UploadProgress[];
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
  onFilesUpload,
  uploadProgress: externalUploadProgress,
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
  const { profile } = useAuth();
  const isSeller = profile?.user_type === 'seller';
  
  // Translation helper
  const getTranslatedText = (russianText: string, englishText: string) => {
    return isSeller ? englishText : russianText;
  };
  
  const { toast } = useToast();
  const { 
    isUploading: internalIsUploading, 
    uploadProgress: internalUploadProgress, 
    uploadFiles, 
    clearProgress
  } = useSimpleCloudinaryUpload();

  // Use external or internal upload progress and state
  const isUploading = externalUploadProgress ? externalUploadProgress.some(p => p.status === 'uploading' || p.status === 'processing') : internalIsUploading;
  const uploadProgress = externalUploadProgress || internalUploadProgress;

  const handleFileSelect = useCallback(async (files: FileList) => {
    const MAX_PHOTO_SIZE_MB = 50;
    const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;
    const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic', 'image/heif'];

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

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      if (!ALLOWED_PHOTO_TYPES.includes(file.type.toLowerCase())) {
        if (!disableToast) {
          toast({
            title: "Неверный формат файла",
            description: `Файл "${file.name}" имеет неподдерживаемый формат.`,
            variant: "destructive",
          });
        }
        return false;
      }

      if (file.size > MAX_PHOTO_SIZE_BYTES) {
        if (!disableToast) {
          toast({
            title: "Файл слишком большой",
            description: `Размер файла "${file.name}" превышает ${MAX_PHOTO_SIZE_MB}MB.`,
            variant: "destructive",
          });
        }
        return false;
      }
      return true;
    });
    
    if (validFiles.length === 0) {
      return;
    }

    // Use external upload handler if provided, otherwise use internal
    if (onFilesUpload) {
      await onFilesUpload(validFiles);
    } else if (onUploadComplete) {
      const uploadedUrls = await uploadFiles(validFiles, {
        productId,
        disableToast,
      });
      
      if (uploadedUrls.length > 0) {
        onUploadComplete(uploadedUrls);
      }
    }
  }, [existingImages.length, maxImages, onUploadComplete, onFilesUpload, uploadFiles, productId, toast, disableToast]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log('📤 File selection detected:', files.length, 'files');
      handleFileSelect(files);
    }
    // Reset input
    e.target.value = "";
  }, [handleFileSelect]);

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
      <div className={cn("w-full space-y-4", className)}>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || isUploading || existingImages.length >= maxImages}
          className="w-full h-12 relative"
        >
          {isUploading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            buttonIcon
          )}
        {isUploading ? getTranslatedText("Загрузка...", "Uploading...") : (buttonText === "Загрузить фотографии" ? getTranslatedText("Загрузить фотографии", "Upload photos") : buttonText)}
        <input
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={disabled}
        />
        </Button>

        {/* Professional progress indicator */}
        {uploadProgress.length > 0 && (
          <div className="mt-4">
            <UploadProgressIndicator
              uploads={uploadProgress.map(p => ({
                id: p.fileId,
                file: { name: p.fileName } as File,
                progress: p.progress,
                status: p.status,
                error: p.error
              }))}
              onClear={clearProgress}
            />
          </div>
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
              className="w-full h-full object-cover rounded-lg border cursor-zoom-in"
              onClick={() => {
                if (!disabled) {
                  const img = new Image();
                  img.src = url;
                  // simple browser viewer via new tab for now
                  window.open(url, '_blank');
                }
              }}
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
        disabled={disabled || isUploading || existingImages.length >= maxImages}
        className="w-full h-12 relative"
      >
        {isUploading ? (
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          buttonIcon
        )}
        {isUploading ? getTranslatedText("Загрузка...", "Uploading...") : (buttonText === "Загрузить фотографии" ? getTranslatedText("Загрузить фотографии", "Upload photos") : buttonText)}
        <input
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic,image/heif"
          onChange={handleFileChange}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={disabled}
        />
      </Button>

      {/* Professional progress indicator */}
      {uploadProgress.length > 0 && (
        <div className="mt-4">
          <UploadProgressIndicator
            uploads={uploadProgress.map(p => ({
              id: p.fileId,
              file: { name: p.fileName } as File,
              progress: p.progress,
              status: p.status,
              error: p.error
            }))}
            onClear={clearProgress}
          />
        </div>
      )}

      {existingImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {existingImages.map((url, index) => (
            <div key={index} className="relative aspect-square">
              <img
                src={url}
                alt={`Uploaded ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border cursor-zoom-in"
                onClick={() => {
                  if (!disabled) {
                    window.open(url, '_blank');
                  }
                }}
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
