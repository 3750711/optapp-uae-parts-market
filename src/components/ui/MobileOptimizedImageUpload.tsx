
import React, { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, X, Camera, Star, StarOff, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMobileOptimizedUpload } from "@/hooks/useMobileOptimizedUpload";
import { cn } from "@/lib/utils";
import { UploadProgressCard } from "@/components/ui/image-upload/UploadProgressCard";
import { shouldCompressFile, formatFileSize } from "@/utils/smartImageCompression";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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
  const { profile } = useAuth();
  const isSeller = profile?.user_type === 'seller';
  
  // Translation helper
  const getTranslatedText = (russianText: string, englishText: string) => {
    return isSeller ? englishText : russianText;
  };
  
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
    const MAX_PHOTO_SIZE_MB = 10;
    const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;
    const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

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
    const validFiles: File[] = [];

    // Анализ файлов для умного сжатия
    let compressionStats = { noCompress: 0, willCompress: 0 };

    for (const file of fileArray) {
      if (!ALLOWED_PHOTO_TYPES.includes(file.type.toLowerCase())) {
        if (!disableToast) {
          toast({
            title: "Неверный формат файла",
            description: `Файл "${file.name}" имеет неподдерживаемый формат.`,
            variant: "destructive",
          });
        }
        continue;
      }

      if (file.size > MAX_PHOTO_SIZE_BYTES) {
        if (!disableToast) {
          toast({
            title: "Файл слишком большой",
            description: `Размер файла "${file.name}" превышает ${MAX_PHOTO_SIZE_MB}MB.`,
            variant: "destructive",
          });
        }
        continue;
      }

      // Проверяем нужно ли сжатие
      if (shouldCompressFile(file.size)) {
        compressionStats.willCompress++;
        console.log(`🔄 Will compress: ${file.name} (${formatFileSize(file.size)})`);
      } else {
        compressionStats.noCompress++;
        console.log(`✨ No compression: ${file.name} (${formatFileSize(file.size)}) - preserving original quality`);
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      return;
    }

    // Показываем информацию о стратегии сжатия
    if (!disableToast && validFiles.length > 1) {
      const message = compressionStats.noCompress > 0 && compressionStats.willCompress > 0
        ? `${compressionStats.noCompress} файлов без сжатия (высокое качество), ${compressionStats.willCompress} файлов с умным сжатием`
        : compressionStats.noCompress > 0
        ? `Все ${compressionStats.noCompress} файлов сохранят оригинальное качество (< 400KB)`
        : `${compressionStats.willCompress} файлов будут оптимизированы с умным сжатием`;

      toast({
        title: "Умная обработка изображений",
        description: message,
      });
    }

    const uploadedUrls = await uploadFilesBatch(validFiles, {
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
          {isUploading ? getTranslatedText("Умная загрузка...", "Smart upload...") : (buttonText === "Загрузить фотографии" ? getTranslatedText("Загрузить фотографии", "Upload photos") : buttonText)}
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
            {getTranslatedText("Отменить загрузку", "Cancel upload")}
          </Button>
        )}

        {/* Smart compression info */}
        {isUploading && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
            {getTranslatedText("🧠 Умное качество: маленькие файлы без потерь, большие - оптимизация", "🧠 Smart quality: small files lossless, large files optimized")}
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
        onClick={handleButtonClick}
        disabled={disabled || isUploading || existingImages.length >= maxImages}
        className="w-full h-12"
      >
        {isUploading ? (
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          buttonIcon
        )}
        {isUploading ? getTranslatedText("Умная загрузка...", "Smart upload...") : (buttonText === "Загрузить фотографии" ? getTranslatedText("Загрузить фотографии", "Upload photos") : buttonText)}
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
          {getTranslatedText("Отменить загрузку", "Cancel upload")}
        </Button>
      )}

      {/* Smart compression info */}
      {isUploading && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            {getTranslatedText("🧠 Умная обработка изображений", "🧠 Smart Image Processing")}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {getTranslatedText(
              "• Файлы <400KB - оригинальное качество<br/>• Файлы >400KB - умная оптимизация",
              "• Files <400KB - original quality<br/>• Files >400KB - smart optimization"
            )}
          </div>
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
