
import { useState, useCallback, useRef } from 'react';
import { toast } from "@/hooks/use-toast";
import { uploadDirectToCloudinary } from "@/utils/cloudinaryUpload";
import { validateImageForMarketplace, logImageProcessing } from "@/utils/imageProcessingUtils";
import { getBatchImageUrls } from "@/utils/cloudinaryUtils";

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  cloudinaryUrl?: string;
  publicId?: string;
  isPrimary?: boolean;
}

interface BatchUploadOptions {
  batchSize?: number;
  batchDelay?: number;
  maxRetries?: number;
  productId?: string;
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
      console.log('🚀 Starting Cloudinary upload:', {
        fileName: file.name,
        fileId,
        productId: options.productId,
        isPrimary,
        retryCount
      });

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

      // Create custom public_id
      const customPublicId = `product_${options.productId || Date.now()}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId ? { ...p, progress: 50 } : p
      ));

      // Upload directly to Cloudinary
      console.log('☁️ Uploading to Cloudinary...');
      const result = await uploadDirectToCloudinary(file, options.productId, customPublicId);

      if (!result.success || !result.cloudinaryUrl || !result.publicId) {
        throw new Error(result.error || 'Cloudinary upload failed');
      }

      console.log('✅ Cloudinary upload completed:', {
        cloudinaryUrl: result.cloudinaryUrl,
        publicId: result.publicId,
        isPrimary
      });

      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId ? { ...p, progress: 80, cloudinaryUrl: result.cloudinaryUrl, publicId: result.publicId } : p
      ));

      // Generate image variants using public_id
      const batchUrls = getBatchImageUrls(result.publicId);

      console.log('🎨 Generated image variants:', {
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
        title: "Ошибка загрузки",
        description: "Произошла ошибка при загрузке файлов",
        variant: "destructive",
      });

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
