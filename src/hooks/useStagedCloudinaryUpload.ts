import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logUploadEvent } from '@/utils/uploadLogger';
import { useUploadAbortController } from './useUploadAbortController';
import { useUnifiedUploadErrorHandler } from './useUnifiedUploadErrorHandler';
import { uploadWithSimpleFallback } from '@/utils/simpleCloudinaryFallback';

// Helper functions for new upload path
const getRuntimeConfig = () => {
  try {
    if (typeof window !== 'undefined' && (window as any).runtimeConfig) {
      return (window as any).runtimeConfig;
    }
    return { SUPABASE_URL: 'https://api.partsbay.ae' };
  } catch {
    return { SUPABASE_URL: 'https://api.partsbay.ae' };
  }
};

const getUserToken = async (): Promise<string> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0';
  } catch {
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0';
  }
};

const safeJsonParse = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    console.error('Raw text:', text.substring(0, 500));
    throw new Error('Invalid JSON response');
  }
};

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
  uploadStartTime?: number;
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
  
  // Use unified systems
  const { 
    getSignal, 
    abort: abortUploads,
    isAborted,
    createController 
  } = useUploadAbortController({
    onAbort: () => {
      console.log('🛑 Staged upload aborted via AbortController');
      // Also terminate any active compression workers
      uploadItems.forEach(item => {
        if (item.status === 'compressing') {
          console.log(`Terminating compression for ${item.file.name}`);
        }
      });
    }
  });
  const { handleError, handleMultipleErrors } = useUnifiedUploadErrorHandler();

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

  // Upload to Edge Function with direct fetch and new format
  const uploadToEdgeFunction = useCallback(async (
    file: File,
    publicId: string,
    onProgress: (progress: number) => void,
    signal?: AbortSignal,
    retryCount = 0
  ): Promise<{ url: string; publicId: string }> => {
    // Convert file to base64 for transmission
    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        try {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const result = reader.result as string;
              if (!result || typeof result !== 'string') {
                throw new Error('Failed to read file as string');
              }
              
              // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
              const base64 = result.split(',')[1];
              if (!base64) {
                throw new Error('Invalid base64 data - no comma separator found');
              }
              
              console.log(`📄 File to base64 conversion successful: ${file.name}, base64 length: ${base64.length}`);
              resolve(base64);
            } catch (error) {
              console.error('❌ Error processing FileReader result:', error);
              reject(new Error(`Failed to process file data: ${error instanceof Error ? error.message : 'unknown error'}`));
            }
          };
          reader.onerror = () => {
            console.error('❌ FileReader error:', reader.error);
            reject(new Error('Failed to read file'));
          };
          reader.readAsDataURL(file);
        } catch (error) {
          console.error('❌ Error setting up FileReader:', error);
          reject(new Error(`Failed to setup file reader: ${error instanceof Error ? error.message : 'unknown error'}`));
        }
      });
    };

    // Simulate progress during file processing
    const simulateProgress = () => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5; // Increment by 5-20%
        if (progress >= 95) {
          progress = 95; // Stop at 95% until actual completion
          clearInterval(interval);
        }
        onProgress(Math.min(progress, 95));
      }, 200);
      
      return () => clearInterval(interval);
    };

    try {
      const stopProgress = simulateProgress();
      
      // Convert file to base64
      const fileBase64 = await fileToBase64(file);
      console.log(`📤 File conversion complete: ${file.name}, base64 length: ${fileBase64.length}`);
      
      // Get runtime config and user token
      const config = getRuntimeConfig();
      const userToken = await getUserToken();
      
      // Prepare the request body for new Edge Function format: { base64, name, type, folder }
      const requestBody = {
        base64: fileBase64,
        name: file.name,
        type: file.type || 'application/octet-stream',
        folder: 'products'
      };

      console.log(`📤 Uploading to Edge Function: ${file.name}, size: ${file.size} bytes`);
      
      console.log(`📤 Uploading to Cloudinary via supabase.functions.invoke`);
      console.log(`📝 Request body keys: [${Object.keys(requestBody).join(', ')}]`);

      const { data: response, error: functionError } = await supabase.functions.invoke('cloudinary-upload', {
        body: requestBody,
        signal: signal || getSignal()
      });

      if (functionError) {
        console.error(`❌ Edge function invoke failed:`, functionError);
        throw new Error(`Edge function failed: ${functionError.message}`);
      }

      // Check if request was cancelled
      if ((signal || getSignal())?.aborted) {
        throw new DOMException('Upload cancelled', 'AbortError');
      }

      stopProgress();
      onProgress(100);

      console.log(`📥 Edge function response:`, response);
      const data = response;

      if (!data?.success) {
        console.error('❌ Upload failed:', data);
        throw new Error(data?.error || 'Upload failed');
      }

      console.log(`✅ Edge Function response received:`, {
        success: data?.success,
        hasMainImageUrl: !!data?.mainImageUrl,
        hasPublicId: !!data?.publicId,
        error: data?.error
      });

      if (!data?.success || !data?.mainImageUrl || !data?.publicId) {
        console.error('❌ Invalid Edge Function response:', data);
        throw new Error(data?.error || 'Invalid Edge Function response');
      }

      return {
        url: data.mainImageUrl,
        publicId: data.publicId
      };

    } catch (error) {
      // Use unified error handling
      const uploadError = handleError(error, file.name, 'edge function upload');
      
      // Don't retry for cancelled uploads
      if (uploadError.type === 'abort') {
        throw error;
      }
      
      console.error(`❌ Upload attempt ${retryCount + 1} failed:`, error);
      
      // Enhanced retry logic with exponential backoff and jitter
      if (retryCount < 2) {
        const baseDelay = Math.pow(1.5, retryCount) * 1500;
        const jitter = Math.random() * 400; // 0-400ms jitter
        const delay = baseDelay + jitter;
        
        console.log(`🔄 Retrying Edge Function upload in ${Math.round(delay)}ms (attempt ${retryCount + 1}/3)`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return uploadToEdgeFunction(file, publicId, onProgress, signal, retryCount + 1);
      } else {
        // Edge Function failed after all retries - try simple fallback
        console.log(`🔄 Edge Function failed after 3 attempts, switching to simple Cloudinary fallback for: ${file.name}`);
        
        try {
          const fallbackResult = await uploadWithSimpleFallback(file, {
            onProgress,
            maxRetries: 1, // Simple fallback with minimal retries
            retryDelay: 1000
          });
          
          if (fallbackResult.success && fallbackResult.cloudinaryUrl && fallbackResult.publicId) {
            console.log(`✅ Simple fallback succeeded for: ${file.name} → ${fallbackResult.cloudinaryUrl}`);
            return {
              url: fallbackResult.cloudinaryUrl,
              publicId: fallbackResult.publicId
            };
          } else {
            throw new Error(fallbackResult.error || 'Simple fallback failed');
          }
        } catch (fallbackError) {
          console.error(`❌ Both Edge Function and simple fallback failed for: ${file.name}`, fallbackError);
          throw new Error(`Загрузка не удалась: ${fallbackError instanceof Error ? fallbackError.message : 'все методы испробованы'}`);
        }
      }
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
    if (files.length === 0) return [];
    
    setIsUploading(true);
    createController(); // Create new controller for this upload batch
    
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
                file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heif') ||
                file.type.includes('heic') || file.type.includes('heif'),
        originalSize: file.size,
        uploadStartTime: Date.now()
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
          // For HEIC files, upload directly to Edge Function (handles conversion)
          if (item.isHeic) {
            console.log(`📱 Processing HEIC file: ${item.file.name} (${item.file.type}), size: ${Math.round(item.file.size / 1024)}KB`);
            
            item.status = 'uploading';
            setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, status: item.status } : p));
            
            const result = await uploadToEdgeFunction(
              item.file,
              item.publicId!,
              (progress) => {
                item.progress = progress;
                setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, progress: item.progress } : p));
              },
              getSignal()
            );
            
            console.log(`✅ HEIC file processed successfully: ${item.file.name} → ${result.url}`);
            
            item.status = 'success';
            item.url = result.url;
            item.compressedSize = item.originalSize; // HEIC files are uploaded without compression
            newUrls.push(result.url);
            setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, status: item.status, url: item.url } : p));
            
            // Log successful HEIC upload
            const uploadDuration = item.uploadStartTime ? Date.now() - item.uploadStartTime : 0;
            const compressionRatio = item.compressedSize && item.originalSize ? 
              item.compressedSize / item.originalSize : undefined;
            
            logUploadEvent({
              file_url: result.url,
              method: 'cloudinary-upload',
              duration_ms: uploadDuration,
              status: 'success',
              original_size: item.originalSize,
              compressed_size: item.compressedSize,
              compression_ratio: compressionRatio
            }).catch(error => {
              console.error('🚨 Upload success logging failed for HEIC file:', item.file.name, error);
            });
            
            return; // Exit early for HEIC processing
          }

          // Step 1: Compression (for non-HEIC files only)
          const shouldCompress = item.file.size > 300_000; // Skip files under 300KB
          let processedFile = item.file;
          
          if (shouldCompress) {
            item.status = 'compressing';
            setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, status: item.status } : p));
            
            const compressionResult = await compressInWorker(item.file, maxSide, quality);
            if (compressionResult.ok && compressionResult.blob) {
              // Always create JPEG file for consistency
              processedFile = new File(
                [compressionResult.blob], 
                item.file.name.replace(/\.\w+$/i, '.jpg'), 
                { type: 'image/jpeg' }
              );
              item.compressedSize = compressionResult.compressedSize;
            } else {
              console.warn(`⚠️ Compression failed for ${item.file.name}, using original:`, compressionResult.code);
              item.compressedSize = item.originalSize; // No compression, same size
            }
          } else {
            // Small file, no compression needed
            item.compressedSize = item.originalSize;
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

          // Step 3: Upload with retry (fallback for non-HEIC files)
          item.status = 'uploading';
          setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, status: item.status } : p));
          
          const result = await uploadToEdgeFunction(
            processedFile,
            item.publicId!,
            (progress) => {
              item.progress = progress;
              setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, progress: item.progress } : p));
            },
            getSignal()
          );
          
          item.status = 'success';
          item.url = result.url;
          newUrls.push(result.url);
          setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, status: item.status, url: item.url } : p));
          
          // Log successful upload
          const uploadDuration = item.uploadStartTime ? Date.now() - item.uploadStartTime : 0;
          const compressionRatio = item.compressedSize && item.originalSize ? 
            item.compressedSize / item.originalSize : undefined;
          
          logUploadEvent({
            file_url: result.url,
            method: 'cloudinary-upload',
            duration_ms: uploadDuration,
            status: 'success',
            original_size: item.originalSize,
            compressed_size: item.compressedSize,
            compression_ratio: compressionRatio
          }).catch(error => {
            console.error('🚨 Upload success logging failed for file:', item.file.name, error);
          });
          
        } catch (error) {
          console.error(`❌ Upload failed for ${item.file.name}:`, error);
          item.status = 'error';
          item.error = error instanceof Error ? error.message : 'Upload failed';
          setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, status: item.status, error: item.error } : p));
          
          // Log failed upload
          const uploadDuration = item.uploadStartTime ? Date.now() - item.uploadStartTime : 0;
          
          logUploadEvent({
            file_url: undefined,
            method: 'cloudinary-upload', 
            duration_ms: uploadDuration,
            status: 'error',
            error_details: error instanceof Error ? error.message : 'Upload failed',
            original_size: item.originalSize,
            compressed_size: item.compressedSize
          }).catch(logError => {
            console.error('🚨 Upload error logging failed for file:', item.file.name, logError);
          });
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
      
      // Use unified error handling
      handleError(error, undefined, 'staged upload batch');
      
      return [];
    } finally {
      setIsUploading(false);
      // Don't auto-clear uploadItems to prevent photos from disappearing
      // Items will be managed through UI interactions instead
    }
  }, [createController, initSession, signBatchChunked, ensureSignature, compressInWorker, uploadToEdgeFunction, stagedUrls, handleError, getSignal]);

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

  // Critical: Cleanup on component unmount (navigation)
  useEffect(() => {
    return () => {
      console.log('🛑 Staged upload component unmounting - cancelling uploads');
      abortUploads();
      
      // Terminate any active Web Workers
      uploadItems.forEach(item => {
        if (item.status === 'compressing') {
          console.log(`Terminating compression for ${item.file.name}`);
        }
      });
    };
  }, []); // Empty dependency array - only on mount/unmount

  // Restore staged URLs from saved data (for autosave sync)
  const restoreStagedUrls = useCallback(async (urls: string[]) => {
    if (urls.length === 0) return;
    
    const currentSessionId = await initSession();
    setStagedUrls(urls);
    
    try {
      await stagingDB.saveSession(currentSessionId, urls);
      console.log('✅ Restored staged URLs from autosave:', urls.length, 'images');
    } catch (error) {
      console.error('❌ Failed to save restored URLs to IndexedDB:', error);
    }
  }, [initSession]);

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
    restoreStagedUrls,
    initSession
  };
};