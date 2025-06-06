
import { useState, useCallback, useRef } from 'react';
import { toast } from "@/hooks/use-toast";
import { uploadDirectToCloudinary } from "@/utils/cloudinaryUpload";
import { validateImageForMarketplace, logImageProcessing } from "@/utils/imageProcessingUtils";
import { getPreviewImageUrl, getBatchImageUrls } from "@/utils/cloudinaryUtils";

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error' | 'retrying' | 'processing';
  error?: string;
  cloudinaryUrl?: string;
  publicId?: string;
  previewUrl?: string;
  hasPreview?: boolean;
  isPrimary?: boolean;
  variants?: any;
}

interface BatchUploadOptions {
  batchSize?: number;
  batchDelay?: number;
  maxRetries?: number;
  productId?: string;
  autoGeneratePreview?: boolean;
}

export const useMobileOptimizedUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [canCancel, setCanCancel] = useState(false);
  const cancelRef = useRef(false);

  // Detect mobile device
  const isMobileDevice = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= 768;
  }, []);

  // Detect device capabilities
  const getDeviceCapabilities = useCallback(() => {
    const isMobile = isMobileDevice();
    const memory = (navigator as any).deviceMemory || 4;
    const isLowEnd = memory <= 2 || isMobile;
    
    return {
      isMobile,
      isLowEnd,
      memory,
      maxConcurrent: isLowEnd ? 1 : 2, // Reduced since Cloudinary handles processing
      batchSize: isLowEnd ? 2 : 4,
      compressionQuality: 1.0, // Not used anymore - Cloudinary handles this
      maxResolution: 0 // Not used anymore - Cloudinary handles this
    };
  }, [isMobileDevice]);

  // Upload single file directly to Cloudinary
  const uploadSingleFile = useCallback(async (
    file: File, 
    fileId: string, 
    options: BatchUploadOptions,
    retryCount = 0,
    isPrimary = false
  ): Promise<string> => {
    const maxRetries = options.maxRetries || 3;
    
    try {
      console.log('🚀 Starting Cloudinary-only upload:', {
        fileName: file.name,
        fileId,
        productId: options.productId,
        isPrimary,
        retryCount
      });

      // Update progress
      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { ...p, status: retryCount > 0 ? 'retrying' : 'uploading', progress: 10, isPrimary }
          : p
      ));

      // Validate file
      const validation = validateImageForMarketplace(file);
      if (!validation.isValid) {
        throw new Error(validation.errorMessage || 'Invalid file');
      }

      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId ? { ...p, progress: 30 } : p
      ));

      // Check for cancellation
      if (cancelRef.current) {
        throw new Error('Upload cancelled');
      }

      // Create custom public_id
      const customPublicId = `product_${options.productId || Date.now()}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId ? { ...p, progress: 50, status: 'processing' } : p
      ));

      // Upload directly to Cloudinary with full processing
      console.log('☁️ Uploading to Cloudinary...');
      const result = await uploadDirectToCloudinary(file, options.productId, customPublicId);

      if (!result.success || !result.cloudinaryUrl || !result.publicId) {
        throw new Error(result.error || 'Cloudinary upload failed');
      }

      console.log('✅ Cloudinary upload completed:', {
        cloudinaryUrl: result.cloudinaryUrl,
        publicId: result.publicId,
        originalSize: result.originalSize,
        isPrimary
      });

      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId ? { ...p, progress: 80, cloudinaryUrl: result.cloudinaryUrl, publicId: result.publicId } : p
      ));

      // Generate all image variants using public_id
      const batchUrls = getBatchImageUrls(result.publicId);
      const previewUrl = getPreviewImageUrl(result.publicId);

      console.log('🎨 Generated image variants:', {
        preview: previewUrl,
        thumbnail: batchUrls.thumbnail,
        card: batchUrls.card,
        detail: batchUrls.detail
      });

      // Final success update
      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { 
              ...p, 
              status: 'success', 
              progress: 100, 
              cloudinaryUrl: result.cloudinaryUrl,
              publicId: result.publicId,
              previewUrl,
              hasPreview: true,
              variants: batchUrls,
              isPrimary
            }
          : p
      ));

      logImageProcessing('CloudinaryUploadSuccess', { 
        fileName: file.name,
        originalSize: file.size,
        cloudinaryUrl: result.cloudinaryUrl,
        publicId: result.publicId,
        retryCount,
        previewUrl,
        productId: options.productId,
        isPrimary
      });

      return result.cloudinaryUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      console.error('💥 Cloudinary upload error:', {
        fileName: file.name,
        error: errorMessage,
        retryCount,
        productId: options.productId,
        fileId,
        isPrimary
      });

      logImageProcessing('CloudinaryUploadError', {
        fileName: file.name,
        error: errorMessage,
        retryCount,
        productId: options.productId,
        isPrimary
      });

      if (retryCount < maxRetries && !cancelRef.current) {
        // Retry with exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`🔄 Retrying Cloudinary upload in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return uploadSingleFile(file, fileId, options, retryCount + 1, isPrimary);
      } else {
        // Final failure
        setUploadProgress(prev => prev.map(p => 
          p.fileId === fileId 
            ? { ...p, status: 'error', error: errorMessage }
            : p
        ));
        
        throw error;
      }
    }
  }, []);

  // Process files in batches - all go directly to Cloudinary
  const uploadFilesBatch = useCallback(async (
    files: File[],
    options: BatchUploadOptions = {}
  ): Promise<string[]> => {
    const capabilities = getDeviceCapabilities();
    const batchSize = options.batchSize || capabilities.batchSize;
    const batchDelay = options.batchDelay || (capabilities.isLowEnd ? 1500 : 1000);
    
    console.log('📦 STARTING CLOUDINARY BATCH UPLOAD:', {
      fileCount: files.length,
      productId: options.productId,
      batchSize,
      cloudinaryOnly: true
    });

    setIsUploading(true);
    setCanCancel(true);
    cancelRef.current = false;

    // Initialize progress tracking
    const initialProgress: UploadProgress[] = files.map((file, index) => ({
      fileId: `file-${Date.now()}-${index}`,
      fileName: file.name,
      progress: 0,
      status: 'pending',
      isPrimary: index === 0 // First file is considered primary
    }));
    
    setUploadProgress(initialProgress);

    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    try {
      // Process files in batches
      for (let i = 0; i < files.length; i += batchSize) {
        if (cancelRef.current) break;

        const batch = files.slice(i, i + batchSize);
        const batchProgress = initialProgress.slice(i, i + batchSize);

        console.log(`📋 Processing Cloudinary batch ${Math.floor(i / batchSize) + 1}:`, {
          batchFiles: batch.map(f => f.name),
          productId: options.productId
        });

        // Process batch sequentially for better error handling
        for (let j = 0; j < batch.length; j++) {
          if (cancelRef.current) break;
          
          try {
            const fileId = batchProgress[j].fileId;
            const isPrimary = batchProgress[j].isPrimary || false;
            const url = await uploadSingleFile(batch[j], fileId, options, 0, isPrimary);
            uploadedUrls.push(url);
          } catch (error) {
            errors.push(`${batch[j].name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Delay between batches to avoid overwhelming Cloudinary
        if (i + batchSize < files.length && !cancelRef.current) {
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
      }

      console.log('🎉 CLOUDINARY BATCH UPLOAD COMPLETED:', {
        uploaded: uploadedUrls.length,
        total: files.length,
        errors: errors.length,
        productId: options.productId
      });

      if (uploadedUrls.length > 0) {
        const message = `Успешно загружено ${uploadedUrls.length} из ${files.length} файлов в Cloudinary с автоматическим сжатием до 400KB и созданием превью 20KB.`;
        
        toast({
          title: "Загрузка в Cloudinary завершена",
          description: message,
        });
      }

      if (errors.length > 0) {
        toast({
          title: "Ошибки загрузки",
          description: `Не удалось загрузить ${errors.length} файлов в Cloudinary.`,
          variant: "destructive",
        });
      }

      return uploadedUrls;
    } catch (error) {
      console.error('💥 Batch Cloudinary upload error:', error);

      logImageProcessing('BatchCloudinaryUploadError', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        totalFiles: files.length,
        successfulUploads: uploadedUrls.length,
        productId: options.productId
      });

      toast({
        title: "Ошибка загрузки в Cloudinary",
        description: "Произошла ошибка при загрузке файлов в Cloudinary",
        variant: "destructive",
      });

      return uploadedUrls;
    } finally {
      setIsUploading(false);
      setCanCancel(false);
    }
  }, [uploadSingleFile, getDeviceCapabilities]);

  // Cancel upload
  const cancelUpload = useCallback(() => {
    cancelRef.current = true;
    setCanCancel(false);
    
    toast({
      title: "Загрузка отменена",
      description: "Загрузка файлов в Cloudinary была прервана",
    });
  }, []);

  // Retry failed uploads
  const retryFailedUploads = useCallback(async (options: BatchUploadOptions = {}) => {
    const failedFiles = uploadProgress.filter(p => p.status === 'error');
    
    if (failedFiles.length === 0) {
      toast({
        title: "Нет файлов для повтора",
        description: "Все файлы успешно загружены в Cloudinary",
      });
      return [];
    }

    setUploadProgress(prev => prev.map(p => 
      p.status === 'error' 
        ? { ...p, status: 'pending', progress: 0, error: undefined }
        : p
    ));

    const filesToRetry = failedFiles.map(p => {
      return new File([], p.fileName);
    });

    return uploadFilesBatch(filesToRetry, options);
  }, [uploadProgress, uploadFilesBatch]);

  // Clear progress
  const clearProgress = useCallback(() => {
    setUploadProgress([]);
  }, []);

  return {
    isUploading,
    uploadProgress,
    canCancel,
    uploadFilesBatch,
    cancelUpload,
    retryFailedUploads,
    clearProgress,
    isMobileDevice: isMobileDevice(),
    deviceCapabilities: getDeviceCapabilities()
  };
};
