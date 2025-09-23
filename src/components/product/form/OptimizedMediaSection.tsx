import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { useOptimizedImageUpload } from "@/hooks/useOptimizedImageUpload";
import { useImageDeletionState } from "@/hooks/useImageDeletionState";
import { useLanguage } from "@/hooks/useLanguage";
import { getSellerPagesTranslations } from "@/utils/translations/sellerPages";
import { getFormTranslations } from "@/utils/translations/forms";
import OptimizedImageGallery from "@/components/ui/optimized-image-upload/OptimizedImageGallery";
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
  
  const { uploadFiles, uploadQueue, isUploading, cancelUpload, markAsDeleted } = useOptimizedImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notify parent about upload state changes (only images)
  useEffect(() => {
    onUploadStateChange?.(isUploading);
  }, [isUploading, onUploadStateChange]);

  const { deleteImage } = useImageDeletionState({
    onConfirmDelete: async (url: string) => {
      if (onImageDelete) {
        await onImageDelete(url);
      }
    }
  });

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];
    
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
      const uploadedUrls = await uploadFiles(validFiles, {
        productId,
        maxConcurrent: 1,
        disableToast: false
      });
      
      if (uploadedUrls.length > 0) {
        handleMobileOptimizedImageUpload(uploadedUrls);
      }
    } catch (error) {
      logger.error('Error uploading files:', error);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadFiles, productId, handleMobileOptimizedImageUpload]);

  const handleImageDelete = useCallback(async (url: string) => {
    if (!url || !imageUrls.includes(url)) return;
    
    try {
      markAsDeleted(url);
      const newImageUrls = imageUrls.filter(imgUrl => imgUrl !== url);
      
      if (primaryImage === url && newImageUrls.length > 0 && onSetPrimaryImage) {
        onSetPrimaryImage(newImageUrls[0]);
      }
      
      handleMobileOptimizedImageUpload(newImageUrls);
      deleteImage(url).catch(logger.error);
    } catch (error) {
      logger.error('Error during deletion:', error);
    }
  }, [imageUrls, handleMobileOptimizedImageUpload, deleteImage, markAsDeleted, primaryImage, onSetPrimaryImage]);

  return (
    <div className="space-y-6">
      {/* Photo upload button only */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 relative"
            disabled={disabled || isUploading || imageUrls.length >= 30}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? t.messages.uploadingMedia : t.buttons.uploadPhotos}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={getImageAcceptAttribute()}
              onChange={handleFileSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={disabled || isUploading}
            />
          </Button>
        </div>
      </div>

      {/* Cancel upload button */}
      {isUploading && (
        <Button
          type="button"
          variant="destructive"
          onClick={cancelUpload}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          {t.buttons.cancelUpload}
        </Button>
      )}

      {/* Image gallery */}
      <OptimizedImageGallery
        images={imageUrls}
        uploadQueue={uploadQueue}
        primaryImage={primaryImage}
        onSetPrimary={onSetPrimaryImage}
        onDelete={handleImageDelete}
        disabled={disabled}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.imageUrls.length === nextProps.imageUrls.length &&
    prevProps.imageUrls.every((url, idx) => url === nextProps.imageUrls[idx]) &&
    prevProps.primaryImage === nextProps.primaryImage &&
    prevProps.disabled === nextProps.disabled
  );
});

OptimizedMediaSection.displayName = 'OptimizedMediaSection';

export default OptimizedMediaSection;