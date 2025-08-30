
import React, { useCallback } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X, Pause, Play } from "lucide-react";
import { useDirectCloudinaryUpload } from "@/hooks/useDirectCloudinaryUpload";
import OptimizedImageGallery from "@/components/ui/optimized-image-upload/OptimizedImageGallery";
import { CloudinaryUploadProgress } from "@/components/ui/CloudinaryUploadProgress";
import { useLanguage } from "@/hooks/useLanguage";
import { getSellerPagesTranslations } from "@/utils/translations/sellerPages";

interface AdvancedImageUploadProps {
  images: string[];
  onImagesUpload: (urls: string[]) => void;
  onImageDelete?: (url: string) => void;
  onSetPrimaryImage?: (url: string) => void;
  primaryImage?: string;
  orderId?: string;
  disabled?: boolean;
  maxImages?: number;
}

const AdvancedImageUpload: React.FC<AdvancedImageUploadProps> = ({
  images,
  onImagesUpload,
  onImageDelete,
  onSetPrimaryImage,
  primaryImage,
  orderId,
  disabled = false,
  maxImages = 25
}) => {
  const { 
    uploadFiles, 
    uploadQueue, 
    persistentQueue,
    isUploading, 
    isPaused,
    pauseUpload,
    resumeUpload,
    cancelUpload, 
    markAsDeleted,
    networkProfile
  } = useDirectCloudinaryUpload();
  const { language } = useLanguage();
  const t = getSellerPagesTranslations(language);

  console.log('📊 AdvancedImageUpload render:', { 
    imageCount: images.length, 
    uploadQueueLength: uploadQueue.length,
    isUploading
  });

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !orderId) return;

    console.log('📁 Files selected for direct upload:', files.length);

    const fileArray = Array.from(files);
    
    // Validate image files
    const validImageFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) {
        console.warn('⚠️ Skipping non-image file:', file.name);
        return false;
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        console.warn('⚠️ Skipping oversized file:', file.name, 'Size:', file.size);
        return false;
      }
      return true;
    });

    if (validImageFiles.length === 0) {
      console.warn('⚠️ No valid image files selected');
      return;
    }

    // Check limits
    if (images.length + validImageFiles.length > maxImages) {
      console.warn(`⚠️ Image limit exceeded: trying to add ${validImageFiles.length}, current: ${images.length}, max: ${maxImages}`);
      return;
    }

    if (!orderId) {
      console.error('⚠️ No orderId provided for upload');
      return;
    }

    try {
      console.log('🚀 Starting direct Cloudinary upload:', validImageFiles.length, 'files');
      
      // Log file information
      validImageFiles.forEach(file => {
        const sizeKB = Math.round(file.size / 1024);
        const willCompress = file.size >= 400 * 1024; // 400KB threshold
        console.log(`📋 File: ${file.name} (${sizeKB}KB) - ${willCompress ? 'WILL COMPRESS' : 'NO COMPRESSION'}`);
      });

      // Use direct upload with adaptive compression
      const uploadedUrls = await uploadFiles(validImageFiles, {
        orderId,
        disableToast: false
      });
      
      if (uploadedUrls.length > 0) {
        console.log('✅ Direct upload completed:', uploadedUrls);
        const newImages = [...images, ...uploadedUrls];
        onImagesUpload(newImages);
      } else {
        console.warn('⚠️ No images were successfully uploaded');
      }
    } catch (error) {
      console.error('💥 Error in direct upload:', error);
    }
    
    // Reset input
    event.target.value = '';
  }, [uploadFiles, orderId, onImagesUpload, images, maxImages]);

  const handleImageDelete = useCallback(async (url: string) => {
    console.log('🎯 AdvancedImageUpload handleImageDelete:', url);
    
    if (!url || !images.includes(url)) {
      console.warn('⚠️ Invalid image URL for deletion:', url);
      return;
    }
    
    try {
      markAsDeleted(url);
      
      const newImageUrls = images.filter(imgUrl => imgUrl !== url);
      console.log('📱 Updating images UI immediately:', { 
        before: images.length, 
        after: newImageUrls.length 
      });
      
      if (primaryImage === url && newImageUrls.length > 0 && onSetPrimaryImage) {
        console.log('🔄 Setting new primary image:', newImageUrls[0]);
        onSetPrimaryImage(newImageUrls[0]);
      }
      
      onImagesUpload(newImageUrls);
      
      if (onImageDelete) {
        onImageDelete(url);
      }
      
      console.log('✅ Image removal completed in AdvancedImageUpload');
    } catch (error) {
      console.error('❌ Error during image deletion:', error);
    }
  }, [images, onImagesUpload, markAsDeleted, primaryImage, onSetPrimaryImage, onImageDelete]);

  const canUploadMore = images.length < maxImages;
  const hasActiveUploads = uploadQueue.some(item => 
    ['pending', 'compressing', 'signing', 'uploading'].includes(item.status)
  );
  const hasPausedUploads = uploadQueue.some(item => item.status === 'paused');

  return (
    <div className="space-y-6 max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain">
      {/* Header with upload info */}
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">{t.imageUpload.title}</Label>
        <div className="text-sm text-muted-foreground">
          📸 {t.imageUpload.imagesCount.replace('{count}', images.length.toString()).replace('{max}', maxImages.toString())}
        </div>
      </div>

      {/* Upload Button */}
      <Button
        type="button"
        variant="outline"
        disabled={disabled || (hasActiveUploads && !isPaused) || !canUploadMore}
        className="w-full h-12 relative"
      >
        {hasActiveUploads && !isPaused ? (
          <>
            <Upload className="mr-2 h-4 w-4 animate-pulse" />
            Загрузка...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            {t.imageUpload.uploadPhotos.replace('{count}', images.length.toString()).replace('{max}', maxImages.toString())}
          </>
        )}
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="absolute inset-0 opacity-0 cursor-pointer"
          disabled={disabled || (hasActiveUploads && !isPaused) || !orderId}
        />
      </Button>

      {/* Upload progress component */}
      {uploadQueue.length > 0 && (
        <CloudinaryUploadProgress
          uploadQueue={uploadQueue}
          isUploading={isUploading}
          isPaused={isPaused}
          networkProfile={networkProfile}
          onPause={pauseUpload}
          onResume={() => orderId && resumeUpload({ orderId })}
          onCancel={cancelUpload}
        />
      )}

      {/* Upload controls - simplified since CloudinaryUploadProgress handles controls */}
      {(hasActiveUploads || hasPausedUploads) && uploadQueue.length === 0 && (
        <div className="flex gap-2">
          {hasActiveUploads && !isPaused && (
            <Button
              type="button"
              variant="secondary"
              onClick={pauseUpload}
              className="flex-1"
            >
              <Pause className="h-4 w-4 mr-2" />
              Пауза
            </Button>
          )}
          
          {(isPaused || hasPausedUploads) && orderId && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => resumeUpload({ orderId })}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Продолжить
            </Button>
          )}
          
          <Button
            type="button"
            variant="destructive"
            onClick={cancelUpload}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Отменить
          </Button>
        </div>
      )}

      {/* Upload success info */}
      {images.length > 0 && (
        <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-success-foreground">
              ✅ Загружено {images.length} фотографий
            </span>
            <span className="text-success-foreground/70 text-xs">
              Автосжатие WebP
            </span>
          </div>
        </div>
      )}

      {/* Optimized Image Gallery */}
      <OptimizedImageGallery
        images={images}
        uploadQueue={uploadQueue}
        primaryImage={primaryImage}
        onSetPrimary={onSetPrimaryImage}
        onDelete={handleImageDelete}
        disabled={disabled}
      />

      {/* Upload progress info */}
      {hasActiveUploads && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="text-sm text-primary-foreground">
            📡 Прямая загрузка в Cloudinary
          </div>
          <div className="text-xs text-primary-foreground/70 mt-1">
            • Адаптивное сжатие по сети<br/>
            • WebP формат для экономии трафика<br/>
            • Автоматические ретраи при ошибках
          </div>
        </div>
      )}

      {/* Network info - now handled by CloudinaryUploadProgress */}
      {hasActiveUploads && uploadQueue.length === 0 && (
        <div className="text-xs text-muted-foreground text-center">
          Используется профиль сжатия для {networkProfile.effectiveType || '4g'} сети
        </div>
      )}
    </div>
  );
};

export default AdvancedImageUpload;
