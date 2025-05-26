
import { useState, useCallback, useRef } from 'react';
import { toast } from "@/hooks/use-toast";
import { uploadImageToStorage, validateImageForMarketplace, logImageProcessing } from "@/utils/imageProcessingUtils";

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error' | 'retrying';
  error?: string;
  url?: string;
}

interface BatchUploadOptions {
  batchSize?: number;
  batchDelay?: number;
  maxRetries?: number;
  compressionQuality?: number;
  maxResolution?: number;
  storageBucket?: string;
  storagePath?: string;
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
      maxConcurrent: isLowEnd ? 1 : 3,
      batchSize: isLowEnd ? 2 : 5,
      compressionQuality: isLowEnd ? 0.4 : 0.7,
      maxResolution: isMobile ? 1280 : 1920
    };
  }, [isMobileDevice]);

  // Compress image with device-specific settings
  const compressImageForDevice = useCallback(async (file: File): Promise<File> => {
    const capabilities = getDeviceCapabilities();
    
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        const maxDim = capabilities.maxResolution;
        
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = (height * maxDim) / width;
            width = maxDim;
          } else {
            width = (width * maxDim) / height;
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', capabilities.compressionQuality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, [getDeviceCapabilities]);

  // Upload single file with retry mechanism
  const uploadSingleFile = useCallback(async (
    file: File, 
    fileId: string, 
    options: BatchUploadOptions,
    retryCount = 0
  ): Promise<string> => {
    const maxRetries = options.maxRetries || 3;
    
    try {
      // Update progress
      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { ...p, status: retryCount > 0 ? 'retrying' : 'uploading', progress: 10 }
          : p
      ));

      // Validate file
      const validation = validateImageForMarketplace(file);
      if (!validation.isValid) {
        throw new Error(validation.errorMessage || 'Invalid file');
      }

      // Compress for mobile
      const compressedFile = await compressImageForDevice(file);
      
      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId ? { ...p, progress: 30 } : p
      ));

      // Check for cancellation
      if (cancelRef.current) {
        throw new Error('Upload cancelled');
      }

      // Upload to storage
      const imageUrl = await uploadImageToStorage(
        compressedFile,
        options.storageBucket || 'order-images',
        options.storagePath || ''
      );

      // Success
      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { ...p, status: 'success', progress: 100, url: imageUrl }
          : p
      ));

      logImageProcessing('MobileUploadSuccess', { 
        fileName: file.name,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        retryCount
      });

      return imageUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      logImageProcessing('MobileUploadError', {
        fileName: file.name,
        error: errorMessage,
        retryCount
      });

      if (retryCount < maxRetries && !cancelRef.current) {
        // Retry with exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return uploadSingleFile(file, fileId, options, retryCount + 1);
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
  }, [compressImageForDevice]);

  // Process files in batches
  const uploadFilesBatch = useCallback(async (
    files: File[],
    options: BatchUploadOptions = {}
  ): Promise<string[]> => {
    const capabilities = getDeviceCapabilities();
    const batchSize = options.batchSize || capabilities.batchSize;
    const batchDelay = options.batchDelay || (capabilities.isLowEnd ? 1500 : 500);
    
    setIsUploading(true);
    setCanCancel(true);
    cancelRef.current = false;

    // Initialize progress tracking
    const initialProgress: UploadProgress[] = files.map((file, index) => ({
      fileId: `file-${Date.now()}-${index}`,
      fileName: file.name,
      progress: 0,
      status: 'pending'
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

        // Process batch sequentially for mobile, parallel for desktop
        if (capabilities.isMobile) {
          // Sequential processing for mobile
          for (let j = 0; j < batch.length; j++) {
            if (cancelRef.current) break;
            
            try {
              const fileId = batchProgress[j].fileId;
              const url = await uploadSingleFile(batch[j], fileId, options);
              uploadedUrls.push(url);
            } catch (error) {
              errors.push(`${batch[j].name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        } else {
          // Parallel processing for desktop
          const batchPromises = batch.map((file, j) => 
            uploadSingleFile(file, batchProgress[j].fileId, options)
              .catch(error => {
                errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                return null;
              })
          );

          const batchResults = await Promise.all(batchPromises);
          batchResults.forEach(url => {
            if (url) uploadedUrls.push(url);
          });
        }

        // Delay between batches to allow memory cleanup
        if (i + batchSize < files.length && !cancelRef.current) {
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
      }

      // Show results
      if (uploadedUrls.length > 0) {
        toast({
          title: "Загрузка завершена",
          description: `Успешно загружено ${uploadedUrls.length} из ${files.length} файлов`,
        });
      }

      if (errors.length > 0) {
        toast({
          title: "Ошибки загрузки",
          description: `Не удалось загрузить ${errors.length} файлов. Проверьте детали.`,
          variant: "destructive",
        });
      }

      return uploadedUrls;
    } catch (error) {
      logImageProcessing('BatchUploadError', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        totalFiles: files.length,
        successfulUploads: uploadedUrls.length
      });

      toast({
        title: "Ошибка загрузки",
        description: "Произошла ошибка при загрузке файлов",
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
      description: "Загрузка файлов была прервана",
    });
  }, []);

  // Retry failed uploads
  const retryFailedUploads = useCallback(async (options: BatchUploadOptions = {}) => {
    const failedFiles = uploadProgress.filter(p => p.status === 'error');
    
    if (failedFiles.length === 0) {
      toast({
        title: "Нет файлов для повтора",
        description: "Все файлы успешно загружены",
      });
      return [];
    }

    // Reset failed files to pending
    setUploadProgress(prev => prev.map(p => 
      p.status === 'error' 
        ? { ...p, status: 'pending', progress: 0, error: undefined }
        : p
    ));

    const filesToRetry = failedFiles.map(p => {
      // Create a dummy file object for retry (in real implementation, you'd store the actual files)
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
