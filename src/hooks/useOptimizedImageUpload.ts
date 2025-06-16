
import { useState, useCallback, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadItem {
  id: string;
  file: File;
  compressedFile?: File;
  progress: number;
  status: 'pending' | 'compressing' | 'uploading' | 'success' | 'error';
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
    quality: number;
    fileType?: string;
  };
}

export const useOptimizedImageUpload = () => {
  const { toast } = useToast();
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const abortController = useRef<AbortController | null>(null);

  const defaultCompressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1024,
    quality: 0.85,
    fileType: 'image/webp'
  };

  // Create blob URL for immediate preview
  const createBlobUrl = useCallback((file: File): string => {
    return URL.createObjectURL(file);
  }, []);

  // Compress image on client side
  const compressImage = useCallback(async (
    file: File, 
    options = defaultCompressionOptions
  ): Promise<File> => {
    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: options.maxSizeMB,
        maxWidthOrHeight: options.maxWidthOrHeight,
        quality: options.quality,
        fileType: options.fileType,
        useWebWorker: true,
        preserveExif: false
      });
      
      console.log(`📦 Compressed ${file.name}:`, {
        originalSize: file.size,
        compressedSize: compressedFile.size,
        ratio: Math.round((1 - compressedFile.size / file.size) * 100) + '%'
      });
      
      return compressedFile;
    } catch (error) {
      console.warn('Compression failed, using original file:', error);
      return file;
    }
  }, []);

  // Upload single file with retry logic
  const uploadSingleFile = useCallback(async (
    item: UploadItem,
    options: OptimizedUploadOptions,
    retryCount = 0
  ): Promise<string> => {
    const maxRetries = 3;
    const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff

    try {
      // Update status to uploading
      setUploadQueue(prev => 
        prev.map(i => 
          i.id === item.id 
            ? { ...i, status: 'uploading', progress: 10 }
            : i
        )
      );

      // Create FormData for direct file upload
      const formData = new FormData();
      formData.append('file', item.compressedFile || item.file);
      formData.append('productId', options.productId || '');
      
      // Upload with streaming support
      const uploadResponse = await supabase.functions.invoke('cloudinary-upload', {
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (uploadResponse.error) {
        throw new Error(uploadResponse.error.message);
      }

      const result = uploadResponse.data;
      
      if (!result.success || !result.mainImageUrl) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update progress to complete
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

      // Clean up blob URL
      if (item.blobUrl) {
        URL.revokeObjectURL(item.blobUrl);
      }

      return result.mainImageUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying upload for ${item.file.name} (attempt ${retryCount + 1}/${maxRetries})`);
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

  // Process files with parallel uploads
  const processUploads = useCallback(async (
    items: UploadItem[],
    options: OptimizedUploadOptions
  ): Promise<string[]> => {
    const maxConcurrent = options.maxConcurrent || 3;
    const results: string[] = [];
    const errors: string[] = [];

    // Process in batches of maxConcurrent
    for (let i = 0; i < items.length; i += maxConcurrent) {
      if (abortController.current?.signal.aborted) break;

      const batch = items.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (item) => {
        try {
          const url = await uploadSingleFile(item, options);
          results.push(url);
          return url;
        } catch (error) {
          const errorMsg = `${item.file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          return null;
        }
      });

      await Promise.allSettled(batchPromises);
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

  // Main upload function
  const uploadFiles = useCallback(async (
    files: File[],
    options: OptimizedUploadOptions = {}
  ): Promise<string[]> => {
    setIsUploading(true);
    abortController.current = new AbortController();

    // Create initial queue with blob URLs for immediate preview
    const initialQueue: UploadItem[] = files.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      file,
      progress: 0,
      status: 'pending',
      blobUrl: createBlobUrl(file),
      originalSize: file.size
    }));

    setUploadQueue(initialQueue);

    try {
      // Step 1: Compress all images in parallel
      const compressionPromises = initialQueue.map(async (item) => {
        setUploadQueue(prev => 
          prev.map(i => 
            i.id === item.id 
              ? { ...i, status: 'compressing', progress: 5 }
              : i
          )
        );

        const compressedFile = await compressImage(
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

      // Step 2: Upload compressed files in parallel
      const uploadedUrls = await processUploads(compressedItems, options);

      return uploadedUrls;
    } catch (error) {
      console.error('Upload process failed:', error);
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
  }, [createBlobUrl, compressImage, processUploads, toast]);

  // Cancel uploads
  const cancelUpload = useCallback(() => {
    abortController.current?.abort();
    setIsUploading(false);
    
    // Clean up blob URLs
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

  // Get preview URLs (mix of blob URLs and final URLs)
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
    clearQueue
  };
};
