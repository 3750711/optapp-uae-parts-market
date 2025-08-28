import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { indexedDBQueue, type QueueItem } from '@/utils/indexedDBQueue';

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
  orderId?: string; // Added for IndexedDB persistence
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
  const [persistentQueue, setPersistentQueue] = useState<QueueItem[]>([]);

  // Initialize and restore queue from IndexedDB
  useEffect(() => {
    const initQueue = async () => {
      try {
        await indexedDBQueue.init();
        const storedItems = await indexedDBQueue.getAllItems();
        
        // Filter out completed items older than 24 hours
        const validItems = storedItems.filter(item => {
          const age = Date.now() - item.createdAt;
          const isOld = age > 24 * 60 * 60 * 1000; // 24 hours
          const isCompleted = ['success', 'deleted'].includes(item.status);
          return !(isOld && isCompleted);
        });
        
        setPersistentQueue(validItems);
        
        // Clean up old completed items
        await indexedDBQueue.clearCompleted();
        
        console.log(`📦 Restored ${validItems.length} items from persistent queue`);
      } catch (error) {
        console.error('Failed to initialize IndexedDB queue:', error);
      }
    };
    
    initQueue();
  }, []);

  // Sync upload queue to IndexedDB
  const syncToIndexedDB = useCallback(async (item: UploadItem) => {
    if (!item.orderId) return;
    
    try {
      // Check if item exists in IndexedDB
      const existingItems = await indexedDBQueue.getAllItems();
      const existingItem = existingItems.find(i => i.id === item.id);
      
      if (existingItem) {
        await indexedDBQueue.updateItem(item.id, {
          status: item.status,
          progress: item.progress,
          error: item.error,
          finalUrl: item.finalUrl,
          publicId: item.publicId,
          compressedSize: item.compressedSize
        });
      } else {
        await indexedDBQueue.addItem({
          orderId: item.orderId,
          file: item.file,
          status: item.status,
          progress: item.progress,
          originalSize: item.originalSize,
          compressedSize: item.compressedSize,
          finalUrl: item.finalUrl,
          publicId: item.publicId,
          error: item.error
        });
      }
    } catch (error) {
      console.error('Failed to sync item to IndexedDB:', error);
    }
  }, []);

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
    
    // Get current session for JWT token
    const { data: { session } } = await supabase.auth.getSession();
    
    const { data, error } = await supabase.functions.invoke('cloudinary-sign', {
      body: JSON.stringify({ orderId }),
      headers: {
        'content-type': 'application/json',
        // Pass JWT token for admin authorization
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
      }
    });
    
    if (error) {
      console.error('❌ Signature error:', error);
      throw new Error(error.message || 'cloudinary-sign call failed');
    }
    
    if (!data) {
      console.error('❌ No signature data received');
      throw new Error('No signature data received');
    }
    
    // Support both response formats: {success, data} OR direct object
    const payload = data;
    const sign = payload?.success ? payload.data : payload;
    
    if (!sign?.timestamp || !sign?.signature || !sign?.folder || !sign?.public_id || !sign?.api_key || !sign?.cloud_name) {
      console.error('❌ Bad payload:', payload);
      throw new Error('cloudinary-sign returned invalid payload');
    }
    
    console.log('✅ Signature received successfully:', {
      cloud_name: sign.cloud_name,
      folder: sign.folder,
      public_id: sign.public_id
    });
    
    return sign;
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
      const updatedItem1 = { ...item, status: 'signing' as const, progress: 5 };
      setUploadQueue(prev => prev.map(i => 
        i.id === item.id ? updatedItem1 : i
      ));
      await syncToIndexedDB(updatedItem1);

      const signature = await getCloudinarySignature(options.orderId);

      // Upload phase
      const updatedItem2 = { ...item, status: 'uploading' as const, progress: 10 };
      setUploadQueue(prev => prev.map(i => 
        i.id === item.id ? updatedItem2 : i
      ));
      await syncToIndexedDB(updatedItem2);

      const result = await uploadToCloudinary(
        item.compressedFile || item.file,
        signature,
        async (progress) => {
          const updatedItem = { ...item, progress: Math.max(10, progress) };
          setUploadQueue(prev => prev.map(i => 
            i.id === item.id ? updatedItem : i
          ));
          await syncToIndexedDB(updatedItem);
        },
        item.abortController!
      );

      const successItem = { 
        ...item, 
        status: 'success' as const, 
        progress: 100,
        finalUrl: result.url,
        publicId: result.publicId
      };
      setUploadQueue(prev => prev.map(i => 
        i.id === item.id ? successItem : i
      ));
      await syncToIndexedDB(successItem);

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
        const errorItem = { ...item, status: 'error' as const, error: errorMessage };
        setUploadQueue(prev => prev.map(i => 
          i.id === item.id ? errorItem : i
        ));
        await syncToIndexedDB(errorItem);
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

    // Get current session for JWT
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No authentication session found');
    }

    const { data: saveResp, error: saveErr } = await supabase.functions.invoke('attach-order-media', {
      body: JSON.stringify({ order_id: orderId, items }),
      headers: { 
        'content-type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (saveErr) throw new Error('Edge Function call failed: ' + saveErr.message);
    if (!saveResp?.success) throw new Error('Database save failed: ' + (saveResp?.error || 'unknown'));
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
      abortController: new AbortController(),
      orderId: options.orderId // Add orderId for IndexedDB persistence
    }));

    setUploadQueue(prev => [...prev, ...initialQueue]);

    // Sync initial items to IndexedDB
    for (const item of initialQueue) {
      await syncToIndexedDB(item);
    }

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
    persistentQueue,
    isUploading,
    isPaused,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    markAsDeleted,
    cleanup,
    networkProfile: getNetworkProfile()
  };
};