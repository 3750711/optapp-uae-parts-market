
import { useState, useCallback, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

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
  const abortController = useRef<AbortController | null>(null);

  // Умное сжатие в зависимости от размера файла
  const getSmartCompressionOptions = useCallback((fileSize: number) => {
    // Файлы меньше 400KB не сжимаем
    if (fileSize < SIZE_THRESHOLDS.SMALL) {
      return null; // Не сжимать
    }
    
    // Файлы 400KB-2MB - легкое сжатие
    if (fileSize < SIZE_THRESHOLDS.MEDIUM) {
      return {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1920,
        initialQuality: 0.9,
        fileType: 'image/webp'
      };
    }
    
    // Файлы 2MB-10MB - среднее сжатие
    if (fileSize < SIZE_THRESHOLDS.LARGE) {
      return {
        maxSizeMB: 1,
        maxWidthOrHeight: 1600,
        initialQuality: 0.8,
        fileType: 'image/webp'
      };
    }
    
    // Файлы больше 10MB - агрессивное сжатие
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
    setUploadQueue(prev => 
      prev.map(item => 
        item.finalUrl === url || item.blobUrl === url
          ? { ...item, status: 'deleted' as const }
          : item
      )
    );
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

  // Условное сжатие изображения
  const conditionalCompressImage = useCallback(async (
    file: File, 
    compressionOptions?: any
  ): Promise<File> => {
    const smartOptions = getSmartCompressionOptions(file.size);
    
    // Если файл маленький, не сжимаем
    if (!smartOptions) {
      logger.log(`📦 Skipping compression for small file ${file.name} (${file.size} bytes)`);
      return file;
    }
    
    // Используем переданные опции или умные опции
    const options = compressionOptions || smartOptions;
    
    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: options.maxSizeMB,
        maxWidthOrHeight: options.maxWidthOrHeight,
        initialQuality: options.initialQuality,
        fileType: options.fileType,
        useWebWorker: true,
        preserveExif: false
      });
      
      logger.log(`📦 Compressed ${file.name}:`, {
        originalSize: file.size,
        compressedSize: compressedFile.size,
        ratio: Math.round((1 - compressedFile.size / file.size) * 100) + '%',
        compressionApplied: true
      });
      
      return compressedFile;
    } catch (error) {
      logger.warn('Compression failed, using original file:', error);
      return file;
    }
  }, [getSmartCompressionOptions]);

  // Upload single file with retry logic
  const uploadSingleFile = useCallback(async (
    item: UploadItem,
    options: OptimizedUploadOptions,
    retryCount = 0
  ): Promise<string> => {
    const maxRetries = 3;
    const retryDelay = Math.pow(2, retryCount) * 1000;

    try {
      setUploadQueue(prev => 
        prev.map(i => 
          i.id === item.id 
            ? { ...i, status: 'uploading', progress: 10 }
            : i
        )
      );

      const formData = new FormData();
      formData.append('file', item.compressedFile || item.file);
      formData.append('productId', options.productId || '');
      
      const uploadResponse = await supabase.functions.invoke('cloudinary-upload', {
        body: formData,
      });

      if (uploadResponse.error) {
        throw new Error(uploadResponse.error.message);
      }

      const result = uploadResponse.data;
      
      if (!result.success || !result.mainImageUrl) {
        throw new Error(result.error || 'Upload failed');
      }

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
        setUploadQueue(prev => 
          prev.map(i => 
            i.id === item.id 
              ? { ...i, status: 'error', error: errorMessage }
              : i
          )
        );
        throw error;
      }
    }
  }, []);

  // Process files sequentially with delays
  const processUploads = useCallback(async (
    items: UploadItem[],
    options: OptimizedUploadOptions
  ): Promise<string[]> => {
    const batchDelay = 500;
    const results: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      if (abortController.current?.signal.aborted) break;

      const item = items[i];
      
      try {
        const url = await uploadSingleFile(item, options);
        results.push(url);
        
        if (i < items.length - 1) {
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
      } catch (error) {
        const errorMsg = `${item.file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
      }
    }

    if (!options.disableToast) {
      if (results.length > 0) {
        toast({
          title: "Загрузка завершена",
          description: `Успешно загружено ${results.length} из ${items.length} файлов`,
        });
      }
      
      if (errors.length > 0) {
        toast({
          title: "Ошибки загрузки",
          description: `Не удалось загрузить ${errors.length} файлов`,
          variant: "destructive",
        });
      }
    }

    return results;
  }, [uploadSingleFile, toast]);

  // Main upload function with smart compression
  const uploadFiles = useCallback(async (
    files: File[],
    options: OptimizedUploadOptions = {}
  ): Promise<string[]> => {
    setIsUploading(true);
    abortController.current = new AbortController();

    const initialQueue: UploadItem[] = files.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      file,
      progress: 0,
      status: 'pending',
      blobUrl: createBlobUrl(file),
      originalSize: file.size
    }));

    setUploadQueue(prev => [...prev, ...initialQueue]);

    try {
      // Step 1: Условное сжатие изображений
      const compressionPromises = initialQueue.map(async (item) => {
        // Проверяем, нужно ли сжимать файл
        const shouldCompress = item.file.size >= COMPRESSION_THRESHOLD;
        
        if (!shouldCompress) {
          logger.log(`⚡ Skipping compression for ${item.file.name} (${item.file.size} bytes < ${COMPRESSION_THRESHOLD} bytes)`);
          setUploadQueue(prev => 
            prev.map(i => 
              i.id === item.id 
                ? { 
                    ...i, 
                    compressedFile: item.file, // Используем оригинал
                    compressedSize: item.file.size,
                    status: 'pending',
                    progress: 0
                  }
                : i
            )
          );
          return { ...item, compressedFile: item.file, compressedSize: item.file.size };
        }

        setUploadQueue(prev => 
          prev.map(i => 
            i.id === item.id 
              ? { ...i, status: 'compressing', progress: 5 }
              : i
          )
        );

        const compressedFile = await conditionalCompressImage(
          item.file, 
          options.compressionOptions
        );

        setUploadQueue(prev => 
          prev.map(i => 
            i.id === item.id 
              ? { 
                  ...i, 
                  compressedFile,
                  compressedSize: compressedFile.size,
                  status: 'pending',
                  progress: 0
                }
              : i
          )
        );

        return { ...item, compressedFile, compressedSize: compressedFile.size };
      });

      const compressedItems = await Promise.all(compressionPromises);

      // Step 2: Upload compressed/original files
      const uploadedUrls = await processUploads(compressedItems, options);

      // Step 3: Schedule cleanup
      setTimeout(cleanupSuccessfulItems, 30000);

      return uploadedUrls;
    } catch (error) {
      logger.error('Upload process failed:', error);
      if (!options.disableToast) {
        toast({
          title: "Ошибка загрузки",
          description: "Произошла ошибка при загрузке файлов",
          variant: "destructive",
        });
      }
      return [];
    } finally {
      setIsUploading(false);
    }
  }, [createBlobUrl, conditionalCompressImage, processUploads, cleanupSuccessfulItems, toast]);

  // Cancel uploads
  const cancelUpload = useCallback(() => {
    abortController.current?.abort();
    setIsUploading(false);
    
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
