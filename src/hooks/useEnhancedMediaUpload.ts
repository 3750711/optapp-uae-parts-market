
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
    console.log('🗜️ Starting image compression for:', file.name, 'Size:', file.size);
    
    if (file.size <= 1024 * 1024) { // Skip compression for files under 1MB
      console.log('📁 File is small, skipping compression');
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
      
      console.log(`✅ Image compressed successfully: ${file.size} -> ${compressedFile.size} bytes`);
      return compressedFile;
    } catch (error) {
      console.error('❌ Image compression failed:', error);
      return file; // Return original if compression fails
    }
  }, [compressionQuality]);

  // Update upload progress
  const updateProgress = useCallback((id: string, updates: Partial<UploadProgress>) => {
    console.log('📊 Updating progress for:', id, updates);
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
    
    console.log('🚀 Starting single file upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadType: type,
      progressId
    });

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
        console.log('❌ Upload cancelled by user');
        throw new Error('Upload cancelled');
      }

      // Validate file size
      const maxSize = type === 'image' ? maxImageSize : maxVideoSize;
      if (file.size > maxSize) {
        const errorMsg = `File too large. Max size: ${Math.round(maxSize / 1024 / 1024)}MB`;
        console.error('❌ File size validation failed:', errorMsg);
        throw new Error(errorMsg);
      }

      let processedFile = file;

      // Compress images
      if (type === 'image') {
        updateProgress(progressId, { status: 'compressing', progress: 10 });
        processedFile = await compressImage(file);
        console.log('✅ Image compression completed');
      }

      // Check for cancellation after compression
      if (cancelRef.current) {
        console.log('❌ Upload cancelled after compression');
        throw new Error('Upload cancelled');
      }

      updateProgress(progressId, { status: 'uploading', progress: 30 });

      console.log('📤 Preparing FormData for upload to Supabase Edge Function');

      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', processedFile);
      if (options.orderId) {
        formData.append('productId', options.orderId);
        console.log('📎 Added productId to FormData:', options.orderId);
      }

      // Log FormData contents (for debugging)
      console.log('📋 FormData prepared with entries:');
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      updateProgress(progressId, { progress: 50 });

      console.log('☁️ Calling Supabase Edge Function...');
      
      // Upload to Supabase Edge Function
      const { data, error } = await supabase.functions.invoke(
        type === 'video' ? 'cloudinary-video-upload' : 'cloudinary-upload',
        {
          body: formData
        }
      );

      console.log('📥 Supabase Edge Function response:', {
        data,
        error,
        functionName: type === 'video' ? 'cloudinary-video-upload' : 'cloudinary-upload'
      });

      if (error) {
        console.error('❌ Supabase Edge Function error:', error);
        throw error;
      }

      updateProgress(progressId, { progress: 80 });

      if (data?.success && data?.cloudinaryUrl) {
        console.log('✅ Upload successful! Cloudinary URL:', data.cloudinaryUrl);
        updateProgress(progressId, { 
          status: 'success', 
          progress: 100, 
          url: data.cloudinaryUrl 
        });
        
        return data.cloudinaryUrl;
      } else {
        const errorMsg = data?.error || 'Upload failed - no URL returned';
        console.error('❌ Upload failed:', errorMsg, 'Full response:', data);
        throw new Error(errorMsg);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`💥 ${type} upload error:`, {
        error,
        errorMessage,
        fileName: file.name,
        progressId
      });
      
      updateProgress(progressId, { 
        status: 'error', 
        error: errorMessage 
      });
      
      return null;
    }
  }, [maxImageSize, maxVideoSize, compressImage, options.orderId, updateProgress]);

  // Upload multiple files in batches
  const uploadFiles = useCallback(async (
    files: File[],
    type: 'image' | 'video'
  ): Promise<string[]> => {
    console.log('🎯 Starting batch upload:', {
      fileCount: files.length,
      type,
      batchSize,
      files: files.map(f => ({ name: f.name, size: f.size, type: f.type }))
    });

    setIsUploading(true);
    setCanCancel(true);
    cancelRef.current = false;

    const uploadedUrls: string[] = [];
    
    try {
      // Process files in batches
      for (let i = 0; i < files.length; i += batchSize) {
        if (cancelRef.current) {
          console.log('❌ Batch upload cancelled');
          break;
        }

        const batch = files.slice(i, i + batchSize);
        console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}:`, batch.map(f => f.name));
        
        const batchPromises = batch.map(file => uploadSingleFile(file, type));
        
        const results = await Promise.allSettled(batchPromises);
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            uploadedUrls.push(result.value);
            console.log(`✅ Batch file ${index + 1} uploaded successfully:`, result.value);
          } else if (result.status === 'rejected') {
            console.error(`❌ Batch file ${index + 1} failed:`, result.reason);
          }
        });

        // Delay between batches
        if (i + batchSize < files.length && !cancelRef.current) {
          console.log('⏳ Waiting 1 second before next batch...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!cancelRef.current && uploadedUrls.length > 0) {
        console.log('🎉 Batch upload completed successfully:', {
          uploaded: uploadedUrls.length,
          total: files.length,
          urls: uploadedUrls
        });
        
        toast({
          title: "Загрузка завершена",
          description: `Успешно загружено ${uploadedUrls.length} из ${files.length} файлов`,
        });
      } else if (uploadedUrls.length === 0) {
        console.error('❌ No files were uploaded successfully');
        toast({
          title: "Ошибка загрузки",
          description: "Ни один файл не был загружен",
          variant: "destructive",
        });
      }

      return uploadedUrls;

    } catch (error) {
      console.error('💥 Batch upload error:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Произошла ошибка при загрузке файлов",
        variant: "destructive",
      });
      return uploadedUrls;
    } finally {
      console.log('🏁 Batch upload process finished');
      setIsUploading(false);
      setCanCancel(false);
    }
  }, [batchSize, uploadSingleFile]);

  // Cancel upload
  const cancelUpload = useCallback(() => {
    console.log('🛑 Upload cancellation requested');
    cancelRef.current = true;
    setCanCancel(false);
    
    toast({
      title: "Загрузка отменена",
      description: "Загрузка файлов была прервана",
    });
  }, []);

  // Clear progress
  const clearProgress = useCallback(() => {
    console.log('🧹 Clearing upload progress');
    setUploadProgress([]);
  }, []);

  // Auto-save on connection restore
  const handleConnectionRestore = useCallback(async () => {
    if (!navigator.onLine) {
      console.log('📶 Still offline, skipping connection restore');
      return;
    }
    
    console.log('🔄 Connection restored, checking for failed uploads...');
    // Check for failed uploads and retry
    const failedUploads = uploadProgress.filter(p => p.status === 'error');
    if (failedUploads.length > 0) {
      console.log('🔄 Found failed uploads to retry:', failedUploads.length);
      toast({
        title: "Соединение восстановлено",
        description: `Повторная загрузка ${failedUploads.length} файлов...`,
      });
      // Implement retry logic here if needed
    }
  }, [uploadProgress]);

  // Listen for online/offline events
  React.useEffect(() => {
    console.log('🔌 Setting up online/offline event listeners');
    window.addEventListener('online', handleConnectionRestore);
    return () => {
      console.log('🔌 Cleaning up online/offline event listeners');
      window.removeEventListener('online', handleConnectionRestore);
    };
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
