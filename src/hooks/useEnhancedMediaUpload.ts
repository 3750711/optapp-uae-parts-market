
import React, { useState, useCallback, useRef } from 'react';
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import imageCompression from 'browser-image-compression';

interface UploadOptions {
  orderId?: string;
  maxImageSize?: number;
  maxVideoSize?: number;
  compressionQuality?: number;
  batchSize?: number;
}

interface UploadProgress {
  id: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'compressing' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
}

export const useEnhancedMediaUpload = (options: UploadOptions = {}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [canCancel, setCanCancel] = useState(false);
  const cancelRef = useRef(false);

  const {
    maxImageSize = 10 * 1024 * 1024, // 10MB
    maxVideoSize = 20 * 1024 * 1024, // 20MB
    compressionQuality = 0.8,
    batchSize = 3
  } = options;

  // Compress image before upload
  const compressImage = useCallback(async (file: File): Promise<File> => {
    if (file.size <= 1024 * 1024) { // Skip compression for files under 1MB
      return file;
    }

    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: compressionQuality
      });
      
      console.log(`Image compressed: ${file.size} -> ${compressedFile.size} bytes`);
      return compressedFile;
    } catch (error) {
      console.error('Image compression failed:', error);
      return file; // Return original if compression fails
    }
  }, [compressionQuality]);

  // Update upload progress
  const updateProgress = useCallback((id: string, updates: Partial<UploadProgress>) => {
    setUploadProgress(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ));
  }, []);

  // Upload single file with progress
  const uploadSingleFile = useCallback(async (
    file: File, 
    type: 'image' | 'video'
  ): Promise<string | null> => {
    const progressId = `${type}-${Date.now()}-${Math.random()}`;
    
    // Add to progress tracking
    setUploadProgress(prev => [...prev, {
      id: progressId,
      fileName: file.name,
      progress: 0,
      status: 'pending'
    }]);

    try {
      // Check for cancellation
      if (cancelRef.current) {
        throw new Error('Upload cancelled');
      }

      // Validate file size
      const maxSize = type === 'image' ? maxImageSize : maxVideoSize;
      if (file.size > maxSize) {
        throw new Error(`File too large. Max size: ${Math.round(maxSize / 1024 / 1024)}MB`);
      }

      let processedFile = file;

      // Compress images
      if (type === 'image') {
        updateProgress(progressId, { status: 'compressing', progress: 10 });
        processedFile = await compressImage(file);
      }

      // Check for cancellation after compression
      if (cancelRef.current) {
        throw new Error('Upload cancelled');
      }

      updateProgress(progressId, { status: 'uploading', progress: 30 });

      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', processedFile);
      if (options.orderId) {
        formData.append('productId', options.orderId);
      }

      // Determine endpoint
      const endpoint = type === 'video' 
        ? '/functions/v1/cloudinary-video-upload'
        : '/functions/v1/cloudinary-upload';

      updateProgress(progressId, { progress: 50 });

      // Upload to Supabase Edge Function
      const { data, error } = await supabase.functions.invoke(
        type === 'video' ? 'cloudinary-video-upload' : 'cloudinary-upload',
        {
          body: formData
        }
      );

      if (error) throw error;

      updateProgress(progressId, { progress: 80 });

      if (data?.success && data?.cloudinaryUrl) {
        updateProgress(progressId, { 
          status: 'success', 
          progress: 100, 
          url: data.cloudinaryUrl 
        });
        
        return data.cloudinaryUrl;
      } else {
        throw new Error(data?.error || 'Upload failed');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateProgress(progressId, { 
        status: 'error', 
        error: errorMessage 
      });
      
      console.error(`${type} upload error:`, error);
      return null;
    }
  }, [maxImageSize, maxVideoSize, compressImage, options.orderId, updateProgress]);

  // Upload multiple files in batches
  const uploadFiles = useCallback(async (
    files: File[],
    type: 'image' | 'video'
  ): Promise<string[]> => {
    setIsUploading(true);
    setCanCancel(true);
    cancelRef.current = false;

    const uploadedUrls: string[] = [];
    
    try {
      // Process files in batches
      for (let i = 0; i < files.length; i += batchSize) {
        if (cancelRef.current) break;

        const batch = files.slice(i, i + batchSize);
        const batchPromises = batch.map(file => uploadSingleFile(file, type));
        
        const results = await Promise.allSettled(batchPromises);
        
        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            uploadedUrls.push(result.value);
          }
        });

        // Delay between batches
        if (i + batchSize < files.length && !cancelRef.current) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!cancelRef.current && uploadedUrls.length > 0) {
        toast({
          title: "Загрузка завершена",
          description: `Успешно загружено ${uploadedUrls.length} из ${files.length} файлов`,
        });
      }

      return uploadedUrls;

    } catch (error) {
      console.error('Batch upload error:', error);
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
  }, [batchSize, uploadSingleFile]);

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

  // Auto-save on connection restore
  const handleConnectionRestore = useCallback(async () => {
    if (!navigator.onLine) return;
    
    // Check for failed uploads and retry
    const failedUploads = uploadProgress.filter(p => p.status === 'error');
    if (failedUploads.length > 0) {
      toast({
        title: "Соединение восстановлено",
        description: `Повторная загрузка ${failedUploads.length} файлов...`,
      });
      // Implement retry logic here if needed
    }
  }, [uploadProgress]);

  // Listen for online/offline events
  React.useEffect(() => {
    window.addEventListener('online', handleConnectionRestore);
    return () => window.removeEventListener('online', handleConnectionRestore);
  }, [handleConnectionRestore]);

  return {
    isUploading,
    uploadProgress,
    canCancel,
    uploadFiles,
    cancelUpload,
    clearProgress,
    compressImage
  };
};
