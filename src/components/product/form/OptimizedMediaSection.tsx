import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, X, RotateCcw, Star } from "lucide-react";
import { useUploadUIAdapter } from "@/components/uploader/useUploadUIAdapter";
import { useLanguage } from "@/hooks/useLanguage";
import { getSellerPagesTranslations } from "@/utils/translations/sellerPages";
import { getFormTranslations } from "@/utils/translations/forms";
import { isAllowedImage, getFileValidationError, getImageAcceptAttribute } from "@/utils/fileValidation";
import { toast } from "@/hooks/use-toast";
import { logger } from '@/utils/logger';

interface OptimizedMediaSectionProps {
  imageUrls: string[];
  handleMobileOptimizedImageUpload: (urls: string[]) => void;
  onImageDelete?: (url: string) => void;
  onSetPrimaryImage?: (url: string) => void;
  primaryImage?: string;
  productId?: string;
  disabled?: boolean;
  onUploadStateChange?: (isUploading: boolean) => void;
}

const OptimizedMediaSection = React.memo<OptimizedMediaSectionProps>(({
  imageUrls,
  handleMobileOptimizedImageUpload,
  onImageDelete,
  onSetPrimaryImage,
  primaryImage,
  productId,
  disabled = false,
  onUploadStateChange
}) => {
  const { language } = useLanguage();
  const sp = getSellerPagesTranslations(language);
  const t = getFormTranslations(language);
  
  // Use modern upload system similar to SimplePhotoUploader
  const { items, uploadFiles, removeItem, retryItem, clearItems } = useUploadUIAdapter({
    max: 30,
    onChange: (completedUrls: string[]) => {
      if (completedUrls.length > 0) {
        handleMobileOptimizedImageUpload(completedUrls);
        
        // Set first image as primary if none selected
        if (!primaryImage && completedUrls.length > 0) {
          onSetPrimaryImage?.(completedUrls[0]);
        }
      }
    }
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUploading = items.some((item: any) => 
    item.status === 'pending' || item.status === 'uploading' || item.status === 'compressing'
  );

  // Notify parent about upload state changes
  useEffect(() => {
    onUploadStateChange?.(isUploading);
  }, [isUploading, onUploadStateChange]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    // Check total limit
    const currentImages = imageUrls.length + items.filter((item: any) => item.status === 'completed').length;
    if (currentImages >= 30) {
      toast({
        title: "Лимит изображений",
        description: "Достигнут максимум 30 изображений",
        variant: "destructive",
      });
      return;
    }
    
    fileArray.forEach(file => {
      if (!isAllowedImage(file)) {
        errors.push(getFileValidationError(file, 'image'));
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        errors.push(`"${file.name}" превышает лимит 50MB`);
        return;
      }
      validFiles.push(file);
    });

    if (errors.length > 0) {
      toast({
        title: "Ошибка валидации файлов",
        description: errors.slice(0, 3).join('\n'),
        variant: "destructive",
      });
    }

    if (validFiles.length === 0) return;

    try {
      await uploadFiles(validFiles);
    } catch (error) {
      logger.error('Error uploading files:', error);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadFiles, imageUrls.length, items, toast]);

  const handleImageDelete = useCallback(async (url: string) => {
    if (!url) return;
    
    try {
      // Remove from upload items if it's there
      const item = items.find((item: any) => item.cloudinaryUrl === url);
      if (item) {
        removeItem(item.id);
      }
      
      // Remove from parent state
      onImageDelete?.(url);
      
      // If deleted image was primary, set new primary
      if (primaryImage === url && imageUrls.length > 1) {
        const remainingUrls = imageUrls.filter(u => u !== url);
        if (remainingUrls.length > 0) {
          onSetPrimaryImage?.(remainingUrls[0]);
        }
      }
    } catch (error) {
      logger.error('Error during deletion:', error);
    }
  }, [items, removeItem, onImageDelete, primaryImage, imageUrls, onSetPrimaryImage]);

  // Count images and limits
  const totalImages = imageUrls.length + items.filter((item: any) => item.status === 'completed').length;
  const hasItems = imageUrls.length > 0 || items.length > 0;
  const hasReachedLimit = totalImages >= 30;
  
  // Get combined list of all images for gallery
  const allImages = [
    ...imageUrls.map(url => ({ type: 'uploaded', url, id: url })),
    ...items.map((item: any) => ({ type: 'uploading', item, id: item.id }))
  ];

  return (
    <div className="space-y-4">
      {/* Image count indicator */}
      {hasItems && (
        <div className="text-sm text-muted-foreground">
          {`Изображений: ${totalImages}/30`}
        </div>
      )}

      {/* Upload button */}
      {!hasReachedLimit && (
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 relative"
          disabled={disabled || isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? t.messages.uploadingMedia : 
           hasItems ? "Добавить ещё" : t.buttons.uploadPhotos}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={getImageAcceptAttribute()}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />
        </Button>
      )}

      {/* Cancel upload button */}
      {isUploading && (
        <Button
          type="button"
          variant="destructive"
          onClick={() => clearItems()}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          {t.buttons.cancelUpload}
        </Button>
      )}

      {/* Integrated Image Gallery */}
      {hasItems && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-live="polite">
          {allImages.map((img) => (
            <figure
              key={img.id}
              className="relative rounded-xl border border-border bg-card overflow-hidden aspect-square group hover:shadow-md transition-all duration-200"
            >
              {/* Image preview */}
              {img.type === 'uploaded' ? (
                <img
                  src={img.url}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover bg-muted"
                />
              ) : img.item.cloudinaryUrl || img.item.thumbUrl ? (
                <img
                  src={img.item.cloudinaryUrl || img.item.thumbUrl}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover bg-muted"
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-xs text-muted-foreground bg-muted px-2">
                  <div className="text-center">
                    <div className="font-medium truncate mb-1">
                      {img.item.originalFile?.name || "Загрузка..."}
                    </div>
                    {img.item.isHeic && (
                      <div className="text-xs opacity-75">HEIC → JPEG</div>
                    )}
                  </div>
                </div>
              )}

              {/* Progress overlay for uploading items */}
              {img.type === 'uploading' && img.item.status !== 'completed' && (
                <figcaption className="absolute inset-0 bg-black/60 text-white text-xs grid place-items-center p-2 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="mb-2">
                      {img.item.status === 'uploading' 
                        ? `${Math.round(img.item.progress || 0)}%` 
                        : getStatusLabel(img.item.status)}
                    </div>
                    {img.item.status === 'uploading' && (
                      <div className="w-full bg-white/20 rounded-full h-1.5 mb-2">
                        <div 
                          className="bg-white h-1.5 rounded-full transition-all duration-300" 
                          style={{ width: `${img.item.progress || 0}%` }}
                        />
                      </div>
                    )}
                  </div>
                </figcaption>
              )}

              {/* Primary image indicator */}
              {((img.type === 'uploaded' && img.url === primaryImage) || 
                (img.type === 'uploading' && img.item.cloudinaryUrl === primaryImage)) && (
                <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 shadow-sm">
                  <Star className="h-3 w-3 fill-current" />
                  Главное
                </div>
              )}

              {/* Control buttons */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {/* Retry button for failed uploads */}
                {img.type === 'uploading' && img.item.status === 'error' && (
                  <button
                    type="button"
                    onClick={() => retryItem(img.item.id)}
                    className="p-1.5 rounded-md text-xs bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-sm"
                    title="Повторить загрузку"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                )}

                {/* Set primary button */}
                {((img.type === 'uploaded') || 
                  (img.type === 'uploading' && img.item.status === 'completed' && img.item.cloudinaryUrl)) && (
                  <button
                    type="button"
                    onClick={() => {
                      const url = img.type === 'uploaded' ? img.url : img.item.cloudinaryUrl;
                      onSetPrimaryImage?.(url);
                    }}
                    className={`p-1.5 rounded-md text-xs transition-colors shadow-sm ${
                      ((img.type === 'uploaded' && img.url === primaryImage) || 
                       (img.type === 'uploading' && img.item.cloudinaryUrl === primaryImage))
                        ? 'bg-yellow-500 text-white'
                        : 'bg-white/90 hover:bg-white text-gray-700'
                    }`}
                    title={primaryImage === (img.type === 'uploaded' ? img.url : img.item.cloudinaryUrl) ? "Главное изображение" : "Сделать главным"}
                  >
                    <Star className="h-3 w-3" />
                  </button>
                )}

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => {
                    if (img.type === 'uploaded') {
                      handleImageDelete(img.url);
                    } else {
                      removeItem(img.item.id);
                    }
                  }}
                  className="p-1.5 rounded-md text-xs bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
                  title="Удалить"
                  aria-label="Удалить"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

            </figure>
          ))}
        </div>
      )}
    </div>
  );

  // Helper function for status labels
  function getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Ожидание...';
      case 'compressing': return 'Сжатие...';
      case 'signing': return 'Подпись...';
      case 'uploading': return 'Загрузка...';
      case 'error': return 'Ошибка';
      default: return 'Обработка...';
    }
  }
}, (prevProps, nextProps) => {
  return (
    prevProps.imageUrls.length === nextProps.imageUrls.length &&
    prevProps.imageUrls.every((url, idx) => url === nextProps.imageUrls[idx]) &&
    prevProps.primaryImage === nextProps.primaryImage &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.productId === nextProps.productId
  );
});

OptimizedMediaSection.displayName = 'OptimizedMediaSection';

export default OptimizedMediaSection;