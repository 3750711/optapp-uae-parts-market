import { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MessageImageUploadItem {
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

export const useMessageImageUpload = () => {
  const { toast } = useToast();
  const [uploadQueue, setUploadQueue] = useState<MessageImageUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const defaultCompressionOptions = {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1000,
    initialQuality: 0.85,
    fileType: 'image/webp'
  };

  // Create blob URL for immediate preview
  const createBlobUrl = useCallback((file: File): string => {
    return URL.createObjectURL(file);
  }, []);

  // Compress image
  const compressImage = useCallback(async (file: File): Promise<File> => {
    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: defaultCompressionOptions.maxSizeMB,
        maxWidthOrHeight: defaultCompressionOptions.maxWidthOrHeight,
        initialQuality: defaultCompressionOptions.initialQuality,
        fileType: defaultCompressionOptions.fileType,
        useWebWorker: true,
        preserveExif: false
      });
      
      console.log(`📦 Compressed message image ${file.name}:`, {
        originalSize: file.size,
        compressedSize: compressedFile.size,
        ratio: Math.round((1 - compressedFile.size / file.size) * 100) + '%'
      });
      
      return compressedFile;
    } catch (error) {
      console.warn('Compression failed for message image, using original file:', error);
      return file;
    }
  }, []);

  // Upload single file
  const uploadSingleFile = useCallback(async (item: MessageImageUploadItem): Promise<string> => {
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

      // Create FormData for Cloudinary
      const formData = new FormData();
      formData.append('file', fileToUpload, fileToUpload.name);
      formData.append('messageId', `message-${Date.now()}`);
      
      console.log('📤 Uploading message image:', {
        name: fileToUpload.name,
        size: fileToUpload.size,
        type: fileToUpload.type
      });

      // Update progress
      setUploadQueue(prev => 
        prev.map(i => 
          i.id === item.id 
            ? { ...i, progress: 30 }
            : i
        )
      );

      // Call Cloudinary upload Edge Function
      const { data: result, error } = await supabase.functions.invoke('cloudinary-upload', {
        body: formData,
      });

      console.log('📥 Upload response:', { result, error });

      if (error) {
        console.error('❌ Edge Function error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      if (!result || !result.success) {
        console.error('❌ Upload result error:', result);
        throw new Error(result?.error || 'Upload failed - no result');
      }

      if (!result.mainImageUrl) {
        console.error('❌ No mainImageUrl in result:', result);
        throw new Error('Upload failed - no URL returned');
      }

      console.log('✅ Upload successful:', result.mainImageUrl);

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
      console.error('💥 Upload error:', errorMessage);
      
      setUploadQueue(prev => 
        prev.map(i => 
          i.id === item.id 
            ? { ...i, status: 'error', error: errorMessage }
            : i
        )
      );
      throw error;
    }
  }, []);

  // Main upload function for messages
  const uploadMessageImages = useCallback(async (files: File[]): Promise<string[]> => {
    if (files.length === 0) {
      console.warn('⚠️ No files provided for upload');
      return [];
    }

    // Validate image files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Ошибка файла",
          description: `${file.name} не является изображением`,
          variant: "destructive",
        });
        return false;
      }
      if (file.size > 20 * 1024 * 1024) { // 20MB
        toast({
          title: "Файл слишком большой",
          description: `${file.name} превышает 20MB`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      return [];
    }

    console.log('🚀 Starting message images upload:', { count: validFiles.length });
    
    setIsUploading(true);

    // Create initial queue with blob URLs for immediate preview
    const initialQueue: MessageImageUploadItem[] = validFiles.map((file, index) => ({
      id: `message-upload-${Date.now()}-${index}`,
      file,
      progress: 0,
      status: 'pending',
      blobUrl: createBlobUrl(file),
      originalSize: file.size
    }));

    setUploadQueue(prev => [...prev, ...initialQueue]);

    try {
      const results: string[] = [];

      // Step 1: Compress all images
      for (const item of initialQueue) {
        setUploadQueue(prev => 
          prev.map(i => 
            i.id === item.id 
              ? { ...i, status: 'compressing', progress: 5 }
              : i
          )
        );

        const compressedFile = await compressImage(item.file);

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
      }

      // Step 2: Upload compressed images one by one
      for (const item of initialQueue) {
        try {
          const url = await uploadSingleFile({
            ...item,
            compressedFile: item.compressedFile
          } as MessageImageUploadItem);
          results.push(url);
        } catch (error) {
          console.error('💥 Failed to upload message image:', error);
        }
      }

      if (results.length > 0) {
        toast({
          title: "Изображения загружены",
          description: `Успешно загружено ${results.length} из ${validFiles.length} изображений`,
        });
      }

      // Clear queue after successful upload
      setTimeout(() => {
        setUploadQueue(prev => prev.filter(item => item.status !== 'success'));
      }, 3000);

      return results;
    } catch (error) {
      console.error('💥 Message image upload process failed:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Произошла ошибка при загрузке изображений",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsUploading(false);
    }
  }, [createBlobUrl, compressImage, uploadSingleFile, toast]);

  // Remove image from queue
  const removeImage = useCallback((index: number) => {
    setUploadQueue(prev => {
      const newQueue = [...prev];
      const item = newQueue[index];
      if (item?.blobUrl) {
        URL.revokeObjectURL(item.blobUrl);
      }
      newQueue.splice(index, 1);
      return newQueue;
    });
  }, []);

  // Get preview URLs
  const getPreviewUrls = useCallback(() => {
    return uploadQueue
      .filter(item => item.status !== 'error' && (item.finalUrl || item.blobUrl))
      .map(item => item.finalUrl || item.blobUrl!);
  }, [uploadQueue]);

  // Get final URLs
  const getFinalUrls = useCallback(() => {
    return uploadQueue
      .filter(item => item.status === 'success' && item.finalUrl)
      .map(item => item.finalUrl!);
  }, [uploadQueue]);

  return {
    uploadMessageImages,
    uploadQueue,
    isUploading,
    getPreviewUrls,
    getFinalUrls,
    removeImage
  };
};