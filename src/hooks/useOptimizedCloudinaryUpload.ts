import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNetworkSpeedMeter, UploadMetrics } from './useNetworkSpeedMeter';

interface OptimizedUploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'compressing' | 'signing' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
  publicId?: string;
  metrics?: Partial<UploadMetrics>;
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

interface BatchSignResponse {
  success: true;
  data: CloudinarySignature[];
  count: number;
}

// IndexedDB for storing staged URLs (reuse from original)
const DB_NAME = 'StagedUploads';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

class StagedUploadDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'sessionId' });
          store.createIndex('createdAt', 'createdAt');
        }
      };
    });
  }

  async saveSession(sessionId: string, urls: string[]): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const data = {
        sessionId,
        urls,
        createdAt: Date.now()
      };
      
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSession(sessionId: string): Promise<string[] | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(sessionId);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.urls : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearSession(sessionId: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(sessionId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearOldSessions(): Promise<void> {
    if (!this.db) await this.init();
    
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('createdAt');
      const range = IDBKeyRange.upperBound(cutoff);
      const request = index.openCursor(range);
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

const stagingDB = new StagedUploadDB();

export const useOptimizedCloudinaryUpload = () => {
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stagedUrls, setStagedUrls] = useState<string[]>([]);
  const [uploadItems, setUploadItems] = useState<OptimizedUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Network performance tracking
  const {
    networkProfile,
    getCompressionProfile,
    updateFromUpload,
    initializeProfile,
    getPerformanceSummary
  } = useNetworkSpeedMeter();

  // Signature pool for batch optimization
  const signaturePoolRef = useRef<CloudinarySignature[]>([]);
  const workerRef = useRef<Worker | null>(null);
  const activeUploadsRef = useRef<Set<string>>(new Set());

  // Initialize smart compression worker
  useEffect(() => {
    workerRef.current = new Worker('/src/workers/smart-image-compress.worker.ts', { type: 'module' });
    
    // Initialize network profile
    initializeProfile();
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [initializeProfile]);

  // Initialize session ID and restore from IndexedDB
  const initSession = useCallback(async () => {
    if (sessionId) return sessionId;
    
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    
    try {
      const savedUrls = await stagingDB.getSession(newSessionId);
      if (savedUrls) {
        setStagedUrls(savedUrls);
      }
      
      await stagingDB.clearOldSessions();
    } catch (error) {
      console.error('Failed to initialize staging session:', error);
    }
    
    return newSessionId;
  }, [sessionId]);

  // Get batch signatures from new endpoint
  const getBatchSignatures = useCallback(async (currentSessionId: string, count: number = 5): Promise<CloudinarySignature[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    const { data, error } = await supabase.functions.invoke('cloudinary-sign-batch', {
      body: JSON.stringify({ sessionId: currentSessionId, count }),
      headers: {
        'content-type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
      }
    });
    
    if (error) throw new Error(error.message || 'Batch signature request failed');
    if (!data?.success) throw new Error('Invalid batch signature response');
    
    return data.data;
  }, []);

  // Get next signature from pool, refill if needed
  const getNextSignature = useCallback(async (currentSessionId: string): Promise<CloudinarySignature> => {
    if (signaturePoolRef.current.length === 0) {
      const newSignatures = await getBatchSignatures(currentSessionId, 5);
      signaturePoolRef.current = newSignatures;
    }
    
    const signature = signaturePoolRef.current.shift();
    if (!signature) {
      throw new Error('No signatures available');
    }
    
    return signature;
  }, [getBatchSignatures]);

  // Smart compression using worker
  const compressFile = useCallback(async (file: File, targetSize: number): Promise<{ blob: Blob; compressionMs: number; passes: number }> => {
    const compressionProfile = getCompressionProfile();
    
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Compression worker not available'));
        return;
      }
      
      const taskId = crypto.randomUUID();
      
      const handleMessage = (e: MessageEvent) => {
        if (e.data.id === taskId) {
          workerRef.current?.removeEventListener('message', handleMessage);
          
          if (e.data.error) {
            reject(new Error(e.data.error));
          } else {
            resolve({
              blob: e.data.blob,
              compressionMs: e.data.compressionMs,
              passes: e.data.passes
            });
          }
        }
      };
      
      workerRef.current.addEventListener('message', handleMessage);
      
      workerRef.current.postMessage({
        id: taskId,
        file,
        baseMaxSide: compressionProfile.maxSide,
        baseQuality: compressionProfile.quality,
        targetSize,
        format: 'webp',
        networkType: networkProfile.type
      });
    });
  }, [getCompressionProfile, networkProfile.type]);

  // Upload to Cloudinary with retry logic
  const uploadToCloudinary = useCallback(async (
    blob: Blob,
    signature: CloudinarySignature,
    onProgress: (progress: number) => void,
    maxRetries: number = 3
  ): Promise<{ url: string; publicId: string; uploadMs: number; retries: number }> => {
    let retries = 0;
    
    const attemptUpload = (): Promise<{ url: string; publicId: string; uploadMs: number }> => {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', blob);
        formData.append('api_key', signature.api_key);
        formData.append('timestamp', signature.timestamp.toString());
        formData.append('folder', signature.folder);
        formData.append('public_id', signature.public_id);
        formData.append('signature', signature.signature);

        const xhr = new XMLHttpRequest();
        const startTime = performance.now();
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        };
        
        xhr.onload = () => {
          const uploadMs = performance.now() - startTime;
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve({
                url: response.secure_url,
                publicId: response.public_id,
                uploadMs: Math.round(uploadMs)
              });
            } catch (error) {
              reject(new Error('Invalid Cloudinary response'));
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        };
        
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.ontimeout = () => reject(new Error('Upload timeout'));
        
        xhr.open('POST', signature.upload_url);
        xhr.timeout = 60000;
        xhr.send(formData);
      });
    };
    
    while (retries <= maxRetries) {
      try {
        const result = await attemptUpload();
        return { ...result, retries };
      } catch (error) {
        retries++;
        if (retries > maxRetries) {
          throw error;
        }
        
        // Exponential backoff with jitter
        const delay = Math.min(1000 * Math.pow(2, retries - 1) + Math.random() * 250, 8000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Max retries exceeded');
  }, []);

  // Main upload function with concurrency control
  const uploadFiles = useCallback(async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    
    setIsUploading(true);
    const currentSessionId = await initSession();
    const newUrls: string[] = [];
    
    // Get compression profile for current network
    const compressionProfile = getCompressionProfile();
    const concurrency = compressionProfile.concurrency;
    
    // Create upload items
    const items: OptimizedUploadItem[] = files.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      file,
      progress: 0,
      status: 'pending',
      metrics: {
        originalBytes: file.size
      }
    }));
    
    setUploadItems(items);

    try {
      // Process uploads with concurrency control
      const processUpload = async (item: OptimizedUploadItem): Promise<void> => {
        const uploadId = item.id;
        activeUploadsRef.current.add(uploadId);
        
        try {
          const startTime = performance.now();
          
          // Step 1: Compress (parallel with signing when possible)
          setUploadItems(prev => prev.map(i => 
            i.id === item.id ? { ...i, status: 'compressing', progress: 5 } : i
          ));
          
          const compressionStartTime = performance.now();
          const compressionPromise = compressFile(item.file, compressionProfile.targetSize);
          
          // Step 2: Get signature (parallel with compression for first files)
          const signingStartTime = performance.now();
          const signaturePromise = getNextSignature(currentSessionId);
          
          // Wait for both compression and signature
          const [compressionResult, signature] = await Promise.all([compressionPromise, signaturePromise]);
          const signingMs = performance.now() - signingStartTime;
          
          // Step 3: Upload
          setUploadItems(prev => prev.map(i => 
            i.id === item.id ? { ...i, status: 'uploading', progress: 20 } : i
          ));

          const uploadResult = await uploadToCloudinary(
            compressionResult.blob,
            signature,
            (progress) => {
              setUploadItems(prev => prev.map(i => 
                i.id === item.id ? { ...i, progress: Math.max(20, progress) } : i
              ));
            }
          );

          const totalMs = performance.now() - startTime;
          
          // Create metrics
          const metrics: UploadMetrics = {
            originalBytes: item.file.size,
            compressedBytes: compressionResult.blob.size,
            uploadMs: uploadResult.uploadMs,
            bytesPerSec: compressionResult.blob.size / (uploadResult.uploadMs / 1000),
            retries: uploadResult.retries,
            compressionMs: compressionResult.compressionMs,
            signingMs: Math.round(signingMs)
          };
          
          // Update network speed meter
          updateFromUpload(metrics);

          // Update to success
          setUploadItems(prev => prev.map(i => 
            i.id === item.id ? { 
              ...i, 
              status: 'success', 
              progress: 100,
              url: uploadResult.url,
              publicId: uploadResult.publicId,
              metrics
            } : i
          ));

          newUrls.push(uploadResult.url);
          
        } catch (error) {
          setUploadItems(prev => prev.map(i => 
            i.id === item.id ? { 
              ...i, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Upload failed'
            } : i
          ));
          
          console.error(`Upload failed for ${item.file.name}:`, error);
        } finally {
          activeUploadsRef.current.delete(uploadId);
        }
      };

      // Process uploads with concurrency limit  
      const chunks = [];
      for (let i = 0; i < items.length; i += concurrency) {
        chunks.push(items.slice(i, i + concurrency));
      }
      
      for (const chunk of chunks) {
        await Promise.all(chunk.map(processUpload));
      }

      // Update staged URLs and save to IndexedDB
      const updatedUrls = [...stagedUrls, ...newUrls];
      setStagedUrls(updatedUrls);
      
      if (newUrls.length > 0) {
        try {
          await stagingDB.saveSession(currentSessionId, updatedUrls);
        } catch (error) {
          console.error('Failed to save to IndexedDB:', error);
        }

        const summary = getPerformanceSummary();
        toast({
          title: "Файлы загружены",
          description: `${newUrls.length}/${files.length} файлов. ${summary ? `Среднее время: ${summary.avgUploadTime}мс` : ''}`,
        });
      }

      if (newUrls.length < files.length) {
        toast({
          title: "Частичная загрузка",
          description: `${files.length - newUrls.length} файлов не удалось загрузить`,
          variant: "destructive",
        });
      }

      return newUrls;
    } catch (error) {
      console.error('Optimized upload failed:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Произошла ошибка при загрузке файлов",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadItems([]), 5000);
    }
  }, [initSession, getNextSignature, compressFile, uploadToCloudinary, getCompressionProfile, stagedUrls, toast, updateFromUpload, getPerformanceSummary]);

  // Attach staged URLs to real order (same as original)
  const attachToOrder = useCallback(async (orderId: string): Promise<void> => {
    if (stagedUrls.length === 0) return;

    const items = stagedUrls.map(url => ({
      url,
      type: 'photo' as const
    }));

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No authentication session found');
    }

    const { data, error } = await supabase.functions.invoke('attach-order-media', {
      body: JSON.stringify({ order_id: orderId, items }),
      headers: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (error) throw new Error('Edge Function call failed: ' + error.message);
    if (!data?.success) throw new Error('Database save failed: ' + (data?.error || 'unknown'));

    setStagedUrls([]);
    if (sessionId) {
      try {
        await stagingDB.clearSession(sessionId);
      } catch (error) {
        console.error('Failed to clear staging session:', error);
      }
    }
  }, [stagedUrls, sessionId]);

  // Remove staged URL (same as original)
  const removeStagedUrl = useCallback(async (url: string) => {
    const updatedUrls = stagedUrls.filter(u => u !== url);
    setStagedUrls(updatedUrls);
    
    if (sessionId) {
      try {
        await stagingDB.saveSession(sessionId, updatedUrls);
      } catch (error) {
        console.error('Failed to update staged URLs:', error);
      }
    }
  }, [stagedUrls, sessionId]);

  // Clear all staged data (same as original)
  const clearStaging = useCallback(async () => {
    setStagedUrls([]);
    setUploadItems([]);
    
    if (sessionId) {
      try {
        await stagingDB.clearSession(sessionId);
      } catch (error) {
        console.error('Failed to clear staging session:', error);
      }
    }
    
    setSessionId(null);
    signaturePoolRef.current = [];
  }, [sessionId]);

  return {
    sessionId,
    stagedUrls,
    uploadItems,
    isUploading,
    networkProfile,
    uploadFiles,
    attachToOrder,
    removeStagedUrl,
    clearStaging,
    initSession,
    getPerformanceSummary
  };
};