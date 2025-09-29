import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logUploadEvent } from '@/utils/uploadLogger';
import { useUploadAbortController } from './useUploadAbortController';
import { useUnifiedUploadErrorHandler } from './useUnifiedUploadErrorHandler';
import { uploadWithSimpleFallback } from '@/utils/simpleCloudinaryFallback';
import { ErrorRecoveryManager } from '@/utils/errorRecovery';
import { 
  getWorker, 
  preWarm, 
  isWorkerReady, 
  isFirstFileInSession, 
  markFirstFileProcessed,
  terminate 
} from '@/workers/uploadWorker.singleton';

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
    if (!session?.access_token) {
      throw new Error('Authentication required - please log in');
    }
    return session.access_token;
  } catch (error) {
    console.error('Failed to get user token:', error);
    throw new Error('Authentication required - please log in');
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
  originalFile: File; // Always preserve the original file for EXIF processing
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

// REMOVED: BatchSignResponse interface (no longer used after removing batch signatures)

interface CompressionResult {
  ok: boolean;
  blob?: Blob;
  code?: string;
  mime?: string;
  originalSize?: number;
  compressedSize?: number;
  compressionMs?: number;
}

// IndexedDB for storing staged URLs with limits
const DB_NAME = 'StagedUploads';
const DB_VERSION = 2; // Increased for new limits
const STORE_NAME = 'sessions';

// Storage limits to prevent device overload
const MAX_SESSIONS = 50; // Maximum sessions stored
const MAX_URLS_PER_SESSION = 100; // Maximum URLs per session
const MAX_TOTAL_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB total limit

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
        
        // Clear old version data for clean upgrade
        if (db.objectStoreNames.contains(STORE_NAME)) {
          db.deleteObjectStore(STORE_NAME);
        }
        
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'sessionId' });
        store.createIndex('createdAt', 'createdAt');
        store.createIndex('size', 'size'); // Track storage size
      };
    });
  }

  // Calculate estimated storage size
  private calculateStorageSize(urls: string[]): number {
    return JSON.stringify(urls).length * 2; // Rough estimate: 2 bytes per char
  }

  async saveSession(sessionId: string, urls: string[]): Promise<void> {
    if (!this.db) await this.init();
    
    // Enforce URL limit per session
    const limitedUrls = urls.length > MAX_URLS_PER_SESSION 
      ? urls.slice(-MAX_URLS_PER_SESSION) 
      : urls;
    
    if (limitedUrls.length !== urls.length) {
      console.warn(`🚨 Session ${sessionId}: URL limit exceeded, keeping latest ${MAX_URLS_PER_SESSION} URLs`);
    }
    
    const size = this.calculateStorageSize(limitedUrls);
    
    return new Promise(async (resolve, reject) => {
      try {
        // Check and enforce storage limits before saving
        await this.enforceStorageLimits(size);
        
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const data = {
          sessionId,
          urls: limitedUrls,
          createdAt: Date.now(),
          size
        };
        
        const request = store.put(data);
        request.onsuccess = () => {
          console.log(`💾 Session saved: ${sessionId} (${limitedUrls.length} URLs, ${Math.round(size/1024)}KB)`);
          resolve();
        };
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Enforce storage limits by removing old sessions
  private async enforceStorageLimits(newSize: number): Promise<void> {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('createdAt');
      
      // Get all sessions ordered by creation time (oldest first)
      const request = index.openCursor();
      const sessions: { sessionId: string; createdAt: number; size: number }[] = [];
      let totalSize = 0;
      let totalCount = 0;
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const data = cursor.value;
          sessions.push(data);
          totalSize += data.size || 0;
          totalCount++;
          cursor.continue();
        } else {
          // Now enforce limits
          const futureSize = totalSize + newSize;
          const futureCount = totalCount + 1;
          
          // Remove sessions if we exceed limits
          let sessionsToRemove = 0;
          if (futureCount > MAX_SESSIONS) {
            sessionsToRemove = Math.max(sessionsToRemove, futureCount - MAX_SESSIONS);
          }
          if (futureSize > MAX_TOTAL_STORAGE_SIZE) {
            // Remove oldest sessions until we're under size limit
            let sizeSoFar = futureSize;
            let removeCount = 0;
            for (const session of sessions) {
              if (sizeSoFar <= MAX_TOTAL_STORAGE_SIZE) break;
              sizeSoFar -= session.size || 0;
              removeCount++;
            }
            sessionsToRemove = Math.max(sessionsToRemove, removeCount);
          }
          
          if (sessionsToRemove > 0) {
            console.warn(`🚨 Storage limits: removing ${sessionsToRemove} old sessions (count: ${totalCount}/${MAX_SESSIONS}, size: ${Math.round(totalSize/1024)}KB/${Math.round(MAX_TOTAL_STORAGE_SIZE/1024)}KB)`);
            
            // Remove oldest sessions
            const removePromises = sessions.slice(0, sessionsToRemove).map(session => 
              this.clearSession(session.sessionId)
            );
            
            Promise.all(removePromises)
              .then(() => resolve())
              .catch(reject);
          } else {
            resolve();
          }
        }
      };
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
      let removedCount = 0;
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          removedCount++;
          cursor.continue();
        } else {
          if (removedCount > 0) {
            console.log(`🧹 Cleaned ${removedCount} old sessions (>24h)`);
          }
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Get current storage stats
  async getStorageStats(): Promise<{ sessionCount: number; totalSize: number; avgSessionSize: number }> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();
      
      let sessionCount = 0;
      let totalSize = 0;
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          sessionCount++;
          totalSize += cursor.value.size || 0;
          cursor.continue();
        } else {
          resolve({
            sessionCount,
            totalSize,
            avgSessionSize: sessionCount > 0 ? totalSize / sessionCount : 0
          });
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
  
  // Enhanced error recovery manager
  const errorRecoveryRef = useRef(new ErrorRecoveryManager());
  
  // Performance optimization refs
  const batchedUpdatesRef = useRef<Map<string, number>>(new Map());
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Batch updates to prevent excessive re-renders
  const updateItemProgress = useCallback((id: string, progress: number) => {
    batchedUpdatesRef.current.set(id, progress);
    
    if (!updateTimeoutRef.current) {
      updateTimeoutRef.current = setTimeout(() => {
        const updates = new Map(batchedUpdatesRef.current);
        batchedUpdatesRef.current.clear();
        updateTimeoutRef.current = null;
        
        setUploadItems(prev => prev.map(item => {
          const newProgress = updates.get(item.id);
          return newProgress !== undefined ? { ...item, progress: newProgress } : item;
        }));
      }, 16); // ~60fps batching
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);
  
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

  // REMOVED: Batch signature functions (were causing 403 errors)
  // - getBatchSignatures (debounced wrapper)
  // - getBatchSignaturesInternal (actual batch request) 
  // - flushSignatureQueue (queue management)
  // Now using individual signatures only for faster, more reliable uploads

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

  // Compress image in worker with reliable memory management and shared worker
  const compressInWorker = useCallback(async (file: File, maxSide = 1600, quality = 0.82, isFirstFile = false): Promise<CompressionResult> => {
    return new Promise(async (resolve) => {
      let timeout: NodeJS.Timeout | null = null;
      let isResolved = false;
      
      // Safe resolve function to prevent double resolution
      const safeResolve = (result: CompressionResult) => {
        if (isResolved) return;
        isResolved = true;
        
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        
        resolve(result);
      };
      
      // ✅ Check worker readiness first
      if (!isWorkerReady()) {
        console.warn('⚠️ Worker not ready, waiting...');
        
        // Wait for readiness up to 3 seconds
        let waited = 0;
        while (!isWorkerReady() && waited < 3000) {
          await new Promise(r => setTimeout(r, 100));
          waited += 100;
        }
        
        if (!isWorkerReady()) {
          console.error('❌ Worker still not ready after 3s');
          safeResolve({ ok: false, code: 'WORKER_NOT_READY', originalSize: file.size });
          return;
        }
      }

      const worker = getWorker();
      if (!worker) {
        console.error('❌ Failed to get shared worker');
        safeResolve({ ok: false, code: 'WORKER_CREATION_FAILED', originalSize: file.size });
        return;
      }

      // Dynamic timeout based on whether this is the first file 
      const timeoutMs = isFirstFile ? 45000 : 30000; // 45s for first file, 30s for others
      
      // Set timeout with cleanup
      timeout = setTimeout(() => {
        console.warn(`⏰ Worker timeout for: ${file.name} (${isFirstFile ? 'first file' : 'regular file'}: ${timeoutMs}ms)`);
        safeResolve({ ok: false, code: 'WORKER_TIMEOUT', originalSize: file.size });
      }, timeoutMs);
      
      // Enhanced message handler with error boundaries and taskId handling
      worker.onmessage = (e) => {
        try {
          const result = e.data;
          
          // Handle different message types from worker
          if (result.type === 'success' && result.result) {
            const data = result.result;
            console.log('✅ Worker compression successful:', {
              file: file.name,
              originalSize: data.originalSize,
              compressedSize: data.compressedSize,
              compressionRatio: data.compressionRatio + '%',
              duration: data.compressionMs ? `${data.compressionMs}ms` : 'unknown'
            });
            
            safeResolve({
              ok: true,
              blob: data.compressedFile,
              mime: 'image/jpeg',
              originalSize: data.originalSize,
              compressedSize: data.compressedSize,
              compressionMs: data.compressionMs
            });
          } else if (result.type === 'error') {
            console.warn('⚠️ Worker compression failed:', {
              file: file.name,
              error: result.error
            });
            
            safeResolve({ 
              ok: false, 
              code: 'COMPRESSION_FAILED',
              originalSize: file.size
            });
          } else if (result.type === 'aborted') {
            console.log('🛑 Worker compression aborted:', file.name);
            
            safeResolve({
              ok: false,
              code: 'COMPRESSION_ABORTED', 
              originalSize: file.size
            });
          } else if (result && result.ok) {
            // Legacy format support
            console.log('✅ Worker compression successful (legacy):', {
              file: file.name,
              originalSize: result.original?.size || file.size,
              compressedSize: result.size,
              compressionRatio: result.size ? Math.round((1 - result.size / file.size) * 100) + '%' : 'N/A',
              duration: result.compressionMs ? `${result.compressionMs}ms` : 'unknown'
            });
            
            safeResolve({
              ok: true,
              blob: result.blob,
              mime: result.mime || 'image/jpeg',
              originalSize: result.original?.size || file.size,
              compressedSize: result.size,
              compressionMs: result.compressionMs
            });
          } else {
            console.warn('⚠️ Worker compression failed (unknown format):', {
              file: file.name,
              result
            });
            
            safeResolve({ 
              ok: false, 
              code: 'COMPRESSION_FAILED',
              originalSize: file.size
            });
          }
        } catch (messageError) {
          console.error('❌ Error processing worker message:', messageError);
          safeResolve({ 
            ok: false, 
            code: 'MESSAGE_PROCESSING_ERROR',
            originalSize: file.size
          });
        }
      };
      
      // Enhanced error handler
      worker.onerror = (error) => {
        console.error('❌ Worker error for:', file.name, error);
        safeResolve({ 
          ok: false, 
          code: 'WORKER_ERROR',
          originalSize: file.size
        });
      };
      
      // Enhanced message post with validation
      try {
        const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const message = {
          type: 'compress',
          file,
          taskId,
          options: {
            maxSizeMB: 1,
            maxWidthOrHeight: maxSide,
            initialQuality: quality,
            fileType: 'image/jpeg',
            useWebWorker: false,
            preserveExif: false
          }
        };
        
        // Validate message before sending  
        if (!file || file.size === 0) {
          throw new Error('Invalid file for compression');
        }
        if (maxSide < 100 || maxSide > 3000) {
          throw new Error('Invalid maxSide parameter');
        }
        if (quality < 0.1 || quality > 1.0) {
          throw new Error('Invalid quality parameter');
        }
        
        worker.postMessage(message);
        console.log('📤 Compression task sent to worker:', {
          type: 'compress',
          taskId,
          file: file.name,
          size: file.size,
          maxSide,
          quality
        });
        
      } catch (postError) {
        console.error('❌ Failed to post message to worker:', postError);
        safeResolve({ 
          ok: false, 
          code: 'WORKER_POST_FAILED',
          originalSize: file.size
        });
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
    // P0-2: Check abort before starting
    if (signal?.aborted) {
      throw new DOMException('Upload cancelled before start', 'AbortError');
    }
    
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
      
      // P0-2: Check abort after conversion
      if (signal?.aborted) {
        throw new DOMException('Upload cancelled after conversion', 'AbortError');
      }
      
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

      const idempotencyKey = `upload_${publicId}_${Date.now()}`;

      // P0-2: Check abort before network request
      if (signal?.aborted) {
        throw new DOMException('Upload cancelled before request', 'AbortError');
      }

      // P1-2: Connection pooling with keep-alive and idempotency
      const { data: response, error: functionError } = await supabase.functions.invoke('cloudinary-upload', {
        body: requestBody,
        signal: signal || getSignal(),
        headers: {
          'Connection': 'keep-alive', // Reuse connections for multiple uploads
          'Idempotency-Key': idempotencyKey
        }
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
            retryDelay: 1000,
            signal // Pass abort signal for proper cancellation
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

  // REMOVED: Chunked batch signature function (was causing 403 errors and 4s delays)
  // Now using individual signatures only for faster, more reliable uploads

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
    
    // P0-1: Prevent duplicate uploads
    if (isUploading) {
      console.warn('Upload already in progress, ignoring duplicate call');
      return [];
    }
    
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
        originalFile: file, // Always preserve the original file for EXIF processing
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
      // Use single signatures for each file (batch signatures removed due to 403 errors)
      const signatureMap = new Map<string, CloudinarySignature>();

      // ✨ ENHANCED: Sequential + Parallel processing for better cold start handling
      console.log('🚀 Starting sequential + parallel upload strategy');
      
      // Step 1: Process first file sequentially with pre-warmed worker
      if (items.length > 0) {
        console.log('📋 Processing first file sequentially for cold start optimization...');
        const firstItem = items[0];
        await processFileSequentially(firstItem, signatureMap, currentSessionId, quality, maxSide);
      }
      
      // Step 2: Process remaining files in parallel
      if (items.length > 1) {
        console.log(`📋 Processing remaining ${items.length - 1} files in parallel (concurrency: ${parallelism})...`);
        const remainingItems = items.slice(1);
        await runPool(parallelism, remainingItems, async (item) => {
          await processFileParallel(item, signatureMap, currentSessionId, quality, maxSide);
        });
      }

      // Signature map is pre-created empty - signatures will be fetched individually

      // Helper: Run pool for parallel processing
      async function runPool<T>(concurrency: number, items: T[], processor: (item: T) => Promise<void>) {
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
      }

      // Helper: Process single file sequentially (first file with extended timeout)
      async function processFileSequentially(item: StagedUploadItem, signatureMap: Map<string, CloudinarySignature>, currentSessionId: string, quality: number, maxSide: number) {
        try {
          // For HEIC files, upload directly to Edge Function (handles conversion)
          if (item.isHeic) {
            console.log(`📱 [SEQUENTIAL] Processing HEIC file: ${item.file.name}, size: ${Math.round(item.file.size / 1024)}KB`);
            
            item.status = 'uploading';
            setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, status: item.status } : p));
            
            const result = await uploadToEdgeFunction(
              item.file,
              item.publicId!,
              (progress) => {
                item.progress = progress;
                updateItemProgress(item.id, progress);
              },
              getSignal()
            );
            
            console.log(`✅ [SEQUENTIAL] HEIC file processed successfully: ${item.file.name} → ${result.url}`);
            
            item.status = 'success';
            item.url = result.url;
            item.compressedSize = item.originalSize; 
            newUrls.push(result.url);
            setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, status: item.status, url: item.url } : p));
            
            logUploadEvent({
              file_url: result.url,
              method: 'cloudinary-upload',
              duration_ms: item.uploadStartTime ? Date.now() - item.uploadStartTime : 0,
              status: 'success',
              original_size: item.originalSize,
              compressed_size: item.compressedSize,
              compression_ratio: item.compressedSize && item.originalSize ? item.compressedSize / item.originalSize : undefined
            }, { context: 'seller_product' }).catch(error => {
              console.error('🚨 Upload success logging failed for HEIC file:', item.file.name, error);
            });
            
            return;
          }

          // Step 1: Compression (first file gets extended timeout)
          const shouldCompress = item.file.size > 300_000;
          
          if (shouldCompress) {
            item.status = 'compressing';
            setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, status: item.status } : p));
            
            console.log(`🗜️ [SEQUENTIAL] Compressing first file with extended timeout: ${item.file.name}`);
            const compressionResult = await compressInWorker(
              item.file, 
              maxSide, 
              quality,
              true // ALWAYS true for sequential (first file)
            );
            
            // Mark first file as processed
            markFirstFileProcessed();
            
            if (compressionResult.ok && compressionResult.blob) {
              item.file = new File(
                [compressionResult.blob], 
                item.file.name.replace(/\.\w+$/i, '.jpg'), 
                { type: 'image/jpeg' }
              );
              item.compressedSize = compressionResult.compressedSize;
              setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, file: item.file, compressedSize: item.compressedSize } : p));
            } else {
              console.warn(`⚠️ [SEQUENTIAL] Compression failed for ${item.file.name}, using original`);
              item.compressedSize = item.originalSize;
            }
          } else {
            item.compressedSize = item.originalSize;
            markFirstFileProcessed(); // Still mark as processed even if no compression
          }

          // Step 2: Signature
          item.status = 'signing';
          setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, status: item.status } : p));
          
          const signature = await ensureSignature(item.publicId!, currentSessionId, signatureMap);
          
          // Step 3: Upload
          item.status = 'uploading';
          setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, status: item.status } : p));
          
          const result = await uploadToEdgeFunction(
            item.file,
            item.publicId!,
            (progress) => {
              item.progress = progress;
              updateItemProgress(item.id, progress);
            },
            getSignal()
          );
          
          console.log(`✅ [SEQUENTIAL] First file uploaded successfully: ${item.file.name} → ${result.url}`);
          
          item.status = 'success';
          item.url = result.url;
          newUrls.push(result.url);
          setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, status: item.status, url: item.url } : p));
          
          logUploadEvent({
            file_url: result.url,
            method: 'cloudinary-upload',
            duration_ms: item.uploadStartTime ? Date.now() - item.uploadStartTime : 0,
            status: 'success',
            original_size: item.originalSize,
            compressed_size: item.compressedSize,
            compression_ratio: item.compressedSize && item.originalSize ? item.compressedSize / item.originalSize : undefined
          }, { context: 'seller_product' }).catch(error => {
            console.error('🚨 Upload success logging failed for file:', item.file.name, error);
          });
          
        } catch (error) {
          console.error(`❌ [SEQUENTIAL] Upload failed for ${item.file.name}:`, error);
          item.status = 'error';
          item.error = error instanceof Error ? error.message : 'Upload failed';
          setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, status: item.status, error: item.error } : p));
          
          logUploadEvent({
            file_url: undefined,
            method: 'cloudinary-upload', 
            duration_ms: item.uploadStartTime ? Date.now() - item.uploadStartTime : 0,
            status: 'error',
            error_details: error instanceof Error ? error.message : 'Upload failed',
            original_size: item.originalSize,
            compressed_size: item.compressedSize
          }, { context: 'seller_product' }).catch(logError => {
            console.error('🚨 Upload error logging failed for file:', item.file.name, logError);
          });
        }
      }

      // Helper: Process files in parallel (remaining files with standard timeout)
      async function processFileParallel(item: StagedUploadItem, signatureMap: Map<string, CloudinarySignature>, currentSessionId: string, quality: number, maxSide: number) {
        try {
          // For HEIC files, upload directly to Edge Function (handles conversion)
          if (item.isHeic) {
            console.log(`📱 [PARALLEL] Processing HEIC file: ${item.file.name}, size: ${Math.round(item.file.size / 1024)}KB`);
            
            item.status = 'uploading';
            setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, status: item.status } : p));
            
            const result = await uploadToEdgeFunction(
              item.file,
              item.publicId!,
              (progress) => {
                item.progress = progress;
                updateItemProgress(item.id, progress);
              },
              getSignal()
            );
            
            console.log(`✅ [PARALLEL] HEIC file processed successfully: ${item.file.name} → ${result.url}`);
            
            item.status = 'success';
            item.url = result.url;
            item.compressedSize = item.originalSize;
            newUrls.push(result.url);
            setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, status: item.status, url: item.url } : p));
            
            logUploadEvent({
              file_url: result.url,
              method: 'cloudinary-upload',
              duration_ms: item.uploadStartTime ? Date.now() - item.uploadStartTime : 0,
              status: 'success',
              original_size: item.originalSize,
              compressed_size: item.compressedSize,
              compression_ratio: item.compressedSize && item.originalSize ? item.compressedSize / item.originalSize : undefined
            }, { context: 'seller_product' }).catch(error => {
              console.error('🚨 Upload success logging failed for HEIC file:', item.file.name, error);
            });
            
            return;
          }

          // Step 1: Compression (parallel files use standard timeout)
          const shouldCompress = item.file.size > 300_000;
          
          if (shouldCompress) {
            item.status = 'compressing';         
            setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, status: item.status } : p));
            
            console.log(`🗜️ [PARALLEL] Compressing file with standard timeout: ${item.file.name}`);
            const compressionResult = await compressInWorker(
              item.file, 
              maxSide, 
              quality,
              false // ALWAYS false for parallel (remaining files)
            );
            
            if (compressionResult.ok && compressionResult.blob) {
              item.file = new File(
                [compressionResult.blob], 
                item.file.name.replace(/\.\w+$/i, '.jpg'), 
                { type: 'image/jpeg' }
              );
              item.compressedSize = compressionResult.compressedSize;
              setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, file: item.file, compressedSize: item.compressedSize } : p));
            } else {
              console.warn(`⚠️ [PARALLEL] Compression failed for ${item.file.name}, using original`);
              item.compressedSize = item.originalSize;
            }
          } else {
            item.compressedSize = item.originalSize;
          }

          // Step 2: Ensure signature
          item.status = 'signing';
          setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, status: item.status } : p));
          
          const signature = await ensureSignature(item.publicId!, currentSessionId, signatureMap);
          
          // Step 3: Upload with retry
          item.status = 'uploading';
          setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, status: item.status } : p));
          
          const result = await uploadToEdgeFunction(
            item.file,
            item.publicId!,
            (progress) => {
              item.progress = progress;
              updateItemProgress(item.id, progress);
            },
            getSignal()
          );
          
          console.log(`✅ [PARALLEL] File uploaded successfully: ${item.file.name} → ${result.url}`);
          
          item.status = 'success';
          item.url = result.url;
          newUrls.push(result.url);
          setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, status: item.status, url: item.url } : p));
          
          logUploadEvent({
            file_url: result.url,
            method: 'cloudinary-upload',
            duration_ms: item.uploadStartTime ? Date.now() - item.uploadStartTime : 0,
            status: 'success',
            original_size: item.originalSize,
            compressed_size: item.compressedSize,
            compression_ratio: item.compressedSize && item.originalSize ? item.compressedSize / item.originalSize : undefined
          }, { context: 'seller_product' }).catch(error => {
            console.error('🚨 Upload success logging failed for file:', item.file.name, error);
          });
          
        } catch (error) {
          console.error(`❌ [PARALLEL] Upload failed for ${item.file.name}:`, error);
          item.status = 'error';
          item.error = error instanceof Error ? error.message : 'Upload failed';
          setUploadItems(prev => prev.map(p => p.id === item.id ? { ...p, status: item.status, error: item.error } : p));
          
          logUploadEvent({
            file_url: undefined,
            method: 'cloudinary-upload', 
            duration_ms: item.uploadStartTime ? Date.now() - item.uploadStartTime : 0,
            status: 'error',
            error_details: error instanceof Error ? error.message : 'Upload failed',
            original_size: item.originalSize,
            compressed_size: item.compressedSize
          }, { context: 'seller_product' }).catch(logError => {
            console.error('🚨 Upload error logging failed for file:', item.file.name, logError);
          });
        }
      }

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
  }, [createController, initSession, ensureSignature, compressInWorker, uploadToEdgeFunction, stagedUrls, handleError, getSignal]);

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

  // Pre-warm handled by parent components (SellerAddProduct, etc.)
  // Removed duplicate preWarm to avoid multiple worker initializations

  // Smart cleanup: only terminate worker if no active uploads
  useEffect(() => {
    return () => {
      const hasActiveUploads = uploadItems.some(item =>
        item.status === 'compressing' ||
        item.status === 'uploading' ||
        item.status === 'signing'
      );
      
      if (!hasActiveUploads) {
        console.log('🛑 Component unmounting - terminating idle worker');
        terminate();
      } else {
        console.warn('⚠️ Component unmounting but uploads still active - keeping worker alive');
      }
    };
  }, [uploadItems]);

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