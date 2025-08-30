import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { persistentUploadDB } from '@/utils/persistentUploadDB';
import { PersistedUploadItem } from '@/types/uploadTypes';
import { getUploadSessionKey, makeTinyPreviewDataUrl, isHeicFile } from '@/utils/uploadUtils';
import { extractPublicIdFromUrl, getProductImageUrl } from '@/utils/cloudinaryUtils';

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
    networkType?: string;
    quality?: number;
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

export const useStagedCloudinaryUpload = (params?: { userId?: string; scope?: string; scopeId?: string }) => {
  const { toast } = useToast();
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [persistedItems, setPersistedItems] = useState<PersistedUploadItem[]>([]);
  const [uploadItems, setUploadItems] = useState<StagedUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Generate deterministic session key
  const getSessionKey = useCallback(() => {
    if (params?.userId) {
      return getUploadSessionKey({
        userId: params.userId,
        scope: (params.scope as any) || 'new-order',
        scopeId: params.scopeId
      });
    }
    // Fallback for backward compatibility
    const stored = localStorage.getItem('spu:lastSessionKey');
    return stored || `spu:legacy:${crypto.randomUUID()}`;
  }, [params]);

  // Initialize session and restore persisted data
  const initSession = useCallback(async () => {
    if (sessionKey) return sessionKey;
    
    const newSessionKey = getSessionKey();
    setSessionKey(newSessionKey);
    
    try {
      // Try to restore persisted session data
      const saved = await persistentUploadDB.getSession(newSessionKey);
      if (saved?.items) {
        setPersistedItems(saved.items);
        console.log(`✅ Restored ${saved.items.length} persisted items for session: ${newSessionKey}`);
      }
      
      // Clean up old sessions
      await persistentUploadDB.compactOldSessions(24);
      
      // Store current session key for recovery
      localStorage.setItem('spu:lastSessionKey', newSessionKey);
    } catch (error) {
      console.error('Failed to initialize persistent session:', error);
    }
    
    return newSessionKey;
  }, [sessionKey, getSessionKey]);

  // Get batch Cloudinary signatures using public cloudinary-sign function
  const getBatchSignatures = useCallback(async (currentSessionId: string, publicIds: string[]): Promise<CloudinarySignature[]> => {
    console.log(`🔐 Requesting Cloudinary signatures for ${publicIds.length} specific IDs, session: ${currentSessionId}`);
    
    // Use Promise.all to call cloudinary-sign for each publicId in parallel
    const signaturePromises = publicIds.map(async (publicId) => {
      const { data, error } = await supabase.functions.invoke('cloudinary-sign', {
        body: JSON.stringify({ sessionId: currentSessionId }),
        headers: {
          'content-type': 'application/json'
        }
      });
      
      if (error) {
        console.error(`❌ Signature request failed for ${publicId}:`, error);
        throw new Error(error.message || 'Signature request failed');
      }
      
      if (!data?.success || !data?.data) {
        console.error(`❌ Invalid signature response for ${publicId}:`, data);
        throw new Error('Invalid signature response');
      }
      
      return data.data;
    });
    
    const signatures = await Promise.all(signaturePromises);
    console.log(`✅ Received ${signatures.length} signatures (requested ${publicIds.length})`);
    
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

  // Get single Cloudinary signature using public cloudinary-sign function
  const getSingleSignature = useCallback(async (currentSessionId: string, publicId: string): Promise<CloudinarySignature> => {
    console.log(`🔐 Requesting single Cloudinary signature for session: ${currentSessionId}`);
    
    const { data, error } = await supabase.functions.invoke('cloudinary-sign', {
      body: JSON.stringify({ sessionId: currentSessionId }),
      headers: {
        'content-type': 'application/json'
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

  // Compress image in worker with adaptive parameters
  const compressInWorker = useCallback(async (file: File, maxSide = 1600, quality = 0.82): Promise<CompressionResult> => {
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
      
      // Send compression task with adaptive parameters
      try {
        worker.postMessage({
          file,
          maxSide,
          jpegQuality: quality,
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

  // Upload to Edge Function with retry logic
  const uploadToEdgeFunction = useCallback(async (
    file: File,
    publicId: string,
    onProgress: (progress: number) => void,
    retryCount = 0
  ): Promise<{ url: string; publicId: string }> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('customPublicId', publicId);

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
            if (response.success && response.mainImageUrl && response.publicId) {
              resolve({
                url: response.mainImageUrl,
                publicId: response.publicId
              });
            } else {
              reject(new Error(response.error || 'Edge Function upload failed'));
            }
          } catch (error) {
            reject(new Error('Invalid Edge Function response'));
          }
        } else {
          // Enhanced retry logic with exponential backoff and jitter
          if (retryCount < 2 && (xhr.status >= 500 || xhr.status === 429)) {
            const baseDelay = Math.pow(1.5, retryCount) * 1500;
            const jitter = Math.random() * 400;
            const delay = baseDelay + jitter;
            
            console.log(`⏳ Retrying Edge Function upload in ${Math.round(delay)}ms (attempt ${retryCount + 1}/3)`);
            setTimeout(() => {
              uploadToEdgeFunction(file, publicId, onProgress, retryCount + 1)
                .then(resolve)
                .catch(reject);
            }, delay);
          } else {
            reject(new Error(`Edge Function upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        }
      };
      
      xhr.onerror = () => {
        if (retryCount < 2) {
          const baseDelay = Math.pow(1.6, retryCount) * 1500;
          const jitter = Math.random() * 400;
          const delay = baseDelay + jitter;
          
          console.log(`🔄 Network error, retrying Edge Function in ${Math.round(delay)}ms (attempt ${retryCount + 1}/3)`);
          setTimeout(() => {
            uploadToEdgeFunction(file, publicId, onProgress, retryCount + 1)
              .then(resolve)
              .catch(reject);
          }, delay);
        } else {
          reject(new Error('Network error'));
        }
      };
      
      xhr.ontimeout = () => reject(new Error('Edge Function upload timeout'));
      
      xhr.open('POST', `https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/cloudinary-upload`);
      xhr.timeout = 180000; // 3 minute timeout for HEIC processing
      xhr.send(formData);
    });
  }, []);

  // Chunked batch signature function
  const signBatchChunked = useCallback(async (publicIds: string[], currentSessionId: string): Promise<Map<string, CloudinarySignature>> => {
    const CHUNK_SIZE = 8;
    const chunks: string[][] = [];
    
    // Split publicIds into chunks
    for (let i = 0; i < publicIds.length; i += CHUNK_SIZE) {
      chunks.push(publicIds.slice(i, i + CHUNK_SIZE));
    }
    
    console.log(`🔗 Splitting ${publicIds.length} signatures into ${chunks.length} chunks of max ${CHUNK_SIZE}`);
    
    // Process chunks in parallel
    const results = await Promise.allSettled(
      chunks.map(async (chunkIds) => {
        try {
          return await getBatchSignatures(currentSessionId, chunkIds);
        } catch (error) {
          console.warn(`⚠️ Chunk signing failed for ${chunkIds.length} IDs:`, error);
          return [];
        }
      })
    );
    
    // Collect all successful signatures into a Map by public_id
    const signatureMap = new Map<string, CloudinarySignature>();
    for (const result of results) {
      if (result.status === 'fulfilled') {
        for (const sig of result.value) {
          if (sig?.public_id && sig?.signature) {
            signatureMap.set(sig.public_id, sig);
          }
        }
      }
    }
    
    console.log(`✅ Collected ${signatureMap.size}/${publicIds.length} signatures from chunked requests`);
    return signatureMap;
  }, [getBatchSignatures]);

  // Ensure signature function with lazy loading
  const ensureSignature = useCallback(async (publicId: string, currentSessionId: string, signatureMap: Map<string, CloudinarySignature>): Promise<CloudinarySignature> => {
    // Check if we already have this signature
    const existing = signatureMap.get(publicId);
    if (existing) {
      return existing;
    }
    
    // Fetch single signature and cache it
    console.log(`🔐 Lazy-loading signature for publicId: ${publicId}`);
    const signature = await getSingleSignature(currentSessionId, publicId);
    signatureMap.set(publicId, signature);
    return signature;
  }, [getSingleSignature]);

  // Upload files with persistent storage
  const uploadFiles = useCallback(async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    
    setIsUploading(true);
    const currentSessionKey = await initSession();
    const newUrls: string[] = [];
    
    // Network optimization
    const getNetworkType = () => {
      const connection = (navigator as any).connection;
      if (!connection) return '4g';
      return connection.effectiveType || '4g';
    };

    const networkType = getNetworkType();
    const isSlowNetwork = /(2g|slow-2g|3g)/.test(networkType);
    const parallelism = isSlowNetwork ? 2 : 3;
    const quality = isSlowNetwork ? 0.75 : 0.82;
    const maxSide = isSlowNetwork ? 1400 : 1600;

    console.log(`📱 Network: ${networkType}, parallelism: ${parallelism}, quality: ${quality}`);

    try {
      // Create persisted items with previews
      const newPersistedItems: PersistedUploadItem[] = await Promise.all(
        files.map(async (file) => {
          const isHeic = isHeicFile(file);
          let localPreviewDataUrl: string | undefined;
          
          // Generate tiny preview for non-HEIC files
          if (!isHeic) {
            try {
              localPreviewDataUrl = await makeTinyPreviewDataUrl(file);
            } catch (error) {
              console.warn('Failed to create preview for', file.name, error);
            }
          }
          
          const now = Date.now();
          return {
            id: crypto.randomUUID(),
            publicId: `product_${crypto.randomUUID().replace(/-/g, '_')}`,
            status: 'pending' as const,
            progress: 0,
            localPreviewDataUrl,
            isHeic,
            originalName: file.name,
            originalSize: file.size,
            createdAt: now,
            updatedAt: now
          };
        })
      );

      // Update persisted items and save immediately
      const updateItemAndPersist = async (id: string, patch: Partial<PersistedUploadItem>) => {
        setPersistedItems(prev => {
          const next = prev.map(item => 
            item.id === id ? { ...item, ...patch, updatedAt: Date.now() } : item
          );
          // Save to IndexedDB immediately (non-blocking)
          persistentUploadDB.saveSession(currentSessionKey, next).catch(error => 
            console.error('Failed to persist update:', error)
          );
          return next;
        });
      };

      // Add new items to persisted state
      setPersistedItems(prev => {
        const next = [...prev, ...newPersistedItems];
        persistentUploadDB.saveSession(currentSessionKey, next).catch(error => 
          console.error('Failed to persist new items:', error)
        );
        return next;
      });

      // Convert to legacy format for existing pipeline
      const legacyItems: StagedUploadItem[] = newPersistedItems.map(item => ({
        id: item.id,
        file: files.find(f => f.name === item.originalName)!,
        progress: item.progress,
        status: item.status as any,
        publicId: item.publicId,
        isHeic: item.isHeic,
        originalSize: item.originalSize
      }));

      // Append to upload items for processing
      setUploadItems(prev => {
        const existingFiles = new Set(prev.map(item => `${item.file.name}-${item.file.size}`));
        const newItems = legacyItems.filter(item => 
          !existingFiles.has(`${item.file.name}-${item.file.size}`)
        );
        return [...prev, ...newItems];
      });

      // Pre-fetch signatures in chunks
      const signaturePrefetch = signBatchChunked(
        newPersistedItems.map(item => item.publicId), 
        currentSessionKey
      );

      // Run pool for parallel processing
      const runPool = async <T>(concurrency: number, items: T[], processor: (item: T) => Promise<void>) => {
        const promises: Promise<void>[] = [];
        let index = 0;
        
        const worker = async () => {
          while (index < items.length) {
            const currentIndex = index++;
            const item = items[currentIndex];
            try {
              await processor(item);
            } catch (error) {
              console.error(`❌ Pool worker failed for item ${currentIndex}:`, error);
            }
          }
        };
        
        // Start worker promises
        for (let i = 0; i < Math.min(concurrency, items.length); i++) {
          promises.push(worker());
        }
        
        await Promise.all(promises);
      };

      // Get signature map
      const signatureMap = await signaturePrefetch;

      // Process files with adaptive parallelism
      await runPool(parallelism, legacyItems, async (item) => {
        try {
          // For HEIC files, upload directly to Edge Function
          if (item.isHeic) {
            console.log(`📱 Processing HEIC file: ${item.file.name}`);
            
            await updateItemAndPersist(item.id, { status: 'uploading' });
            
            const result = await uploadToEdgeFunction(
              item.file,
              item.publicId!,
              (progress) => {
                updateItemAndPersist(item.id, { progress });
              }
            );
            
            console.log(`✅ HEIC file processed successfully: ${item.file.name} → ${result.url}`);
            
            const publicId = extractPublicIdFromUrl(result.url);
            const cloudinaryThumbUrl = publicId ? getProductImageUrl(publicId, 'thumbnail') : result.url;
            
            await updateItemAndPersist(item.id, { 
              status: 'completed', 
              cloudinaryUrl: result.url,
              cloudinaryThumbUrl,
              progress: 100,
              localPreviewDataUrl: undefined // Clear local preview
            });
            
            newUrls.push(result.url);
            return;
          }

          // Step 1: Compression (for non-HEIC files only)
          const shouldCompress = item.file.size > 300_000;
          let processedFile = item.file;
          
          if (shouldCompress) {
            await updateItemAndPersist(item.id, { status: 'compressing' });
            
            const compressionResult = await compressInWorker(item.file, maxSide, quality);
            if (compressionResult.ok && compressionResult.blob) {
              processedFile = new File(
                [compressionResult.blob], 
                item.file.name.replace(/\.\w+$/i, '.jpg'), 
                { type: 'image/jpeg' }
              );
              await updateItemAndPersist(item.id, { compressedSize: compressionResult.compressedSize });
            }
          }

          // Step 2: Ensure signature
          await updateItemAndPersist(item.id, { status: 'signing' });
          const signature = await ensureSignature(item.publicId!, currentSessionKey, signatureMap);

          // Step 3: Upload
          await updateItemAndPersist(item.id, { status: 'uploading' });
          
          const result = await uploadToEdgeFunction(
            processedFile,
            item.publicId!,
            (progress) => {
              updateItemAndPersist(item.id, { progress });
            }
          );
          
          const publicId = extractPublicIdFromUrl(result.url);
          const cloudinaryThumbUrl = publicId ? getProductImageUrl(publicId, 'thumbnail') : result.url;
          
          await updateItemAndPersist(item.id, { 
            status: 'completed', 
            cloudinaryUrl: result.url,
            cloudinaryThumbUrl,
            progress: 100,
            localPreviewDataUrl: undefined // Clear local preview
          });
          
          newUrls.push(result.url);
          
        } catch (error) {
          console.error(`❌ Upload failed for ${item.file.name}:`, error);
          await updateItemAndPersist(item.id, { 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Upload failed' 
          });
        }
      });
      
      if (newUrls.length > 0) {
        toast({
          title: "Файлы загружены",
          description: `Загружено ${newUrls.length} из ${files.length} файлов`,
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
      console.error('Upload failed:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Произошла ошибка при загрузке файлов",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsUploading(false);
    }
  }, [initSession, signBatchChunked, ensureSignature, compressInWorker, uploadToEdgeFunction, toast]);

  // Legacy compatibility - get staged URLs from persisted items
  const stagedUrls = persistedItems
    .filter(item => item.status === 'completed' && item.cloudinaryUrl)
    .map(item => item.cloudinaryUrl!);

  // Attach staged URLs to real order
  const attachToOrder = useCallback(async (orderId: string): Promise<void> => {
    if (persistedItems.length === 0) return;

    const completedUrls = persistedItems
      .filter(item => item.status === 'completed' && item.cloudinaryUrl)
      .map(item => item.cloudinaryUrl!);

    if (completedUrls.length === 0) return;

    const items = completedUrls.map(url => ({
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

    // Clear persisted data after successful attachment
    if (sessionKey) {
      try {
        await persistentUploadDB.clearSession(sessionKey);
        setPersistedItems([]);
        setUploadItems([]);
      } catch (error) {
        console.error('Failed to clear persistent session:', error);
      }
    }
  }, [persistedItems, sessionKey]);

  // Remove upload item by ID
  const removeUploadItem = useCallback((itemId: string) => {
    setUploadItems(prev => prev.filter(item => item.id !== itemId));
    setPersistedItems(prev => {
      const next = prev.filter(item => item.id !== itemId);
      if (sessionKey) {
        persistentUploadDB.saveSession(sessionKey, next).catch(error => 
          console.error('Failed to persist item removal:', error)
        );
      }
      return next;
    });
  }, [sessionKey]);

  // Remove staged URL
  const removeStagedUrl = useCallback(async (url: string) => {
    setPersistedItems(prev => {
      const next = prev.filter(item => item.cloudinaryUrl !== url);
      if (sessionKey) {
        persistentUploadDB.saveSession(sessionKey, next).catch(error => 
          console.error('Failed to persist URL removal:', error)
        );
      }
      return next;
    });
  }, [sessionKey]);

  // Clear all staged data
  const clearStaging = useCallback(async () => {
    setPersistedItems([]);
    setUploadItems([]);
    
    if (sessionKey) {
      try {
        await persistentUploadDB.clearSession(sessionKey);
      } catch (error) {
        console.error('Failed to clear persistent session:', error);
      }
    }
    
    setSessionKey(null);
  }, [sessionKey]);

  // Restore staged URLs from saved data (for autosave sync)
  const restoreStagedUrls = useCallback(async (urls: string[]) => {
    if (urls.length === 0) return;
    
    const currentSessionKey = await initSession();
    
    try {
      // Migrate URLs to persisted format
      const migratedItems = await persistentUploadDB.migrateFromLegacyUrls(currentSessionKey, urls);
      setPersistedItems(prev => [...prev, ...migratedItems]);
      await persistentUploadDB.saveSession(currentSessionKey, [...persistedItems, ...migratedItems]);
      console.log('✅ Migrated and restored staged URLs from autosave:', urls.length, 'images');
    } catch (error) {
      console.error('❌ Failed to restore URLs to persistent storage:', error);
    }
  }, [initSession, persistedItems]);

  return {
    sessionId: sessionKey, // Backward compatibility
    sessionKey,
    stagedUrls,
    persistedItems,
    uploadItems,
    isUploading,
    uploadFiles,
    attachToOrder,
    removeStagedUrl,
    removeUploadItem,
    clearStaging,
    restoreStagedUrls,
    initSession
  };
};