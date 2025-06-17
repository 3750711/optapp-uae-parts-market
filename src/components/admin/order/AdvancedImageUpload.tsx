import React, { useCallback } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { useOptimizedImageUpload } from "@/hooks/useOptimizedImageUpload";
import OptimizedImageGallery from "@/components/ui/optimized-image-upload/OptimizedImageGallery";

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
  const { uploadFiles, uploadQueue, isUploading, cancelUpload, markAsDeleted } = useOptimizedImageUpload();

  console.log('📊 AdvancedImageUpload render:', { 
    imageCount: images.length, 
    uploadQueueLength: uploadQueue.length,
    isUploading
  });

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    console.log('📁 Files selected for advanced upload:', files.length);

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

    try {
      console.log('🚀 Starting advanced upload of', validImageFiles.length, 'files');
      
      // Use dynamic compression settings based on file size
      const getCompressionOptions = (file: File) => {
        const isLargeFile = file.size > 10 * 1024 * 1024; // >10MB
        
        return {
          maxSizeMB: isLargeFile ? 0.3 : 0.8,
          maxWidthOrHeight: isLargeFile ? 600 : 1000,
          initialQuality: isLargeFile ? 0.6 : 0.8,
          fileType: 'image/webp'
        };
      };

      const uploadedUrls = await uploadFiles(validImageFiles, {
        productId: orderId, // Changed from orderId to productId
        maxConcurrent: 1,
        disableToast: false,
        compressionOptions: getCompressionOptions(validImageFiles[0])
      });
      
      if (uploadedUrls.length > 0) {
        console.log('✅ Advanced upload completed:', uploadedUrls);
        
        // Update images with new URLs (append to existing)
        const newImages = [...images, ...uploadedUrls];
        onImagesUpload(newImages);
      } else {
        console.warn('⚠️ No images were successfully uploaded');
      }
    } catch (error) {
      console.error('💥 Error in advanced upload:', error);
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
      // 1. Mark as deleted in upload queue
      markAsDeleted(url);
      
      // 2. Update UI immediately - remove from images list
      const newImageUrls = images.filter(imgUrl => imgUrl !== url);
      console.log('📱 Updating images UI immediately:', { 
        before: images.length, 
        after: newImageUrls.length 
      });
      
      // 3. If deleting primary image and others exist, set new primary
      if (primaryImage === url && newImageUrls.length > 0 && onSetPrimaryImage) {
        console.log('🔄 Setting new primary image:', newImageUrls[0]);
        onSetPrimaryImage(newImageUrls[0]);
      }
      
      onImagesUpload(newImageUrls);
      
      // 4. Backend deletion (if implemented)
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
    ['pending', 'compressing', 'uploading'].includes(item.status)
  );

  return (
    <div className="space-y-6">
      {/* Header with upload info */}
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Изображения заказа</Label>
        <div className="text-sm text-gray-600">
          📸 {images.length}/{maxImages} изображений
        </div>
      </div>

      {/* Upload Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => document.getElementById('advanced-image-input')?.click()}
        disabled={disabled || hasActiveUploads || !canUploadMore}
        className="w-full h-12"
      >
        {hasActiveUploads ? (
          <>
            <Upload className="mr-2 h-4 w-4 animate-pulse" />
            Загрузка по одному...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Загрузить фото ({images.length}/{maxImages})
          </>
        )}
      </Button>
      
      <input
        id="advanced-image-input"
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || hasActiveUploads}
      />

      {/* Cancel upload button */}
      {hasActiveUploads && (
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

      {/* Upload info */}
      {images.length > 0 && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-800">
              ✅ Загружено изображений: {images.length}
            </span>
            <span className="text-green-600 text-xs">
              🚀 Оптимизировано для быстрой загрузки
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
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            ⚡ Применяется сжатие и оптимизация для ускорения загрузки
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Большие файлы сжимаются до 70% от исходного размера
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedImageUpload;
