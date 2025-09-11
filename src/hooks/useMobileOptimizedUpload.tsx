import { useState, useCallback, useRef } from 'react';
import { toast } from "@/hooks/use-toast";
import { uploadWithMultipleFallbacks } from "@/utils/uploadWithFallback";
import { offlineQueue } from "@/utils/offlineQueue";
import { trackUploadPerformance } from "@/utils/uploadMetrics";
import { validateImageForMarketplace, logImageProcessing } from "@/utils/imageProcessingUtils";

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  mainImageUrl?: string;
  publicId?: string;
  isPrimary?: boolean;
  method?: string; // Track current method being used
}

interface BatchUploadOptions {
  batchSize?: number;
  batchDelay?: number;
  maxRetries?: number;
  productId?: string;
  disableToast?: boolean;
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

  // Enhanced upload function with multiple fallbacks
  const uploadSingleFile = useCallback(async (
    file: File, 
    fileId: string, 
    options: BatchUploadOptions,
    retryCount = 0,
    isPrimary = false
  ): Promise<string> => {
    const maxRetries = options.maxRetries || 2; // Reduced retries since we have fallbacks
    
    try {
      console.log('🚀 Starting enhanced upload:', {
        fileName: file.name,
        fileId,
        productId: options.productId,
        isPrimary,
        retryCount,
        orderId: options.productId // Use productId as orderId for confirmation photos
      });

      // Start performance tracking
      trackUploadPerformance.start(file.name);

      // Update progress
      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { ...p, status: 'uploading', progress: 10, isPrimary }
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

      // Check network status
      if (!navigator.onLine) {
        console.log('📴 Offline detected - adding to queue');
        
        offlineQueue.add(file, { 
          orderId: options.productId,
          onProgress: (progress) => {
            setUploadProgress(prev => prev.map(p => 
              p.fileId === fileId ? { ...p, progress } : p
            ));
          }
        }, (success, url, error) => {
          if (success && url) {
            setUploadProgress(prev => prev.map(p => 
              p.fileId === fileId 
                ? { ...p, status: 'success', progress: 100, mainImageUrl: url, isPrimary }
                : p
            ));
            trackUploadPerformance.end(file.name, true, 'offline-queue', file.size);
          } else {
            setUploadProgress(prev => prev.map(p => 
              p.fileId === fileId 
                ? { ...p, status: 'error', error: error || 'Offline upload failed' }
                : p
            ));
            trackUploadPerformance.end(file.name, false, 'offline-queue', file.size, error);
          }
        });
        
        // Return placeholder - actual upload happens in background
        throw new Error('Added to offline queue');
      }

      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId ? { ...p, progress: 50 } : p
      ));

      // Use enhanced upload with multiple fallbacks
      console.log('☁️ Using enhanced upload with fallbacks...');
      
      const result = await uploadWithMultipleFallbacks(file, {
        orderId: options.productId, // Use productId as orderId for confirmation photos
        sessionId: `upload-${Date.now()}`, // Generate session ID for consistency
        productId: options.productId,
        onProgress: (progress, method) => {
          setUploadProgress(prev => prev.map(p => 
            p.fileId === fileId ? { 
              ...p, 
              progress: Math.min(95, 50 + (progress * 0.45)), // 50-95%
              method: method || p.method
            } : p
          ));
        }
      });

      if (!result.success || !result.url) {
        throw new Error(result.error || 'Enhanced upload failed');
      }

      console.log('✅ Enhanced upload completed:', {
        url: result.url,
        method: result.method,
        isPrimary
      });

      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId ? { ...p, progress: 90, mainImageUrl: result.url } : p
      ));

      // Final success update
      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { 
              ...p, 
              status: 'success', 
              progress: 100, 
              mainImageUrl: result.url,
              publicId: result.url, // Use URL as publicId for fallback compatibility
              isPrimary
            }
          : p
      ));

      trackUploadPerformance.end(file.name, true, result.method || 'unknown', file.size);

      logImageProcessing('EnhancedUploadSuccess', { 
        fileName: file.name,
        originalSize: file.size,
        url: result.url,
        method: result.method,
        retryCount,
        productId: options.productId,
        isPrimary
      });

      return result.url;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      console.error('💥 Enhanced upload error:', {
        fileName: file.name,
        error: errorMessage,
        retryCount,
        productId: options.productId,
        fileId,
        isPrimary
      });

      trackUploadPerformance.end(file.name, false, 'error', file.size, errorMessage);

      logImageProcessing('EnhancedUploadError', {
        fileName: file.name,
        error: errorMessage,
        retryCount,
        productId: options.productId,
        isPrimary
      });

      if (retryCount < maxRetries && !cancelRef.current && navigator.onLine) {
        // Retry with exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`🔄 Retrying enhanced upload in ${delay}ms...`);
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
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      if (!options.disableToast) {
        toast({
          title: "Нет подключения к сети",
          description: "Проверьте ваше интернет-соединение и попробуйте снова.",
          variant: "destructive",
        });
      }
      return [];
    }

    const batchSize = options.batchSize || 2;
    const batchDelay = options.batchDelay || 1000;
    
    console.log('📦 STARTING CLOUDINARY BATCH UPLOAD:', {
      fileCount: files.length,
      productId: options.productId,
      batchSize
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

        // Delay between batches
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

      if (!options.disableToast) {
        if (uploadedUrls.length > 0) {
          toast({
            title: "Загрузка завершена",
            description: `Успешно загружено ${uploadedUrls.length} из ${files.length} файлов.`,
          });
        }
  
        if (errors.length > 0) {
          toast({
            title: "Ошибки загрузки",
            description: `Не удалось загрузить ${errors.length} файлов.`,
            variant: "destructive",
          });
        }
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

      if (!options.disableToast) {
        toast({
          title: "Ошибка загрузки",
          description: "Произошла ошибка при загрузке файлов",
          variant: "destructive",
        });
      }

      return uploadedUrls;
    } finally {
      setIsUploading(false);
      setCanCancel(false);
    }
  }, [uploadSingleFile]);

  // Cancel upload
  const cancelUpload = useCallback(() => {
    cancelRef.current = true;
    setCanCancel(false);
    
    toast({
      title: "Загрузка отменена",
      description: "Загрузка файлов была прервана",
    });
  }, []);

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
    clearProgress,
    isMobileDevice: isMobileDevice()
  };
};
