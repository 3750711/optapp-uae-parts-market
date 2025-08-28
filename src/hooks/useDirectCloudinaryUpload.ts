import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadItem {
  id: string;
  file: File;
  compressedFile?: File;
  progress: number;
  status: 'pending' | 'compressing' | 'signing' | 'uploading' | 'success' | 'error' | 'deleted' | 'paused';
  error?: string;
  blobUrl?: string;
  finalUrl?: string;
  publicId?: string;
  originalSize: number;
  compressedSize?: number;
  abortController?: AbortController;
}

interface NetworkProfile {
  effectiveType: string;
  saveData: boolean;
  maxConcurrent: number;
  maxSide: number;
  quality: number;
}

interface CloudinarySignature {
  cloud_name: string;
  api_key: string;
  timestamp: number;
  folder: string;
  public_id: string;
  signature: string;
  upload_url: string;
}

interface DirectUploadOptions {
  orderId: string;
  maxConcurrent?: number;
  disableToast?: boolean;
}

// Network detection and adaptive profiles
const getNetworkProfile = (): NetworkProfile => {
  const connection = (navigator as any).connection;
  const effectiveType = connection?.effectiveType || '4g';
  const saveData = !!connection?.saveData;
  
  // Force economic profile if saveData is enabled
  if (saveData) {
    return {
      effectiveType: 'saveData',
      saveData: true,
      maxConcurrent: 1,
      maxSide: 1280,
      quality: 0.7
    };
  }
  
  // Adaptive profiles based on network
  switch (effectiveType) {
    case '3g':
    case 'slow-2g':
    case '2g':
      return {
        effectiveType,
        saveData: false,
        maxConcurrent: 1,
        maxSide: 1280,
        quality: 0.74
      };
    case '4g':
    default:
      return {
        effectiveType,
        saveData: false,
        maxConcurrent: 3,
        maxSide: 1600,
        quality: 0.82
      };
  }
};

// Deduplication using SHA-1 hash of first 256KB + file size
const quickHash = async (file: File): Promise<string> => {
  const chunk = file.slice(0, 256 * 1024); // First 256KB
  const arrayBuffer = await chunk.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-1', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hashHex}_${file.size}`;
};

// Semaphore for controlling concurrency
class Semaphore {
  private current = 0;
  private queue: (() => void)[] = [];
  
  constructor(private limit: number) {}
  
  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const releaser = () => {
        this.current--;
        this.next();
      };
      
      if (this.current < this.limit) {
        this.current++;
        resolve(releaser);
      } else {
        this.queue.push(() => {
          this.current++;
          resolve(releaser);
        });
      }
    });
  }
  
  private next() {
    if (this.queue.length > 0 && this.current < this.limit) {
      const next = this.queue.shift()!;
      next();
    }
  }
}

export const useDirectCloudinaryUpload = () => {
  const { toast } = useToast();
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const processedHashes = useRef(new Set<string>());
  const compressionSemaphore = useRef(new Semaphore(1)); // Limit compression to prevent memory issues
  const worker = useRef<Worker | null>(null);

  // Initialize worker
  const initWorker = useCallback(() => {
    if (!worker.current) {
      try {
        console.log('🔧 Initializing WebWorker for image compression');
        worker.current = new Worker(new URL('../workers/image-compress.worker.ts', import.meta.url), {
          type: 'module'
        });
        
        worker.current.onerror = (error) => {
          console.error('❌ WebWorker error:', error);
        };
        
        console.log('✅ WebWorker initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize WebWorker:', error);
        throw new Error('Failed to initialize image compression worker');
      }
    }
    return worker.current;
  }, []);

  // Get Cloudinary signature
  const getCloudinarySignature = useCallback(async (orderId: string): Promise<CloudinarySignature> => {
    console.log('🔐 Getting Cloudinary signature for orderId:', orderId);
    
    const { data, error } = await supabase.functions.invoke('cloudinary-sign', {
      body: { orderId }
    });
    
    if (error) {
      console.error('❌ Signature error:', error);
      throw new Error(error.message);
    }
    
    if (!data) {
      console.error('❌ No signature data received');
      throw new Error('No signature data received');
    }
    
    // Validate required fields
    const requiredFields = ['cloud_name', 'api_key', 'signature', 'timestamp', 'upload_url'];
    for (const field of requiredFields) {
      if (!data[field]) {
        console.error(`❌ Missing required field in signature: ${field}`);
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    console.log('✅ Signature received successfully:', {
      cloud_name: data.cloud_name,
      folder: data.folder,
      public_id: data.public_id
    });
    
    return data;
  }, []);

  // Compress image using WebWorker
  const compressImage = useCallback(async (file: File, networkProfile: NetworkProfile): Promise<File> => {
    // Skip compression for small files (< 400KB)
    if (file.size < 400 * 1024) {
      console.log(`📦 Skipping compression for small file: ${file.name} (${file.size} bytes)`);
      return file;
    }

    const releaseCompressionLock = await compressionSemaphore.current.acquire();
    
    try {
      const compressionWorker = initWorker();
      
      const compressedFile = await new Promise<File>((resolve, reject) => {
        const taskId = crypto.randomUUID();
        
        const messageHandler = (e: MessageEvent) => {
          if (e.data.id === taskId) {
            compressionWorker.removeEventListener('message', messageHandler);
            if (e.data.error) {
              reject(new Error(e.data.error));
            } else {
              const { blob, originalSize, compressedSize } = e.data;
              console.log(`📦 Compressed ${file.name}: ${originalSize} → ${compressedSize} bytes (${Math.round((1 - compressedSize/originalSize) * 100)}%)`);
              resolve(new File([blob], file.name, { type: blob.type }));
            }
          }
        };
        
        compressionWorker.addEventListener('message', messageHandler);
        
        compressionWorker.postMessage({
          id: taskId,
          file,
          maxSide: networkProfile.maxSide,
          quality: networkProfile.quality,
          format: 'webp'
        });
      });
      
      return compressedFile;
    } finally {
      releaseCompressionLock();
    }
  }, [initWorker]);

  // Direct upload to Cloudinary
  const uploadToCloudinary = useCallback(async (
    file: File, 
    signature: CloudinarySignature,
    onProgress: (progress: number) => void,
    abortController: AbortController
  ): Promise<{ url: string; publicId: string }> => {
    console.log('☁️ Starting direct upload to Cloudinary:', {
      fileName: file.name,
      fileSize: file.size,
      uploadUrl: signature.upload_url
    });
    
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signature.api_key);
      formData.append('timestamp', signature.timestamp.toString());
      formData.append('folder', signature.folder);
      formData.append('public_id', signature.public_id);
      formData.append('signature', signature.signature);

      const xhr = new XMLHttpRequest();
      
      // Upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };
      
      // Success
      xhr.onload = () => {
        console.log('📡 Cloudinary upload response:', xhr.status, xhr.statusText);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('✅ Upload successful:', {
              secure_url: response.secure_url,
              public_id: response.public_id
            });
            
            resolve({
              url: response.secure_url,
              publicId: response.public_id
            });
          } catch (error) {
            console.error('❌ Failed to parse Cloudinary response:', xhr.responseText);
            reject(new Error('Invalid response from Cloudinary'));
          }
        } else {
          console.error('❌ Upload failed:', xhr.status, xhr.statusText, xhr.responseText);
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      };
      
      // Error
      xhr.onerror = () => {
        console.error('❌ Network error during upload to Cloudinary');
        reject(new Error('Network error during upload'));
      };
      xhr.ontimeout = () => {
        console.error('❌ Upload timeout to Cloudinary');
        reject(new Error('Upload timeout'));
      };
      
      // Abort handling
      abortController.signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('Upload cancelled'));
      });
      
      xhr.open('POST', signature.upload_url);
      xhr.timeout = 60000; // 60 second timeout
      xhr.send(formData);
    });
  }, []);

  // Upload single file with retry logic
  const uploadSingleFile = useCallback(async (
    item: UploadItem,
    options: DirectUploadOptions,
    networkProfile: NetworkProfile,
    retryCount = 0
  ): Promise<{ url: string; publicId: string }> => {
    const maxRetries = 3;
    const baseDelay = 1000;
    const jitter = () => Math.random() * 250; // ±250ms jitter

    try {
      // Signing phase
      setUploadQueue(prev => prev.map(i => 
        i.id === item.id ? { ...i, status: 'signing', progress: 5 } : i
      ));

      const signature = await getCloudinarySignature(options.orderId);

      // Upload phase
      setUploadQueue(prev => prev.map(i => 
        i.id === item.id ? { ...i, status: 'uploading', progress: 10 } : i
      ));

      const result = await uploadToCloudinary(
        item.compressedFile || item.file,
        signature,
        (progress) => {
          setUploadQueue(prev => prev.map(i => 
            i.id === item.id ? { ...i, progress: Math.max(10, progress) } : i
          ));
        },
        item.abortController!
      );

      setUploadQueue(prev => prev.map(i => 
        i.id === item.id ? { 
          ...i, 
          status: 'success', 
          progress: 100,
          finalUrl: result.url,
          publicId: result.publicId
        } : i
      ));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      // Check if we should retry
      const shouldRetry = retryCount < maxRetries && 
        (errorMessage.includes('timeout') || 
         errorMessage.includes('network') || 
         errorMessage.includes('5')) &&
        !item.abortController?.signal.aborted;

      if (shouldRetry) {
        const delay = Math.pow(2, retryCount) * baseDelay + jitter();
        console.log(`🔄 Retrying upload for ${item.file.name} (attempt ${retryCount + 1}/${maxRetries}) after ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return uploadSingleFile(item, options, networkProfile, retryCount + 1);
      } else {
        setUploadQueue(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'error', error: errorMessage } : i
        ));
        throw error;
      }
    }
  }, [getCloudinarySignature, uploadToCloudinary]);

  // Batch save to database
  const saveToDatabase = useCallback(async (
    orderId: string,
    uploadedItems: { url: string; publicId: string }[]
  ) => {
    const items = uploadedItems.map(item => ({
      url: item.url,
      public_id: item.publicId,
      type: 'photo' as const
    }));

    const { error } = await supabase.functions.invoke('attach-order-media', {
      body: {
        order_id: orderId,
        items
      }
    });

    if (error) {
      throw new Error(`Database save failed: ${error.message}`);
    }
  }, []);

  // Main upload function
  const uploadFiles = useCallback(async (
    files: File[],
    options: DirectUploadOptions
  ): Promise<string[]> => {
    setIsUploading(true);
    setIsPaused(false);
    
    const networkProfile = getNetworkProfile();
    const semaphore = new Semaphore(options.maxConcurrent || networkProfile.maxConcurrent);
    
    console.log(`🚀 Starting direct upload with profile:`, networkProfile);

    // Deduplication
    const uniqueFiles: File[] = [];
    for (const file of files) {
      const hash = await quickHash(file);
      if (!processedHashes.current.has(hash)) {
        processedHashes.current.add(hash);
        uniqueFiles.push(file);
      } else {
        console.log(`⚡ Skipping duplicate file: ${file.name}`);
      }
    }

    if (uniqueFiles.length === 0) {
      if (!options.disableToast) {
        toast({
          title: "Дубликаты файлов",
          description: "Все выбранные файлы уже были загружены",
        });
      }
      setIsUploading(false);
      return [];
    }

    // Create upload queue
    const initialQueue: UploadItem[] = uniqueFiles.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      file,
      progress: 0,
      status: 'pending',
      blobUrl: URL.createObjectURL(file),
      originalSize: file.size,
      abortController: new AbortController()
    }));

    setUploadQueue(prev => [...prev, ...initialQueue]);

    try {
      // Step 1: Compress images in parallel (limited by compression semaphore)
      const compressionPromises = initialQueue.map(async (item) => {
        const release = await semaphore.acquire();
        
        try {
          if (isPaused || item.abortController?.signal.aborted) return item;
          
          setUploadQueue(prev => prev.map(i => 
            i.id === item.id ? { ...i, status: 'compressing', progress: 0 } : i
          ));

          const compressedFile = await compressImage(item.file, networkProfile);
          
          setUploadQueue(prev => prev.map(i => 
            i.id === item.id ? { 
              ...i, 
              compressedFile, 
              compressedSize: compressedFile.size,
              status: 'pending',
              progress: 0
            } : i
          ));

          return { ...item, compressedFile, compressedSize: compressedFile.size };
        } finally {
          release();
        }
      });

      const compressedItems = await Promise.all(compressionPromises);

      // Step 2: Upload to Cloudinary
      const uploadPromises = compressedItems.map(async (item) => {
        if (isPaused || item.abortController?.signal.aborted) return null;
        
        const release = await semaphore.acquire();
        
        try {
          return await uploadSingleFile(item, options, networkProfile);
        } catch (error) {
          console.error(`Upload failed for ${item.file.name}:`, error);
          return null;
        } finally {
          release();
        }
      });

      const uploadResults = await Promise.all(uploadPromises);
      const successfulUploads = uploadResults.filter((result): result is { url: string; publicId: string } => result !== null);

      // Step 3: Save to database in batch
      if (successfulUploads.length > 0) {
        await saveToDatabase(options.orderId, successfulUploads);
      }

      // Cleanup blob URLs
      setTimeout(() => {
        initialQueue.forEach(item => {
          if (item.blobUrl) {
            URL.revokeObjectURL(item.blobUrl);
          }
        });
      }, 30000);

      if (!options.disableToast) {
        if (successfulUploads.length > 0) {
          toast({
            title: "Загрузка завершена",
            description: `Загружено ${successfulUploads.length} из ${uniqueFiles.length} файлов`,
          });
        }
        
        if (successfulUploads.length < uniqueFiles.length) {
          toast({
            title: "Частичная загрузка",
            description: `${uniqueFiles.length - successfulUploads.length} файлов не удалось загрузить`,
            variant: "destructive",
          });
        }
      }

      return successfulUploads.map(result => result.url);
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
  }, [compressImage, uploadSingleFile, saveToDatabase, toast, isPaused]);

  // Pause uploads
  const pauseUpload = useCallback(() => {
    setIsPaused(true);
  }, []);

  // Resume uploads
  const resumeUpload = useCallback(async (options: DirectUploadOptions) => {
    setIsPaused(false);
    
    // Resume pending uploads
    const pendingItems = uploadQueue.filter(item => 
      ['pending', 'compressing', 'paused'].includes(item.status)
    );

    if (pendingItems.length === 0) return [];

    // Continue with pending uploads
    // This would require restructuring the upload flow to be more stateful
    // For now, we'll just mark them as pending again
    setUploadQueue(prev => prev.map(item => 
      item.status === 'paused' ? { ...item, status: 'pending' } : item
    ));
  }, [uploadQueue]);

  // Cancel uploads
  const cancelUpload = useCallback(() => {
    // Abort all ongoing uploads
    uploadQueue.forEach(item => {
      item.abortController?.abort();
      if (item.blobUrl) {
        URL.revokeObjectURL(item.blobUrl);
      }
    });
    
    setUploadQueue([]);
    setIsUploading(false);
    setIsPaused(false);
    
    if (!toast) return;
    
    toast({
      title: "Загрузка отменена",
      description: "Все загрузки были прерваны",
    });
  }, [uploadQueue, toast]);

  // Mark item as deleted
  const markAsDeleted = useCallback((url: string) => {
    setUploadQueue(prev => prev.map(item => 
      (item.finalUrl === url || item.blobUrl === url) 
        ? { ...item, status: 'deleted' as const }
        : item
    ));
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    if (worker.current) {
      worker.current.terminate();
      worker.current = null;
    }
    
    uploadQueue.forEach(item => {
      if (item.blobUrl) {
        URL.revokeObjectURL(item.blobUrl);
      }
    });
    
    setUploadQueue([]);
    processedHashes.current.clear();
  }, [uploadQueue]);

  // Pause/resume on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isUploading) {
        pauseUpload();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cleanup();
    };
  }, [isUploading, pauseUpload, cleanup]);

  return {
    uploadFiles,
    uploadQueue,
    isUploading,
    isPaused,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    markAsDeleted,
    cleanup
  };
};