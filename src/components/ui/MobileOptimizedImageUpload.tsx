
import React, { useCallback, useRef, useState } from 'react';
import { toast } from "@/hooks/use-toast";
import { uploadDirectToCloudinary } from "@/utils/cloudinaryUpload";
import { getPreviewImageUrl, getBatchImageUrls } from "@/utils/cloudinaryUtils";
import { ExistingImagesGallery } from "./image-upload/ExistingImagesGallery";
import { CloudinaryIntegrationInfo } from "./image-upload/CloudinaryIntegrationInfo";
import { UploadControls } from "./image-upload/UploadControls";
import { FilePreviewCard } from "./image-upload/FilePreviewCard";
import { UploadProgressCard } from "./image-upload/UploadProgressCard";
import { UsageInfo } from "./image-upload/UsageInfo";

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  cloudinaryUrl?: string;
  publicId?: string;
  isPrimary?: boolean;
}

interface MobileOptimizedImageUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxImages?: number;
  existingImages?: string[];
  onImageDelete?: (url: string) => void;
  onSetPrimaryImage?: (url: string) => void;
  primaryImage?: string;
  productId?: string;
}

export const MobileOptimizedImageUpload: React.FC<MobileOptimizedImageUploadProps> = ({
  onUploadComplete,
  maxImages = 25,
  existingImages = [],
  onImageDelete,
  onSetPrimaryImage,
  primaryImage,
  productId
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Detect mobile device
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                         window.innerWidth <= 768;

  // Format file size helper
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Check limits
    const totalAfterUpload = existingImages.length + files.length;
    if (totalAfterUpload > maxImages) {
      toast({
        title: "Превышен лимит",
        description: `Можно загрузить максимум ${maxImages} изображений. У вас уже ${existingImages.length}, пытаетесь добавить ${files.length}.`,
        variant: "destructive",
      });
      return;
    }

    // Validate file types
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/');
      if (!isValid) {
        toast({
          title: "Неподдерживаемый файл",
          description: `Файл ${file.name} не является изображением`,
          variant: "destructive",
        });
      }
      return isValid;
    });

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
    }
  }, [existingImages.length, maxImages]);

  // Upload single file directly to Cloudinary
  const uploadSingleFile = useCallback(async (
    file: File, 
    fileId: string,
    isPrimary: boolean = false
  ): Promise<string | null> => {
    try {
      console.log('🚀 Starting direct Cloudinary upload:', {
        fileName: file.name,
        fileSize: file.size,
        isPrimary,
        productId
      });

      // Update progress
      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { ...p, status: 'uploading', progress: 20, isPrimary }
          : p
      ));

      // Create custom public_id
      const customPublicId = `product_${productId || Date.now()}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Upload directly to Cloudinary
      const result = await uploadDirectToCloudinary(file, productId, customPublicId);

      if (result.success && result.cloudinaryUrl && result.publicId) {
        console.log('✅ Cloudinary upload successful:', {
          cloudinaryUrl: result.cloudinaryUrl,
          publicId: result.publicId
        });

        setUploadProgress(prev => prev.map(p => 
          p.fileId === fileId 
            ? { 
                ...p, 
                status: 'success', 
                progress: 100,
                cloudinaryUrl: result.cloudinaryUrl,
                publicId: result.publicId
              }
            : p
        ));

        return result.cloudinaryUrl;
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      console.error('💥 Upload error:', errorMessage);

      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { ...p, status: 'error', error: errorMessage }
          : p
      ));

      return null;
    }
  }, [productId]);

  // Start upload process
  const startUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);

    // Initialize progress tracking
    const initialProgress: UploadProgress[] = selectedFiles.map((file, index) => ({
      fileId: `file-${Date.now()}-${index}`,
      fileName: file.name,
      progress: 0,
      status: 'pending',
      isPrimary: index === 0 // First file is primary
    }));
    
    setUploadProgress(initialProgress);

    const uploadedUrls: string[] = [];

    // Process files sequentially for better control
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const progressItem = initialProgress[i];
      
      try {
        const url = await uploadSingleFile(file, progressItem.fileId, progressItem.isPrimary);
        
        if (url) {
          uploadedUrls.push(url);
        }
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }

      // Small delay between uploads
      if (i < selectedFiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (uploadedUrls.length > 0) {
      onUploadComplete(uploadedUrls);
      
      setSelectedFiles([]);

      toast({
        title: "Загрузка завершена",
        description: `Успешно загружено ${uploadedUrls.length} из ${selectedFiles.length} файлов.`,
      });
    }

    setIsUploading(false);
  }, [selectedFiles, uploadSingleFile, onUploadComplete]);

  // Clear files and preview
  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  // Clear progress
  const clearProgress = useCallback(() => {
    setUploadProgress([]);
  }, []);

  return (
    <div className="space-y-4">
      <ExistingImagesGallery
        existingImages={existingImages}
        maxImages={maxImages}
        primaryImage={primaryImage}
        onSetPrimaryImage={onSetPrimaryImage}
        onImageDelete={onImageDelete}
        isMobileDevice={isMobileDevice}
      />

      <CloudinaryIntegrationInfo />

      <UploadControls
        isUploading={isUploading}
        existingImagesCount={existingImages.length}
        maxImages={maxImages}
        isMobileDevice={isMobileDevice}
        onFileSelect={() => fileInputRef.current?.click()}
        onCameraSelect={() => cameraInputRef.current?.click()}
      />

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      <FilePreviewCard
        selectedFiles={selectedFiles}
        isUploading={isUploading}
        onClearFiles={clearFiles}
        onStartUpload={startUpload}
        formatFileSize={formatFileSize}
      />

      <UploadProgressCard
        uploadProgress={uploadProgress}
        isUploading={isUploading}
        onClearProgress={clearProgress}
        formatFileSize={formatFileSize}
      />

      <UsageInfo
        existingImagesCount={existingImages.length}
        maxImages={maxImages}
      />
    </div>
  );
};
