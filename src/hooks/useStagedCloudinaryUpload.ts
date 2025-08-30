import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { uploadViaEdgeFunction } from './uploadViaEdgeFunction';
import { useToast } from '@/hooks/use-toast';
import { useHeicWorkerManager } from './useHeicWorkerManager';

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
  wasHeicConverted?: boolean;
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
  wasHeicConverted?: boolean;
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
  const { convertHeicFile, isWorkerReady } = useHeicWorkerManager();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stagedUrls, setStagedUrls] = useState<string[]>([]);
  const [uploadItems, setUploadItems] = useState<StagedUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Try HEIC worker conversion with proper error handling
  const tryHeicWorkerConversion = useCallback(async (
    file: File, 
    maxSide: number, 
    quality: number, 
    fileId: string
  ): Promise<CompressionResult> => {
    try {
      console.log('🤖 HEIC Worker: Attempting conversion', { fileId, isReady: isWorkerReady() });
      
      const result = await convertHeicFile(file, maxSide, quality);
      
      if (result.ok && result.blob) {
        console.log('✅ HEIC Worker: Conversion successful', {
          fileId,
          originalSize: file.size,
          convertedSize: result.blob.size,
          compressionRatio: Math.round((1 - result.blob.size / file.size) * 100) + '%'
        });
        
        return {
          ok: true,
          blob: result.blob,
          mime: result.mime || 'image/jpeg',
          originalSize: file.size,
          compressedSize: result.blob.size,
          wasHeicConverted: true
        };
      } else {
        console.warn('⚠️ HEIC Worker: Conversion failed', {
          fileId,
          code: result.code,
          message: result.message
        });
        
        return { 
          ok: false, 
          code: result.code || 'HEIC_WORKER_FAILED',
          originalSize: file.size 
        };
      }
    } catch (error) {
      console.error('💥 HEIC Worker: Exception during conversion', { fileId, error });
      return { 
        ok: false, 
        code: 'HEIC_WORKER_EXCEPTION',
        originalSize: file.size 
      };
    }
  }, [convertHeicFile, isWorkerReady]);

  // Load existing session data on mount
  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const savedUrls = await stagingDB.getSession(sessionId);
      if (savedUrls && savedUrls.length > 0) {
        console.log('🔄 Restoring staged URLs from IndexedDB:', { count: savedUrls.length, sessionId });
        setStagedUrls(savedUrls);
      }
    } catch (error) {
      console.error('Failed to load staging session:', error);
    }
  }, []);

  // Initialize session ID and restore from IndexedDB
  const initSession = useCallback(async () => {
    if (sessionId) return sessionId;
    
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    
    try {
      // Clean up old sessions first
      await stagingDB.clearOldSessions();
      
      // CRITICAL FIX: Load existing session data after setting session ID
      await loadSession(newSessionId);
      
      console.log('🔄 Session initialized and data restored:', { sessionId: newSessionId });
    } catch (error) {
      console.error('Failed to initialize staging session:', error);
    }
    
    return newSessionId;
  }, [sessionId, loadSession]);

  // Initialize session and load data on mount
  useEffect(() => {
    const initAndLoad = async () => {
      const currentSessionId = await initSession();
      await loadSession(currentSessionId);
    };
    
    initAndLoad();
  }, []);

  // Get batch Cloudinary signatures for staging with publicIds
  const getBatchSignatures = useCallback(async (currentSessionId: string, publicIds: string[]): Promise<CloudinarySignature[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    console.log(`🔐 Requesting Cloudinary signatures for ${publicIds.length} specific IDs, session: ${currentSessionId}`);
    
    const { data, error } = await supabase.functions.invoke('cloudinary-sign-batch', {
      body: JSON.stringify({ sessionId: currentSessionId, publicIds }),
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

  // Get single Cloudinary signature as fallback
  const getSingleSignature = useCallback(async (currentSessionId: string, publicId: string): Promise<CloudinarySignature> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    console.log(`🔐 Requesting single Cloudinary signature for session: ${currentSessionId}`);
    
    const { data, error } = await supabase.functions.invoke('cloudinary-sign-batch', {
      body: JSON.stringify({ sessionId: currentSessionId, publicIds: [publicId] }),
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
    
    const signatures = data.data;
    if (!signatures || signatures.length === 0) {
      console.error('❌ No signature received in response');
      throw new Error('No signature received');
    }
    
    const signature = signatures[0];
    if (!signature.api_key || !signature.signature || !signature.timestamp || !signature.public_id) {
      console.error('❌ Invalid single signature data:', signature);
      throw new Error('Invalid single signature data');
    }
    
    console.log(`✅ Received single signature for public_id: ${signature.public_id}`);
    return signature;
  }, []);

  // Convert HEIC via Edge Function fallback
  const convertHeicViaEdgeFunction = useCallback(async (file: File, quality = 0.82, maxSide = 1600): Promise<CompressionResult> => {
    try {
      console.log('🌐 HEIC Edge Conversion: Starting server-side conversion', {
        fileName: file.name,
        fileSize: file.size,
        quality,
        maxSide
      });

      // Convert file to base64
      const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = error => reject(error);
        });
      };

      const fileData = await fileToBase64(file);
      
      const { data, error } = await supabase.functions.invoke('convert-heic', {
        body: {
          fileData,
          fileName: file.name,
          quality,
          maxSide
        }
      });

      if (error) {
        console.error('❌ HEIC Edge Conversion: Error:', error);
        throw new Error(error.message || 'Edge Function conversion failed');
      }

      if (!data?.success || !data?.data) {
        console.error('❌ HEIC Edge Conversion: Invalid response:', data);
        throw new Error(data?.error || 'Invalid conversion response');
      }

      // Convert base64 back to blob
      const binaryString = atob(data.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const convertedBlob = new Blob([bytes], { type: 'image/jpeg' });

      console.log('✅ HEIC Edge Conversion: Success', {
        originalSize: data.originalSize,
        convertedSize: data.convertedSize,
        compressionRatio: Math.round((1 - data.convertedSize / data.originalSize) * 100) + '%'
      });

      return {
        ok: true,
        blob: convertedBlob,
        mime: 'image/jpeg',
        originalSize: data.originalSize,
        compressedSize: data.convertedSize,
        wasHeicConverted: true
      };
    } catch (error) {
      console.error('💥 HEIC Edge Conversion: Failed:', error);
      return { 
        ok: false, 
        code: 'HEIC_EDGE_CONVERSION_FAILED',
        originalSize: file.size
      };
    }
  }, []);

  // Compress image in worker with adaptive parameters and HEIC handling
  const compressInWorker = useCallback(async (file: File, maxSide = 1600, quality = 0.82, enableHeicWasm = true): Promise<CompressionResult> => {
    const fileId = Math.random().toString(36).slice(2, 8);
    const isHeicFile = /\.(heic|heif)$/i.test(file.name) || /image\/(heic|heif)/i.test(file.type);
    
    console.log('🎯 UI Upload: Starting compression', {
      fileId,
      fileName: file.name,
      fileSize: file.size,
      isHeicFile,
      heicWasmEnabled: enableHeicWasm,
      compressionParams: { maxSide, quality }
    });

    // For HEIC files, try worker first, then Edge Function fallback
    if (isHeicFile && enableHeicWasm) {
      console.log('📱 HEIC Processing: Attempting worker conversion first...');
      
      const workerResult = await tryHeicWorkerConversion(file, maxSide, quality, fileId);
      if (workerResult.ok) {
        return workerResult;
      }
      
      console.log('⚠️ HEIC Processing: Worker failed, trying Edge Function fallback...');
      const edgeResult = await convertHeicViaEdgeFunction(file, quality, maxSide);
      if (edgeResult.ok) {
        return edgeResult;
      }
      
      console.error('💥 HEIC Processing: Both worker and Edge Function failed');
      return { ok: false, code: 'HEIC_ALL_METHODS_FAILED', originalSize: file.size };
    }
    
    // For HEIC files with WASM disabled, go straight to Edge Function
    if (isHeicFile && !enableHeicWasm) {
      console.log('🌐 HEIC Processing: WASM disabled, using Edge Function...');
      return convertHeicViaEdgeFunction(file, quality, maxSide);
    }
    
    // Regular image compression for non-HEIC files
    return new Promise((resolve) => {
      let worker: Worker;
      
      try {
        worker = new Worker(
          new URL('../workers/smart-image-compress.worker.js', import.meta.url),
          { type: 'module' }
        );
        console.log('✅ UI Upload: Worker created successfully for file', fileId);
      } catch (workerError) {
        console.error('❌ UI Upload: Failed to create worker for file', fileId, workerError);
        resolve({ ok: false, code: 'WORKER_CREATION_FAILED' });
        return;
      }
      
      const timeout = setTimeout(() => {
        worker.terminate();
        resolve({ ok: false, code: 'WORKER_TIMEOUT' });
      }, 30000); // 30s for regular image compression
      
      worker.onmessage = (e) => {
        clearTimeout(timeout);
        worker.terminate();
        const result = e.data;
        
        if (result.ok) {
          console.log('🎉 UI Upload: Compression successful', {
            fileId,
            originalSize: result.original?.size || file.size,
            compressedSize: result.size,
            compressionRatio: result.size ? Math.round((1 - result.size / file.size) * 100) + '%' : 'N/A',
            wasHeicConverted: result.wasHeicConverted,
            isHeicFile,
            finalMime: result.mime
          });
          resolve({
            ok: true,
            blob: result.blob,
            mime: result.mime,
            originalSize: result.original?.size || file.size,
            compressedSize: result.size,
            compressionMs: result.compressionMs,
            wasHeicConverted: result.wasHeicConverted
          });
        } else {
          console.warn('⚠️ UI Upload: Compression failed', {
            fileId,
            fileName: file.name,
            code: result.code,
            message: result.message,
            wasHeicAttempt: isHeicFile
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
        console.error('💥 UI Upload: Worker error', {
          fileId,
          fileName: file.name,
          error,
          wasHeicAttempt: isHeicFile
        });
        resolve({ ok: false, code: 'WORKER_ERROR', originalSize: file.size });
      };
      
      // Send compression task for regular images
      console.log('📤 UI Upload: Sending compression task to worker', { fileId });
      
      try {
        worker.postMessage({
          file,
          maxSide,
          jpegQuality: quality,
          prefer: 'jpeg',
          twoPass: false,
          enableHeicWasm: false // Always false for regular compression
        });
      } catch (postError) {
        clearTimeout(timeout);
        worker.terminate();
        console.error('💥 UI Upload: Failed to post message to worker', {
          fileId,
          error: postError
        });
        resolve({ ok: false, code: 'WORKER_POST_FAILED' });
      }
    });
  }, []);

  // Upload to Cloudinary via Edge Function (unified approach to avoid CORS)
  const uploadToCloudinary = useCallback(async (
    file: File,
    signature: CloudinarySignature,
    onProgress: (progress: number) => void,
    wasHeicConverted: boolean = false,
    retryCount = 0
  ): Promise<{ url: string; publicId: string }> => {
    try {
      console.log('📤 Uploading via Edge Function:', {
        fileName: file.name,
        fileSize: file.size,
        publicId: signature.public_id,
        wasHeicConverted
      });

      // Convert file to base64
      const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = error => reject(error);
        });
      };

      const fileData = await fileToBase64(file);
      onProgress(10);

      console.log('☁️ Calling cloudinary-upload Edge Function...');
      
      const { data, error } = await supabase.functions.invoke('cloudinary-upload', {
        body: { 
          fileData,
          fileName: file.name,
          customPublicId: signature.public_id
        }
      });

      onProgress(90);

      if (error) {
        console.error('❌ Edge Function error:', error);
        throw new Error(error.message || 'Failed to upload via Edge Function');
      }

      if (data?.success && data?.mainImageUrl) {
        console.log('✅ Edge Function upload SUCCESS:', {
          publicId: data.publicId,
          url: data.mainImageUrl
        });
        
        onProgress(100);
        
        return {
          url: data.mainImageUrl,
          publicId: data.publicId || signature.public_id
        };
      } else {
        console.error('❌ Edge Function upload failed:', data?.error);
        throw new Error(data?.error || 'Unknown error occurred in Edge Function');
      }
    } catch (error) {
      console.error('💥 Exception in uploadToCloudinary:', error);
      
      // Retry logic with exponential backoff
      if (retryCount < 2) {
        const baseDelay = Math.pow(1.5, retryCount) * 1500;
        const jitter = Math.random() * 400;
        const delay = baseDelay + jitter;
        
        console.log(`🔄 Retrying upload in ${Math.round(delay)}ms (attempt ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return uploadToCloudinary(file, signature, onProgress, wasHeicConverted, retryCount + 1);
      }
      
      throw new Error(error instanceof Error ? error.message : 'Upload failed');
    }
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

  // Upload files to staging with optimized architecture
  const uploadFiles = useCallback(async (files: File[]): Promise<string[]> => {
    console.log('📸 useStagedCloudinaryUpload: uploadFiles called', { 
      fileCount: files?.length || 0,
      files: files?.map(f => ({ name: f.name, type: f.type, size: f.size }))
    });
    
    if (files.length === 0) return [];
    
    setIsUploading(true);
    const currentSessionId = await initSession();
    const newUrls: string[] = [];
    
    // Detect network condition for adaptive optimization
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

    // Create upload items with stable UUID-based public IDs and HEIC detection
    const items: StagedUploadItem[] = files.map((file) => {
      const publicId = `product_${crypto.randomUUID().replace(/-/g, '_')}`;
      return {
        id: crypto.randomUUID(), // Different from publicId for internal tracking
        file,
        progress: 0,
        status: 'pending',
        publicId, // Store the stable publicId for signing
        isHeic: file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic') || 
                file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heif'),
        originalSize: file.size
      };
    });
    
    // Append new items to existing ones, avoiding duplicates based on file name and size
    setUploadItems(prev => {
      const existingFiles = new Set(prev.map(item => `${item.file.name}-${item.file.size}`));
      const newItems = items.filter(item => 
        !existingFiles.has(`${item.file.name}-${item.file.size}`)
      );
      return [...prev, ...newItems];
    });

    try {
      // Pre-fetch signatures in chunks (don't await - start parallel with compression)
      const signaturePrefetch = signBatchChunked(
        items.map(item => item.publicId!), 
        currentSessionId
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

      // Get signature map (this should complete quickly due to chunking)
      const signatureMap = await signaturePrefetch;

      // Process files with adaptive parallelism
      await runPool(parallelism, items, async (item) => {
        try {
            // Step 1: Compression and HEIC conversion
            // HEIC files MUST always be processed for conversion, regardless of size
            const shouldCompress = item.isHeic || item.file.size > 300_000;
            let processedFile = item.file;
            
            // Enhanced HEIC detection and logging
            if (item.isHeic || /heic|heif/i.test(item.file.type) || /\.hei[cf]$/i.test(item.file.name)) {
              console.log(`🔄 HEIC Processing [${Date.now()}]: Файл HEIC обнаружен`, {
                fileName: item.file.name,
                fileSize: `${Math.round(item.file.size / 1024)}KB`,
                fileType: item.file.type,
                status: 'Начинается конвертация в JPEG...'
              });
            }
            
            if (shouldCompress) {
            item.status = 'compressing';
            setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, status: item.status } : p));
            
            const compressionResult = await compressInWorker(item.file, maxSide, quality, true);
            if (compressionResult.ok && compressionResult.blob) {
              // Always create JPEG file for consistency
              processedFile = new File(
                [compressionResult.blob], 
                item.file.name.replace(/\.\w+$/i, '.jpg'), 
                { type: 'image/jpeg' }
              );
              item.compressedSize = compressionResult.compressedSize;
              // Track if this was converted from HEIC
              item.wasHeicConverted = compressionResult.wasHeicConverted;
              
              // Enhanced HEIC success logging
              if (item.isHeic && compressionResult.wasHeicConverted) {
                console.log(`✅ HEIC Processing [${Date.now()}]: Успешная конвертация HEIC → JPEG`, {
                  fileName: item.file.name,
                  originalSize: `${Math.round(item.file.size / 1024)}KB`,
                  convertedSize: `${Math.round(compressionResult.compressedSize || 0 / 1024)}KB`,
                  compressionRatio: `${Math.round((1 - (compressionResult.compressedSize || 0) / item.file.size) * 100)}% сжатие`
                });
              }
            } else if (item.isHeic && compressionResult.code?.includes('HEIC')) {
              // Add HEIC fallback: if conversion fails, try to upload original file
              console.warn('🔄 HEIC conversion failed, trying original file upload', {
                fileName: item.file.name,
                error: compressionResult.code
              });
              
              toast({
                title: "Внимание",
                description: `HEIC файл ${item.file.name} будет загружен без конвертации`,
                variant: "destructive",
              });
              
              // Keep original file but warn user
              item.compressedSize = item.file.size;
              item.wasHeicConverted = false;
            } else {
              // Enhanced error logging for other compression failures
              console.warn(`⚠️ Compression failed for ${item.file.name}, using original:`, compressionResult.code);
              item.compressedSize = item.file.size;
            }
          }

          // Step 2: Ensure signature
          item.status = 'signing';
          setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, status: item.status } : p));
          
          const signature = await ensureSignature(item.publicId!, currentSessionId, signatureMap);
          
          // Validate signature
          const requiredFields = ['api_key', 'timestamp', 'signature', 'upload_url', 'cloud_name', 'public_id'];
          for (const field of requiredFields) {
            if (!(field in signature)) {
              throw new Error(`Signature missing required field: ${field}`);
            }
          }

          // Step 3: Upload with retry
          item.status = 'uploading';
          setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, status: item.status } : p));
          
          const result = await uploadToCloudinary(
            processedFile,
            signature,
            (progress) => {
              item.progress = progress;
              setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, progress: item.progress } : p));
            },
            item.wasHeicConverted
          );
          
          item.status = 'success';
          item.url = result.url;
          newUrls.push(result.url);
          setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, status: item.status, url: item.url } : p));
          
        } catch (error) {
          console.error(`❌ Upload failed for ${item.file.name}:`, error);
          item.status = 'error';
          item.error = error instanceof Error ? error.message : 'Upload failed';
          setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, status: item.status, error: item.error } : p));
        }
      });

      // Add to staged URLs and save to IndexedDB
      setStagedUrls(prev => {
        const updated = [...prev, ...newUrls];
        stagingDB.saveSession(currentSessionId, updated);
        return updated;
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
      console.error('Optimized upload failed:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Произошла ошибка при загрузке файлов",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsUploading(false);
      // Don't auto-clear uploadItems to prevent photos from disappearing
      // Items will be managed through UI interactions instead
    }
  }, [initSession, signBatchChunked, ensureSignature, compressInWorker, uploadToCloudinary, stagedUrls, toast]);

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

  // Remove upload item by ID
  const removeUploadItem = useCallback((itemId: string) => {
    setUploadItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

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
    removeUploadItem,
    clearStaging,
    initSession
  };
};