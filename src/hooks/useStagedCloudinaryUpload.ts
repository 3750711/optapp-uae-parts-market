import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StagedUploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'compressing' | 'signing' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
  publicId?: string;
  isHeic?: boolean;
  originalSize?: number;
  compressedSize?: number;
  metadata?: {
    width?: number;
    height?: number;
    size?: number;
    mime?: string;
    fallback?: string;
    heic?: boolean;
  };
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
  success: boolean;
  data: CloudinarySignature[];
  count: number;
}

interface CompressionResult {
  ok: boolean;
  blob?: Blob;
  code?: string;
  mime?: string;
  originalSize?: number;
  compressedSize?: number;
  compressionMs?: number;
}

// IndexedDB for storing staged URLs
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

export const useStagedCloudinaryUpload = () => {
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stagedUrls, setStagedUrls] = useState<string[]>([]);
  const [uploadItems, setUploadItems] = useState<StagedUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize session ID and restore from IndexedDB
  const initSession = useCallback(async () => {
    if (sessionId) return sessionId;
    
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    
    try {
      // Try to restore previous session data
      const savedUrls = await stagingDB.getSession(newSessionId);
      if (savedUrls) {
        setStagedUrls(savedUrls);
      }
      
      // Clean up old sessions
      await stagingDB.clearOldSessions();
    } catch (error) {
      console.error('Failed to initialize staging session:', error);
    }
    
    return newSessionId;
  }, [sessionId]);

  // Get batch Cloudinary signatures for staging
  const getBatchSignatures = useCallback(async (currentSessionId: string, count: number): Promise<CloudinarySignature[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    console.log(`🔐 Requesting ${count} Cloudinary signatures for session: ${currentSessionId}`);
    
    const { data, error } = await supabase.functions.invoke('cloudinary-sign-batch', {
      body: JSON.stringify({ sessionId: currentSessionId, count }),
      headers: {
        'content-type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
      }
    });
    
    if (error) {
      console.error('❌ Batch signature request failed:', error);
      throw new Error(error.message || 'Batch signature request failed');
    }
    
    if (!data?.success || !data?.data) {
      console.error('❌ Invalid batch signature response:', data);
      throw new Error('Invalid batch signature response');
    }
    
    const signatures = data.data;
    console.log(`✅ Received ${signatures.length} signatures (requested ${count})`);
    
    // Validate each signature has required fields
    for (let i = 0; i < signatures.length; i++) {
      const sig = signatures[i];
      if (!sig || !sig.api_key || !sig.signature || !sig.timestamp || !sig.public_id) {
        console.error(`❌ Invalid signature at index ${i}:`, sig);
        throw new Error(`Invalid signature data at index ${i}`);
      }
    }
    
    return signatures;
  }, []);

  // Get single Cloudinary signature as fallback
  const getSingleSignature = useCallback(async (currentSessionId: string, publicId?: string): Promise<CloudinarySignature> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    console.log(`🔐 Requesting single Cloudinary signature for session: ${currentSessionId}`);
    
    const { data, error } = await supabase.functions.invoke('cloudinary-sign', {
      body: JSON.stringify({ sessionId: currentSessionId }),
      headers: {
        'content-type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
      }
    });
    
    if (error) {
      console.error('❌ Single signature request failed:', error);
      throw new Error(error.message || 'Single signature request failed');
    }
    
    if (!data?.success || !data?.data) {
      console.error('❌ Invalid single signature response:', data);
      throw new Error('Invalid single signature response');
    }
    
    const signature = data.data;
    if (!signature.api_key || !signature.signature || !signature.timestamp || !signature.public_id) {
      console.error('❌ Invalid single signature data:', signature);
      throw new Error('Invalid single signature data');
    }
    
    console.log(`✅ Received single signature for public_id: ${signature.public_id}`);
    return signature;
  }, []);

  // Compress image in worker with improved API
  const compressInWorker = useCallback(async (file: File): Promise<CompressionResult> => {
    return new Promise((resolve) => {
      let worker: Worker;
      
      try {
        worker = new Worker(
          new URL('../workers/smart-image-compress.worker.js', import.meta.url),
          { type: 'module' }
        );
        console.log('✅ Worker created successfully');
      } catch (workerError) {
        console.error('❌ Failed to create worker:', workerError);
        resolve({ ok: false, code: 'WORKER_CREATION_FAILED' });
        return;
      }
      
      const timeout = setTimeout(() => {
        worker.terminate();
        resolve({ ok: false, code: 'WORKER_TIMEOUT' });
      }, 30000);
      
      worker.onmessage = (e) => {
        clearTimeout(timeout);
        worker.terminate();
        const result = e.data;
        
        if (result.ok) {
          console.log('✅ Worker compression successful:', {
            originalSize: result.original?.size || file.size,
            compressedSize: result.size,
            compressionRatio: result.size ? Math.round((1 - result.size / file.size) * 100) + '%' : 'N/A'
          });
          resolve({
            ok: true,
            blob: result.blob,
            mime: result.mime,
            originalSize: result.original?.size || file.size,
            compressedSize: result.size,
            compressionMs: result.compressionMs
          });
        } else {
          console.warn('⚠️ Worker compression failed:', {
            code: result.code,
            message: result.message,
            fileName: file.name
          });
          resolve({ 
            ok: false, 
            code: result.code || 'COMPRESSION_FAILED',
            originalSize: file.size
          });
        }
      };
      
      worker.onerror = (error) => {
        clearTimeout(timeout);
        worker.terminate();
        console.error('❌ Worker error:', error);
        resolve({ ok: false, code: 'WORKER_ERROR', originalSize: file.size });
      };
      
      // Send compression task with proper API
      try {
        worker.postMessage({
          file,
          maxSide: 1600,
          jpegQuality: 0.82,
          prefer: 'jpeg',
          twoPass: false
        });
      } catch (postError) {
        clearTimeout(timeout);
        worker.terminate();
        console.error('Failed to post message to worker:', postError);
        resolve({ ok: false, code: 'WORKER_POST_FAILED' });
      }
    });
  }, []);

  // Upload to Cloudinary with retry logic
  const uploadToCloudinary = useCallback(async (
    file: File,
    signature: CloudinarySignature,
    onProgress: (progress: number) => void,
    retryCount = 0
  ): Promise<{ url: string; publicId: string }> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signature.api_key);
      formData.append('timestamp', signature.timestamp.toString());
      formData.append('folder', signature.folder);
      formData.append('public_id', signature.public_id);
      formData.append('signature', signature.signature);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              url: response.secure_url,
              publicId: response.public_id
            });
          } catch (error) {
            reject(new Error('Invalid Cloudinary response'));
          }
        } else {
          // Retry logic for temporary failures
          if (retryCount < 2 && (xhr.status >= 500 || xhr.status === 429)) {
            const delay = Math.pow(1.5, retryCount) * 2000;
            setTimeout(() => {
              uploadToCloudinary(file, signature, onProgress, retryCount + 1)
                .then(resolve)
                .catch(reject);
            }, delay);
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        }
      };
      
      xhr.onerror = () => {
        if (retryCount < 2) {
          const delay = Math.pow(1.5, retryCount) * 2000;
          setTimeout(() => {
            uploadToCloudinary(file, signature, onProgress, retryCount + 1)
              .then(resolve)
              .catch(reject);
          }, delay);
        } else {
          reject(new Error('Network error'));
        }
      };
      
      xhr.ontimeout = () => reject(new Error('Upload timeout'));
      
      xhr.open('POST', signature.upload_url);
      xhr.timeout = 120000; // 120 second timeout
      xhr.send(formData);
    });
  }, []);

  // Upload files to staging with optimized architecture
  const uploadFiles = useCallback(async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    
    setIsUploading(true);
    const currentSessionId = await initSession();
    const newUrls: string[] = [];
    
    // Create upload items with HEIC detection
    const items: StagedUploadItem[] = files.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      file,
      progress: 0,
      status: 'pending',
      isHeic: file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic') || 
              file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heif'),
      originalSize: file.size
    }));
    
    setUploadItems(items);

    try {
      // Step 1: Generate stable public IDs for each file
      const stableIds = items.map(item => 
        `product_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      );
      
      // Step 2: Get batch signatures
      let signatures: CloudinarySignature[] = [];
      try {
        signatures = await getBatchSignatures(currentSessionId, files.length);
        
        // Verify we got the expected number of signatures
        if (signatures.length !== files.length) {
          console.warn(`⚠️ Signature count mismatch: expected ${files.length}, got ${signatures.length}`);
          throw new Error(`Signature count mismatch: expected ${files.length}, got ${signatures.length}`);
        }
      } catch (batchError) {
        console.error('❌ Batch signature failed, falling back to individual signatures:', batchError);
        toast({
          title: "Предупреждение",
          description: "Получение подписей пакетом не удалось, переключаемся на индивидуальные запросы",
          variant: "default"
        });
        
        // Fallback to individual signatures
        signatures = [];
        for (let i = 0; i < files.length; i++) {
          try {
            const signature = await getSingleSignature(currentSessionId, stableIds[i]);
            signatures.push(signature);
          } catch (singleError) {
            console.error(`❌ Failed to get signature for file ${i}:`, singleError);
            throw new Error(`Failed to get signature for file ${i}: ${singleError.message}`);
          }
        }
      }
      
      // Create signature map for safe lookup
      const signatureMap = new Map<number, CloudinarySignature>();
      signatures.forEach((sig, index) => {
        if (sig && sig.api_key && sig.signature) {
          signatureMap.set(index, sig);
        }
      });
      
      console.log(`📋 Created signature map with ${signatureMap.size} valid signatures for ${files.length} files`);
      
      // Step 3: Process files with controlled parallelism (max 3 concurrent)
      const uploadWithLimit = async () => {
        const results: string[] = [];
        const inProgress = new Set<Promise<void>>();
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          
          // Wait if we have too many concurrent uploads
          if (inProgress.size >= 3) {
            await Promise.race(inProgress);
          }
          
          const uploadPromise = (async () => {
            try {
              let finalFile = item.file;
              
              // Step 2a: Compress non-HEIC files
              if (!item.isHeic) {
                setUploadItems(prev => prev.map(i => 
                  i.id === item.id ? { ...i, status: 'compressing', progress: 10 } : i
                ));

                try {
                  const compressionResult = await compressInWorker(item.file);
                  
                  if (compressionResult.ok && compressionResult.blob) {
                    // Successfully compressed
                    finalFile = new File([compressionResult.blob], 
                      item.file.name.replace(/\.[^/.]+$/, '.jpg'), 
                      { type: compressionResult.blob.type || 'image/jpeg' });
                    
                    setUploadItems(prev => prev.map(i => 
                      i.id === item.id ? { 
                        ...i, 
                        compressedSize: finalFile.size, 
                        progress: 30,
                        metadata: {
                          width: compressionResult.originalSize,
                          height: compressionResult.compressedSize,
                          size: finalFile.size,
                          mime: compressionResult.mime
                        }
                      } : i
                    ));
                    
                    console.log(`✅ Compressed ${item.file.name}: ${item.file.size} → ${finalFile.size} bytes`);
                    } else {
                      // Compression failed, handle specific errors
                      if (compressionResult.code === 'UNSUPPORTED_HEIC') {
                        console.log('📱 HEIC file detected, uploading original for server conversion');
                        setUploadItems(prev => prev.map(i => 
                          i.id === item.id ? { 
                            ...i, 
                            isHeic: true,
                            metadata: { heic: true }
                          } : i
                        ));
                      } else if (compressionResult.code === 'DECODE_FAILED') {
                        console.warn('🖼️ Image decode failed, uploading original:', item.file.name);
                        setUploadItems(prev => prev.map(i => 
                          i.id === item.id ? { 
                            ...i,
                            metadata: { fallback: 'decode-failed' }
                          } : i
                        ));
                      } else {
                        console.warn('⚠️ Compression failed, uploading original:', {
                          code: compressionResult.code,
                          fileName: item.file.name,
                          fileSize: item.file.size
                        });
                        setUploadItems(prev => prev.map(i => 
                          i.id === item.id ? { 
                            ...i,
                            metadata: { fallback: 'compression-failed' }
                          } : i
                        ));
                      }
                    }
                 } catch (workerError) {
                   console.warn('🔧 Worker compression failed, using original file:', {
                     error: workerError,
                     fileName: item.file.name,
                     fileSize: item.file.size
                   });
                   // Use original file as fallback
                 }
              }

              // Step 2b: Get signature for this file
              let signature = signatureMap.get(i);
              
              if (!signature) {
                console.warn(`⚠️ No signature found for file ${i} (${item.file.name}), requesting fallback signature`);
                setUploadItems(prev => prev.map(it => 
                  it.id === item.id ? { ...it, status: 'signing', progress: 40 } : it
                ));
                
                try {
                  signature = await getSingleSignature(currentSessionId, stableIds[i]);
                  signatureMap.set(i, signature);
                  console.log(`✅ Got fallback signature for file ${i}`);
                } catch (fallbackError) {
                  console.error(`❌ Fallback signature failed for file ${i}:`, fallbackError);
                  throw new Error(`Failed to get signature for ${item.file.name}: ${fallbackError.message}`);
                }
              }
              
              // Validate signature before upload
              if (!signature.api_key || !signature.signature || !signature.timestamp) {
                throw new Error(`Invalid signature data for ${item.file.name}: missing required fields`);
              }

              // Step 2c: Upload
              setUploadItems(prev => prev.map(it => 
                it.id === item.id ? { ...it, status: 'uploading', progress: 50 } : it
              ));

              const result = await uploadToCloudinary(
                finalFile,
                signature,
                (progress) => {
                  const adjustedProgress = 50 + Math.round(progress * 0.5);
                  setUploadItems(prev => prev.map(it => 
                    it.id === item.id ? { ...it, progress: adjustedProgress } : it
                  ));
                }
              );

              // Update to success
              setUploadItems(prev => prev.map(i => 
                i.id === item.id ? { 
                  ...i, 
                  status: 'success', 
                  progress: 100,
                  url: result.url,
                  publicId: result.publicId
                } : i
              ));

              results[i] = result.url;

              // Add to staged URLs and save to IndexedDB
              setStagedUrls(prev => {
                const updated = [...prev, result.url];
                stagingDB.saveSession(currentSessionId, updated);
                return updated;
              });

            } catch (uploadError) {
              console.error(`❌ Upload failed for file ${i} (${item.file.name}):`, uploadError);
              
              setUploadItems(prev => prev.map(it => 
                it.id === item.id ? { 
                  ...it, 
                  status: 'error', 
                  error: uploadError instanceof Error ? uploadError.message : 'Upload failed'
                } : it
              ));
              
              // Add error details for debugging
              if (uploadError instanceof Error) {
                if (uploadError.message.includes('signature')) {
                  console.error(`📋 Signature issue for file ${i}:`, {
                    hasSignature: !!signatureMap.get(i),
                    signatureFields: signatureMap.get(i) ? Object.keys(signatureMap.get(i)!) : 'none',
                    fileName: item.file.name,
                    stableId: stableIds[i]
                  });
                }
              }
            }
          })();
          
          inProgress.add(uploadPromise);
          uploadPromise.finally(() => inProgress.delete(uploadPromise));
        }
        
        // Wait for all uploads to complete
        await Promise.allSettled(Array.from(inProgress));
        return results.filter(Boolean);
      };

      const completedUrls = await uploadWithLimit();
      
      if (completedUrls.length > 0) {
        toast({
          title: "Файлы загружены",
          description: `Загружено ${completedUrls.length} из ${files.length} файлов`,
        });
      }

      if (completedUrls.length < files.length) {
        toast({
          title: "Частичная загрузка",
          description: `${files.length - completedUrls.length} файлов не удалось загрузить`,
          variant: "destructive",
        });
      }

      return completedUrls;
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
  }, [initSession, getBatchSignatures, compressInWorker, uploadToCloudinary, stagedUrls, toast]);

  // Attach staged URLs to real order
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

    // Clear staged data after successful attachment
    setStagedUrls([]);
    if (sessionId) {
      try {
        await stagingDB.clearSession(sessionId);
      } catch (error) {
        console.error('Failed to clear staging session:', error);
      }
    }
  }, [stagedUrls, sessionId]);

  // Remove staged URL
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

  // Clear all staged data
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
  }, [sessionId]);

  return {
    sessionId,
    stagedUrls,
    uploadItems,
    isUploading,
    uploadFiles,
    attachToOrder,
    removeStagedUrl,
    clearStaging,
    initSession
  };
};