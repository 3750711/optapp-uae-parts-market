
import { useState, useCallback, useRef, useEffect } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { useAsyncImageCompression } from './useAsyncImageCompression';
import { useUploadAbortController } from './useUploadAbortController';
import { useUnifiedUploadErrorHandler } from './useUnifiedUploadErrorHandler';

interface UploadItem {
  id: string;
  file: File;
  compressedFile?: File;
  progress: number;
  status: 'pending' | 'compressing' | 'uploading' | 'success' | 'error' | 'deleted';
  error?: string;
  blobUrl?: string;
  finalUrl?: string;
  originalSize: number;
  compressedSize?: number;
}

interface OptimizedUploadOptions {
  maxConcurrent?: number;
  productId?: string;
  disableToast?: boolean;
  compressionOptions?: {
    maxSizeMB: number;
    maxWidthOrHeight: number;
    initialQuality: number;
    fileType: string;
  };
}

// Константы для условного сжатия
const COMPRESSION_THRESHOLD = 400 * 1024; // 400KB
const SIZE_THRESHOLDS = {
  SMALL: 400 * 1024,     // 400KB
  MEDIUM: 2 * 1024 * 1024, // 2MB
  LARGE: 10 * 1024 * 1024  // 10MB
};

export const useOptimizedImageUpload = () => {
  const { toast } = useToast();
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const activeUploadRef = useRef<Promise<string[]> | null>(null);
  
  // Use new unified systems
  const { compressFiles, abortAll: abortCompression } = useAsyncImageCompression();
  const { 
    getSignal, 
    abort: abortController,
    isAborted,
    createController 
  } = useUploadAbortController({
    onAbort: () => {
      logger.log('🛑 Upload aborted via AbortController');
      abortCompression();
    }
  });
  const { handleError, handleMultipleErrors } = useUnifiedUploadErrorHandler();

  // Smart compression options based on file size
  const getSmartCompressionOptions = useCallback((fileSize: number) => {
    // Small files - no compression
    if (fileSize < SIZE_THRESHOLDS.SMALL) {
      return null;
    }
    
    // Medium files - light compression  
    if (fileSize < SIZE_THRESHOLDS.MEDIUM) {
      return {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1920,
        initialQuality: 0.9,
        fileType: 'image/webp'
      };
    }
    
    // Large files - medium compression
    if (fileSize < SIZE_THRESHOLDS.LARGE) {
      return {
        maxSizeMB: 1,
        maxWidthOrHeight: 1600,
        initialQuality: 0.8,
        fileType: 'image/webp'
      };
    }
    
    // Very large files - aggressive compression
    return {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      initialQuality: 0.6,
      fileType: 'image/webp'
    };
  }, []);

  // Mark item as deleted by URL
  const markAsDeleted = useCallback((url: string) => {
    logger.log('🗑️ Marking as deleted in upload queue:', url);
    unstable_batchedUpdates(() => {
      setUploadQueue(prev => 
        prev.map(item => 
          item.finalUrl === url || item.blobUrl === url
            ? { ...item, status: 'deleted' as const }
            : item
        )
      );
    });
  }, []);

  // Auto-cleanup for successfully uploaded items
  const cleanupSuccessfulItems = useCallback(() => {
    setUploadQueue(prev => {
      const now = Date.now();
      return prev.filter(item => {
        if (item.status !== 'success') return true;
        
        const itemTimestamp = parseInt(item.id.split('-')[1]) || now;
        const isRecent = (now - itemTimestamp) < 30000; // 30 seconds
        
        if (!isRecent && item.blobUrl) {
          URL.revokeObjectURL(item.blobUrl);
        }
        
        return isRecent;
      });
    });
  }, []);

  // Create blob URL for immediate preview
  const createBlobUrl = useCallback((file: File): string => {
    return URL.createObjectURL(file);
  }, []);

  // Remove old compression function - now handled by Web Worker

  // Upload single file with retry logic
  const uploadSingleFile = useCallback(async (
    item: UploadItem,
    options: OptimizedUploadOptions,
    retryCount = 0
  ): Promise<string> => {
    const maxRetries = 3;
    const retryDelay = Math.pow(2, retryCount) * 1000;

    try {
      unstable_batchedUpdates(() => {
        setUploadQueue(prev => 
          prev.map(i => 
            i.id === item.id 
              ? { ...i, status: 'uploading', progress: 10 }
              : i
          )
        );
      });

      const formData = new FormData();
      formData.append('file', item.compressedFile || item.file);
      formData.append('productId', options.productId || '');
      
      const uploadResponse = await supabase.functions.invoke('cloudinary-upload', {
        body: formData,
        signal: getSignal()
      });

      if (uploadResponse.error) {
        throw new Error(uploadResponse.error.message);
      }

      const result = uploadResponse.data;
      
      if (!result.success || !result.mainImageUrl) {
        throw new Error(result.error || 'Upload failed');
      }

      unstable_batchedUpdates(() => {
        setUploadQueue(prev => 
          prev.map(i => 
            i.id === item.id 
              ? { 
                  ...i, 
                  status: 'success', 
                  progress: 100,
                  finalUrl: result.mainImageUrl
                }
              : i
          )
        );
      });

      if (item.blobUrl) {
        URL.revokeObjectURL(item.blobUrl);
      }

      return result.mainImageUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      if (retryCount < maxRetries) {
        logger.log(`🔄 Retrying upload for ${item.file.name} (attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return uploadSingleFile(item, options, retryCount + 1);
      } else {
        unstable_batchedUpdates(() => {
          setUploadQueue(prev => 
            prev.map(i => 
              i.id === item.id 
                ? { ...i, status: 'error', error: errorMessage }
                : i
            )
          );
        });
        throw error;
      }
    }
  }, []);

  // Process files in parallel for better performance
  const processUploads = useCallback(async (
    items: UploadItem[],
    options: OptimizedUploadOptions
  ): Promise<string[]> => {
    logger.devLog(`🚀 Starting parallel upload of ${items.length} files`);
    
    // Check for abort before processing
    if (isAborted()) {
      throw new DOMException('Upload cancelled', 'AbortError');
    }
    
    // Use Promise.allSettled for parallel uploads with error handling
    const uploadPromises = items.map(async (item) => {
      if (isAborted()) {
        throw new DOMException('Upload cancelled', 'AbortError');
      }
      
      try {
        const url = await uploadSingleFile(item, options);
        return { success: true, url, item };
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error', 
          item 
        };
      }
    });

    const results = await Promise.allSettled(uploadPromises);
    
    const successfulUploads: string[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        successfulUploads.push(result.value.url);
      } else {
        const item = items[index];
        const errorMsg = result.status === 'rejected' 
          ? `${item.file.name}: ${result.reason}` 
          : `${result.value.item.file.name}: ${result.value.error}`;
        errors.push(errorMsg);
      }
    });

    if (!options.disableToast && (successfulUploads.length > 0 || errors.length > 0)) {
      // Use unified error handler for better UX
      const errorDetails = errors.map((error, index) => ({
        error: new Error(error),
        fileName: items[results.findIndex((r, i) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)) + index]?.file.name,
        context: 'upload'
      }));
      
      if (errorDetails.length > 0) {
        handleMultipleErrors(errorDetails, successfulUploads.length);
      } else if (successfulUploads.length > 0) {
        toast({
          title: "Загрузка завершена",
          description: `Успешно загружено ${successfulUploads.length} файлов`,
        });
      }
    }

    logger.devLog(`✅ Parallel upload completed: ${successfulUploads.length} success, ${errors.length} errors`);
    return successfulUploads;
  }, [uploadSingleFile, toast]);

  // Main upload function with smart compression
  const uploadFiles = useCallback(async (
    files: File[],
    options: OptimizedUploadOptions = {}
  ): Promise<string[]> => {
    // Race condition protection: wait for previous upload to complete
    if (activeUploadRef.current) {
      logger.log('⏳ Previous upload in progress, queuing new request...');
      try {
        await activeUploadRef.current;
      } catch (error) {
        logger.log('Previous upload failed or was cancelled, proceeding with new upload');
      }
    }
    
    setIsUploading(true);
    createController(); // Create new controller for this upload batch
    
    const uploadPromise = (async (): Promise<string[]> => {

    const initialQueue: UploadItem[] = files.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      file,
      progress: 0,
      status: 'pending',
      blobUrl: createBlobUrl(file),
      originalSize: file.size
    }));

    unstable_batchedUpdates(() => {
      setUploadQueue(prev => [...prev, ...initialQueue]);
    });

      try {
        // Step 1: Async compression using Web Worker
        logger.log(`🔧 Starting async compression for ${files.length} files`);
        
        const filesToCompress = initialQueue.filter(item => 
          item.file.size >= COMPRESSION_THRESHOLD
        );
        const filesWithoutCompression = initialQueue.filter(item => 
          item.file.size < COMPRESSION_THRESHOLD
        );
        
        // Update status for files that don't need compression
        if (filesWithoutCompression.length > 0) {
          unstable_batchedUpdates(() => {
            setUploadQueue(prev => 
              prev.map(i => 
                filesWithoutCompression.find(f => f.id === i.id)
                  ? { 
                      ...i, 
                      compressedFile: i.file,
                      compressedSize: i.file.size,
                      status: 'pending'
                    }
                  : i
              )
            );
          });
        }
        
        // Compress files that need it using Web Worker
        let compressedItems: UploadItem[] = [];
        if (filesToCompress.length > 0) {
          // Set compression status
          unstable_batchedUpdates(() => {
            setUploadQueue(prev => 
              prev.map(i => 
                filesToCompress.find(f => f.id === i.id)
                  ? { ...i, status: 'compressing', progress: 5 }
                  : i
              )
            );
          });
          
          // Perform async compression
          const compressionResults = await compressFiles(
            filesToCompress.map(item => item.file),
            options.compressionOptions || {},
            (completedCount, totalCount, currentFile) => {
              logger.log(`Compression progress: ${completedCount}/${totalCount} - ${currentFile}`);
              
              // Update progress for completed file
              if (currentFile) {
                const item = filesToCompress.find(i => i.file.name === currentFile);
                if (item) {
                  unstable_batchedUpdates(() => {
                    setUploadQueue(prev => 
                      prev.map(i => 
                        i.id === item.id
                          ? { ...i, status: 'pending', progress: 0 }
                          : i
                      )
                    );
                  });
                }
              }
            },
            2 // Max concurrent compressions
          );
          
          // Map compression results back to upload items
          compressedItems = filesToCompress.map((item, index) => {
            const result = compressionResults[index];
            return {
              ...item,
              compressedFile: result.compressedFile,
              compressedSize: result.compressedSize
            };
          });
          
          // Update queue with compressed files
          unstable_batchedUpdates(() => {
            setUploadQueue(prev => 
              prev.map(i => {
                const compressedItem = compressedItems.find(c => c.id === i.id);
                return compressedItem ? {
                  ...i,
                  compressedFile: compressedItem.compressedFile,
                  compressedSize: compressedItem.compressedSize,
                  status: 'pending',
                  progress: 0
                } : i;
              })
            );
          });
        }
        
        // Combine all items for upload
        const allProcessedItems = [...filesWithoutCompression, ...compressedItems];
        
        // Step 2: Upload processed files
        const uploadedUrls = await processUploads(allProcessedItems, options);
        
        // Step 3: Schedule cleanup
        setTimeout(cleanupSuccessfulItems, 30000);
        
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          logger.log('✋ Upload cancelled by user navigation');
          if (!options.disableToast) {
            toast({
              title: "Загрузка отменена",
              description: "Вы перешли на другую страницу",
            });
          }
          return [];
        }
        
        // Use unified error handler
        handleError(error, undefined, 'upload process');
        return [];
      } finally {
        setIsUploading(false);
        activeUploadRef.current = null;
      }
    })();

    activeUploadRef.current = uploadPromise;
    return uploadPromise;
  }, [createController, compressFiles, processUploads, cleanupSuccessfulItems, handleError, handleMultipleErrors, toast, getSignal, isAborted]);

  // Critical: Cleanup on component unmount (navigation)
  useEffect(() => {
    return () => {
      logger.log('🛑 Component unmounting - cancelling active uploads');
      abortController();
      abortCompression();
      
      // Clean blob URLs to prevent memory leaks
      uploadQueue.forEach(item => {
        if (item.blobUrl) {
          URL.revokeObjectURL(item.blobUrl);
        }
      });
    };
  }, []); // Empty dependency array - only on mount/unmount

  // Cancel uploads
  const cancelUpload = useCallback(() => {
    abortController();
    abortCompression();
    setIsUploading(false);
    activeUploadRef.current = null;
    
    uploadQueue.forEach(item => {
      if (item.blobUrl) {
        URL.revokeObjectURL(item.blobUrl);
      }
    });
    
    setUploadQueue([]);
    
    toast({
      title: "Загрузка отменена",
      description: "Загрузка файлов была прервана",
    });
  }, [uploadQueue, toast]);

  // Get preview URLs
  const getPreviewUrls = useCallback(() => {
    return uploadQueue
      .filter(item => item.finalUrl || item.blobUrl)
      .map(item => item.finalUrl || item.blobUrl!);
  }, [uploadQueue]);

  // Clear queue
  const clearQueue = useCallback(() => {
    uploadQueue.forEach(item => {
      if (item.blobUrl) {
        URL.revokeObjectURL(item.blobUrl);
      }
    });
    setUploadQueue([]);
  }, [uploadQueue]);

  return {
    uploadFiles,
    uploadQueue,
    isUploading,
    getPreviewUrls,
    cancelUpload,
    clearQueue,
    markAsDeleted,
    cleanupSuccessfulItems
  };
};
