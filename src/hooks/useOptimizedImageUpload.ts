
import { useState, useCallback, useRef } from 'react';
import { uploadToCloudinary } from '@/utils/cloudinaryUpload';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProgress {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  blobUrl?: string;
  finalUrl?: string;
  error?: string;
}

interface OptimizedImageUploadOptions {
  maxConcurrent?: number;
  productId?: string;
  onProgress?: (progress: ImageUploadProgress[]) => void;
  disableToast?: boolean;
}

export const useOptimizedImageUpload = () => {
  const { toast } = useToast();
  const [uploadQueue, setUploadQueue] = useState<ImageUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const activeUploads = useRef(0);
  const maxConcurrent = 3;

  const createBlobUrl = useCallback((file: File): string => {
    return URL.createObjectURL(file);
  }, []);

  const processUploadQueue = useCallback(async (
    queue: ImageUploadProgress[],
    options: OptimizedImageUploadOptions = {}
  ) => {
    const { productId, onProgress, disableToast = false } = options;
    
    const processNext = async (): Promise<void> => {
      if (activeUploads.current >= maxConcurrent) return;
      
      const nextItem = queue.find(item => item.status === 'pending');
      if (!nextItem) return;
      
      activeUploads.current++;
      
      // Update status to uploading
      setUploadQueue(prev => 
        prev.map(item => 
          item.id === nextItem.id 
            ? { ...item, status: 'uploading' as const, progress: 10 }
            : item
        )
      );
      
      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadQueue(prev => 
            prev.map(item => 
              item.id === nextItem.id && item.progress < 90
                ? { ...item, progress: item.progress + 10 }
                : item
            )
          );
        }, 200);
        
        const result = await uploadToCloudinary(nextItem.file, productId);
        clearInterval(progressInterval);
        
        if (result.success && result.mainImageUrl) {
          setUploadQueue(prev => 
            prev.map(item => 
              item.id === nextItem.id 
                ? { 
                    ...item, 
                    status: 'success' as const, 
                    progress: 100,
                    finalUrl: result.mainImageUrl 
                  }
                : item
            )
          );
          
          // Clean up blob URL
          if (nextItem.blobUrl) {
            URL.revokeObjectURL(nextItem.blobUrl);
          }
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setUploadQueue(prev => 
          prev.map(item => 
            item.id === nextItem.id 
              ? { ...item, status: 'error' as const, error: errorMessage }
              : item
          )
        );
        
        if (!disableToast) {
          toast({
            title: "Ошибка загрузки",
            description: `Не удалось загрузить ${nextItem.file.name}`,
            variant: "destructive",
          });
        }
      } finally {
        activeUploads.current--;
        // Process next item
        setTimeout(() => processNext(), 100);
      }
    };
    
    // Start processing
    for (let i = 0; i < Math.min(maxConcurrent, queue.filter(item => item.status === 'pending').length); i++) {
      processNext();
    }
  }, [toast]);

  const uploadFiles = useCallback(async (
    files: File[],
    options: OptimizedImageUploadOptions = {}
  ): Promise<string[]> => {
    setIsUploading(true);
    
    // Create initial queue with blob URLs for immediate preview
    const initialQueue: ImageUploadProgress[] = files.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      file,
      progress: 0,
      status: 'pending',
      blobUrl: createBlobUrl(file)
    }));
    
    setUploadQueue(initialQueue);
    
    // Start processing
    await processUploadQueue(initialQueue, options);
    
    // Wait for all uploads to complete
    return new Promise((resolve) => {
      const checkCompletion = () => {
        setUploadQueue(current => {
          const pending = current.filter(item => 
            item.status === 'pending' || item.status === 'uploading'
          );
          
          if (pending.length === 0) {
            const successfulUploads = current
              .filter(item => item.status === 'success' && item.finalUrl)
              .map(item => item.finalUrl!);
            
            setIsUploading(false);
            resolve(successfulUploads);
            
            // Clear queue after a short delay
            setTimeout(() => setUploadQueue([]), 2000);
          } else {
            setTimeout(checkCompletion, 500);
          }
          
          return current;
        });
      };
      
      checkCompletion();
    });
  }, [createBlobUrl, processUploadQueue]);

  const getPreviewUrls = useCallback(() => {
    return uploadQueue
      .filter(item => item.blobUrl || item.finalUrl)
      .map(item => item.finalUrl || item.blobUrl!);
  }, [uploadQueue]);

  const clearQueue = useCallback(() => {
    // Clean up blob URLs
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
    clearQueue
  };
};
