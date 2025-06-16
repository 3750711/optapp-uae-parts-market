
import { useState, useCallback, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrderUploadItem {
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

interface OrderMediaUploadOptions {
  maxConcurrent?: number;
  orderId?: string;
  disableToast?: boolean;
  compressionOptions?: {
    maxSizeMB: number;
    maxWidthOrHeight: number;
    initialQuality: number;
    fileType: string;
  };
}

export const useOptimizedOrderMediaUpload = () => {
  const { toast } = useToast();
  const [uploadQueue, setUploadQueue] = useState<OrderUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const abortController = useRef<AbortController | null>(null);

  const defaultCompressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1024,
    initialQuality: 0.85,
    fileType: 'image/webp'
  };

  // Mark item as deleted by URL
  const markAsDeleted = useCallback((url: string) => {
    console.log('🗑️ Marking as deleted in order upload queue:', url);
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

  // Compress image on client side
  const compressImage = useCallback(async (
    file: File, 
    options = defaultCompressionOptions
  ): Promise<File> => {
    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: options.maxSizeMB,
        maxWidthOrHeight: options.maxWidthOrHeight,
        initialQuality: options.initialQuality,
        fileType: options.fileType,
        useWebWorker: true,
        preserveExif: false
      });
      
      console.log(`📦 Compressed order image ${file.name}:`, {
        originalSize: file.size,
        compressedSize: compressedFile.size,
        ratio: Math.round((1 - compressedFile.size / file.size) * 100) + '%'
      });
      
      return compressedFile;
    } catch (error) {
      console.warn('Compression failed for order image, using original file:', error);
      return file;
    }
  }, []);

  // Upload single file with improved error handling
  const uploadSingleFile = useCallback(async (
    item: OrderUploadItem,
    options: OrderMediaUploadOptions,
    retryCount = 0
  ): Promise<string> => {
    const maxRetries = 2;
    const retryDelay = Math.pow(2, retryCount) * 1000;

    try {
      setUploadQueue(prev => 
        prev.map(i => 
          i.id === item.id 
            ? { ...i, status: 'uploading', progress: 10 }
            : i
        )
      );

      const fileToUpload = item.compressedFile || item.file;
      
      // Validate file before upload
      if (fileToUpload.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Файл слишком большой (максимум 10MB)');
      }

      // Create FormData with proper file handling
      const formData = new FormData();
      formData.append('file', fileToUpload, fileToUpload.name);
      
      console.log('📤 Uploading order file:', {
        name: fileToUpload.name,
        size: fileToUpload.size,
        type: fileToUpload.type
      });

      // Call Edge Function with error handling
      const { data: result, error } = await supabase.functions.invoke('cloudinary-upload', {
        body: formData,
      });

      if (error) {
        console.error('❌ Edge Function error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      if (!result || !result.success) {
        console.error('❌ Upload result error:', result);
        throw new Error(result?.error || 'Upload failed - no result');
      }

      if (!result.cloudinaryUrl) {
        console.error('❌ No URL in result:', result);
        throw new Error('Upload failed - no URL returned');
      }

      console.log('✅ Upload successful:', result.cloudinaryUrl);

      // Update progress to complete
      setUploadQueue(prev => 
        prev.map(i => 
          i.id === item.id 
            ? { 
                ...i, 
                status: 'success', 
                progress: 100,
                finalUrl: result.cloudinaryUrl
              }
            : i
        )
      );

      // Clean up blob URL
      if (item.blobUrl) {
        URL.revokeObjectURL(item.blobUrl);
      }

      return result.cloudinaryUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
      console.error('💥 Upload error:', errorMessage);
      
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying order upload for ${item.file.name} (attempt ${retryCount + 1}/${maxRetries})`);
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

  // Process uploads sequentially with delays
  const processUploads = useCallback(async (
    items: OrderUploadItem[],
    options: OrderMediaUploadOptions
  ): Promise<string[]> => {
    const batchDelay = 1000; // 1 second delay between uploads
    const results: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      if (abortController.current?.signal.aborted) break;

      const item = items[i];
      
      try {
        const url = await uploadSingleFile(item, options);
        results.push(url);
        
        // Add delay between uploads if not the last item
        if (i < items.length - 1) {
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
      } catch (error) {
        const errorMsg = `${item.file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error('💥 Upload failed for item:', errorMsg);
      }
    }

    if (!options.disableToast) {
      if (results.length > 0) {
        toast({
          title: "Загрузка медиа завершена",
          description: `Успешно загружено ${results.length} из ${items.length} файлов`,
        });
      }
      
      if (errors.length > 0) {
        toast({
          title: "Ошибки загрузки медиа",
          description: `Не удалось загрузить ${errors.length} файлов`,
          variant: "destructive",
        });
      }
    }

    return results;
  }, [uploadSingleFile, toast]);

  // Main upload function for orders
  const uploadOrderFiles = useCallback(async (
    files: File[],
    options: OrderMediaUploadOptions = {}
  ): Promise<string[]> => {
    if (files.length === 0) {
      console.warn('⚠️ No files provided for upload');
      return [];
    }

    console.log('🚀 Starting order files upload:', { count: files.length });
    
    setIsUploading(true);
    abortController.current = new AbortController();

    // Validate files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        console.warn('⚠️ Skipping non-image file:', file.name);
        return false;
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB
        console.warn('⚠️ Skipping oversized file:', file.name);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      setIsUploading(false);
      toast({
        title: "Ошибка файлов",
        description: "Нет валидных изображений для загрузки",
        variant: "destructive",
      });
      return [];
    }

    // Create initial queue with blob URLs for immediate preview
    const initialQueue: OrderUploadItem[] = validFiles.map((file, index) => ({
      id: `order-upload-${Date.now()}-${index}`,
      file,
      progress: 0,
      status: 'pending',
      blobUrl: createBlobUrl(file),
      originalSize: file.size
    }));

    setUploadQueue(prev => [...prev, ...initialQueue]);

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

        const compressionOptions = {
          maxSizeMB: options.compressionOptions?.maxSizeMB || defaultCompressionOptions.maxSizeMB,
          maxWidthOrHeight: options.compressionOptions?.maxWidthOrHeight || defaultCompressionOptions.maxWidthOrHeight,
          initialQuality: options.compressionOptions?.initialQuality || defaultCompressionOptions.initialQuality,
          fileType: options.compressionOptions?.fileType || defaultCompressionOptions.fileType
        };

        const compressedFile = await compressImage(item.file, compressionOptions);

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
      console.log('✅ Compression completed for all items');

      // Step 2: Upload compressed files sequentially
      const uploadedUrls = await processUploads(compressedItems, options);

      // Step 3: Schedule cleanup after successful upload
      setTimeout(cleanupSuccessfulItems, 30000);

      console.log('✅ Upload process completed:', { uploaded: uploadedUrls.length, total: files.length });
      return uploadedUrls;
    } catch (error) {
      console.error('💥 Order upload process failed:', error);
      if (!options.disableToast) {
        toast({
          title: "Ошибка загрузки медиа",
          description: "Произошла ошибка при загрузке файлов заказа",
          variant: "destructive",
        });
      }
      return [];
    } finally {
      setIsUploading(false);
    }
  }, [createBlobUrl, compressImage, processUploads, cleanupSuccessfulItems, toast]);

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
      description: "Загрузка файлов заказа была прервана",
    });
  }, [uploadQueue, toast]);

  // Get preview URLs (mix of blob URLs and final URLs)
  const getPreviewUrls = useCallback(() => {
    return uploadQueue
      .filter(item => item.status !== 'deleted' && (item.finalUrl || item.blobUrl))
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
    uploadOrderFiles,
    uploadQueue,
    isUploading,
    getPreviewUrls,
    cancelUpload,
    clearQueue,
    markAsDeleted,
    cleanupSuccessfulItems
  };
};
