import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { useOptimizedImageUpload } from "@/hooks/useOptimizedImageUpload";
import { useImageDeletionState } from "@/hooks/useImageDeletionState";
import { useLanguage } from "@/hooks/useLanguage";
import { getSellerPagesTranslations } from "@/utils/translations/sellerPages";
import OptimizedImageGallery from "@/components/ui/optimized-image-upload/OptimizedImageGallery";
import { isAllowedImage, getFileValidationError, getImageAcceptAttribute } from "@/utils/fileValidation";
import { toast } from "@/hooks/use-toast";

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

const OptimizedMediaSection: React.FC<OptimizedMediaSectionProps> = ({
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
      console.error('Error uploading files:', error);
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
      deleteImage(url).catch(console.error);
    } catch (error) {
      console.error('Error during deletion:', error);
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
            {isUploading ? 'Загрузка...' : 'Загрузить фото'}
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
          Отменить загрузку
        </Button>
      )}

      {/* Photo count info */}
      {imageUrls.length > 0 && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-800">
              📁 Фото: {imageUrls.length}/30
            </span>
            <span className="text-green-600 text-xs">
              🧠 Умное сжатие
            </span>
          </div>
        </div>
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

      {/* Smart compression info */}
      {isUploading && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            🧠 Умное сжатие для товаров
          </div>
          <div className="text-xs text-blue-600 mt-1">
            • Маленькие файлы (&lt;400KB) сохраняют оригинальное качество
            • Большие файлы сжимаются адаптивно без потери деталей
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedMediaSection;