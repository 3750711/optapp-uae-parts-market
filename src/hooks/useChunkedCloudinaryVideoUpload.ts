import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Types for chunked upload
export interface ChunkInfo {
  index: number;
  start: number;
  end: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  uploadId?: string;
  etag?: string;
  retryCount: number;
}

export interface ChunkedUploadItem {
  id: string;
  file: File;
  orderId: string;
  status: 'idle' | 'uploading' | 'paused' | 'success' | 'error' | 'cancelled';
  progress: number;
  uploadedBytes: number;
  totalBytes: number;
  chunks: ChunkInfo[];
  publicId?: string;
  cloudinaryUrl?: string;
  error?: string;
  uploadSpeed?: number;
  eta?: number;
  thumbnail?: string;
}

export interface UploadedVideo {
  public_id: string;
  secure_url: string;
  format: string;
  bytes: number;
  duration?: number;
  width?: number;
  height?: number;
}

interface CloudinarySignature {
  cloud_name: string;
  api_key: string;
  timestamp: number;
  signature: string;
  public_id: string;
  folder: string;
  resource_type: string;
  upload_id: string;
}

// Constants
const CHUNK_SIZE = 6 * 1024 * 1024; // 6MB chunks
const MAX_CONCURRENT_CHUNKS = 1; // Sequential upload required for video
const MAX_RETRIES = 5;
const RETRY_DELAY_BASE = 1000;
const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
const SUPPORTED_FORMATS = ['mp4', 'mov', 'webm', 'avi'];

// IndexedDB for persistence
const UPLOAD_DB_NAME = 'chunked_video_uploads';
const UPLOAD_DB_VERSION = 1;
const UPLOAD_STORE_NAME = 'uploads';

class UploadPersistence {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(UPLOAD_DB_NAME, UPLOAD_DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(UPLOAD_STORE_NAME)) {
          const store = db.createObjectStore(UPLOAD_STORE_NAME, { keyPath: 'id' });
          store.createIndex('orderId', 'orderId');
          store.createIndex('status', 'status');
        }
      };
    });
  }

  async saveUpload(upload: ChunkedUploadItem): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([UPLOAD_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(UPLOAD_STORE_NAME);
    
    // Serialize File object
    const serializedUpload = {
      ...upload,
      file: {
        name: upload.file.name,
        size: upload.file.size,
        type: upload.file.type,
        lastModified: upload.file.lastModified
      }
    };
    
    await store.put(serializedUpload);
  }

  async getUploads(orderId: string): Promise<ChunkedUploadItem[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([UPLOAD_STORE_NAME], 'readonly');
    const store = transaction.objectStore(UPLOAD_STORE_NAME);
    const index = store.index('orderId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(orderId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteUpload(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([UPLOAD_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(UPLOAD_STORE_NAME);
    await store.delete(id);
  }
}

const persistence = new UploadPersistence();

export const useChunkedCloudinaryVideoUpload = (orderId: string) => {
  const [uploads, setUploads] = useState<ChunkedUploadItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const activeUploads = useRef<Map<string, AbortController>>(new Map());
  const uploadStartTimes = useRef<Map<string, number>>(new Map());

  // Initialize and restore uploads from IndexedDB
  useEffect(() => {
    const initialize = async () => {
      try {
        await persistence.init();
        const savedUploads = await persistence.getUploads(orderId);
        
        // Filter out completed/cancelled uploads and reset uploading ones to paused
        const validUploads = savedUploads
          .filter(upload => upload.status !== 'success' && upload.status !== 'cancelled')
          .map(upload => ({
            ...upload,
            status: upload.status === 'uploading' ? 'paused' as const : upload.status,
            chunks: upload.chunks.map(chunk => ({
              ...chunk,
              status: chunk.status === 'uploading' ? 'pending' as const : chunk.status
            }))
          }));
          
        setUploads(validUploads);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize upload persistence:', error);
        setIsInitialized(true);
      }
    };

    initialize();
  }, [orderId]);

  // Validate file
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `Файл превышает максимальный размер ${MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB` };
    }

    // Check MIME type first
    if (!file.type.startsWith('video/')) {
      return { valid: false, error: 'Неверный тип файла. Пожалуйста, загрузите видео файл.' };
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !SUPPORTED_FORMATS.includes(extension)) {
      return { valid: false, error: `Поддерживаются только форматы: ${SUPPORTED_FORMATS.join(', ')}` };
    }

    if (uploads.length >= 3) {
      return { valid: false, error: 'Максимум 3 видео файла' };
    }

    return { valid: true };
  };

  // Create chunks for file
  const createChunks = (file: File): ChunkInfo[] => {
    const chunks: ChunkInfo[] = [];
    let start = 0;
    let index = 0;

    while (start < file.size) {
      const end = Math.min(start + CHUNK_SIZE, file.size);
      chunks.push({
        index,
        start,
        end,
        status: 'pending',
        retryCount: 0
      });
      start = end;
      index++;
    }

    return chunks;
  };

  // Get Cloudinary signature
  const getSignature = async (): Promise<CloudinarySignature> => {
    const { data, error } = await supabase.functions.invoke('cloudinary-sign', {
      body: { orderId }
    });

    if (error) throw new Error(`Signature error: ${error.message}`);
    if (!data?.success) throw new Error(data?.error || 'Failed to get signature');

    return data.data;
  };

  // Upload single chunk with retry
  const uploadChunk = async (
    uploadId: string,
    chunk: ChunkInfo,
    file: File,
    signature: CloudinarySignature,
    abortController: AbortController
  ): Promise<string> => {
    const chunkData = file.slice(chunk.start, chunk.end);
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (abortController.signal.aborted) {
        throw new Error('Upload cancelled');
      }

      try {
        console.log(`📤 Uploading chunk ${chunk.index + 1} (${chunkData.size} bytes) for upload_id ${signature.upload_id}`);

        const formData = new FormData();
        formData.append('file', chunkData);
        formData.append('api_key', signature.api_key);
        formData.append('timestamp', signature.timestamp.toString());
        formData.append('signature', signature.signature);
        formData.append('public_id', signature.public_id);
        formData.append('folder', signature.folder);
        formData.append('resource_type', signature.resource_type);
        formData.append('upload_id', signature.upload_id);
        
        console.log(`🔐 FormData parameters:`, {
          api_key: signature.api_key,
          timestamp: signature.timestamp,
          signature: signature.signature,
          public_id: signature.public_id,
          folder: signature.folder,
          resource_type: signature.resource_type,
          upload_id: signature.upload_id,
          content_range: `bytes ${chunk.start}-${chunk.end - 1}/${file.size}`
        });

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${signature.cloud_name}/video/upload`,
          {
            method: 'POST',
            body: formData,
            headers: {
              'Content-Range': `bytes ${chunk.start}-${chunk.end - 1}/${file.size}`,
              'X-Unique-Upload-Id': signature.upload_id
            },
            signal: abortController.signal
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.error.message || 'Chunk upload failed');
        }

        // Check if this is the final chunk with complete video info
        if (result.secure_url && result.public_id) {
          console.log(`✅ Final chunk received with URL: ${result.secure_url}`);
          // Save the final video URL and metadata
          setUploads(prev => prev.map(upload => 
            upload.id === uploadId ? {
              ...upload,
              cloudinaryUrl: result.secure_url,
              publicId: result.public_id,
              thumbnail: result.thumbnail_url,
              chunks: upload.chunks.map(c => 
                c.index === chunk.index 
                  ? { ...c, status: 'completed' as const, etag: result.etag }
                  : c
              )
            } : upload
          ));
        } else {
          // Regular chunk completion
          setUploads(prev => prev.map(upload => 
            upload.id === uploadId ? {
              ...upload,
              chunks: upload.chunks.map(c => 
                c.index === chunk.index 
                  ? { ...c, status: 'completed' as const, etag: result.etag }
                  : c
              )
            } : upload
          ));
        }

        console.log(`✅ Chunk ${chunk.index + 1} uploaded`, {
          hasUrl: !!result.secure_url,
          chunkIndex: chunk.index
        });

        return result.etag || 'completed';

      } catch (error: any) {
        lastError = error;
        
        if (error.name === 'AbortError' || abortController.signal.aborted) {
          throw new Error('Upload cancelled');
        }

        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_BASE * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Update retry count
          setUploads(prev => prev.map(upload => 
            upload.id === uploadId ? {
              ...upload,
              chunks: upload.chunks.map(c => 
                c.index === chunk.index 
                  ? { ...c, retryCount: attempt + 1 }
                  : c
              )
            } : upload
          ));
        }
      }
    }

    throw lastError || new Error('Chunk upload failed after retries');
  };


  // Start upload for a single file
  const startUpload = async (uploadId: string) => {
    const upload = uploads.find(u => u.id === uploadId);
    if (!upload || upload.status === 'uploading') return;

    const abortController = new AbortController();
    activeUploads.current.set(uploadId, abortController);
    uploadStartTimes.current.set(uploadId, Date.now());

    try {
      // Update status to uploading
      setUploads(prev => prev.map(u => 
        u.id === uploadId 
          ? { ...u, status: 'uploading', error: undefined }
          : u
      ));

      const signature = await getSignature();
      const pendingChunks = upload.chunks.filter(c => c.status !== 'completed');
      
      // Upload chunks with proper concurrency control
      const activeUploads = new Set<Promise<void>>();
      let chunkIndex = 0;

      const processNextChunk = async (): Promise<void> => {
        if (chunkIndex >= pendingChunks.length) return;
        
        const chunk = pendingChunks[chunkIndex++];
        
        try {
          await uploadChunk(uploadId, chunk, upload.file, signature, abortController);
          
          // Update progress after each chunk
          const currentUpload = uploads.find(u => u.id === uploadId);
          if (currentUpload) {
            const completedChunks = currentUpload.chunks.filter(c => c.status === 'completed').length;
            const progress = Math.round((completedChunks / currentUpload.chunks.length) * 100);
            const uploadedBytes = completedChunks * CHUNK_SIZE;
            
            // Calculate speed and ETA
            const elapsed = Date.now() - uploadStartTimes.current.get(uploadId)!;
            const speed = uploadedBytes / (elapsed / 1000);
            const remainingBytes = currentUpload.totalBytes - uploadedBytes;
            const eta = remainingBytes / speed;

            setUploads(prev => prev.map(u => 
              u.id === uploadId 
                ? { 
                    ...u, 
                    progress, 
                    uploadedBytes,
                    uploadSpeed: speed,
                    eta: eta > 0 ? eta : undefined
                  }
                : u
            ));
          }
        } catch (error) {
          console.error(`Chunk ${chunk.index} upload error:`, error);
          throw error;
        }
      };

      // Start initial batch of concurrent uploads
      for (let i = 0; i < Math.min(MAX_CONCURRENT_CHUNKS, pendingChunks.length); i++) {
        const uploadPromise = processNextChunk();
        activeUploads.add(uploadPromise);
        
        uploadPromise.finally(() => {
          activeUploads.delete(uploadPromise);
          // Start next chunk if available and upload still active
          if (chunkIndex < pendingChunks.length && upload.status === 'uploading') {
            const nextUpload = processNextChunk();
            activeUploads.add(nextUpload);
            nextUpload.finally(() => activeUploads.delete(nextUpload));
          }
        });
      }
      
      // Wait for all uploads to complete
      while (activeUploads.size > 0) {
        await Promise.race(Array.from(activeUploads));
      }

      // Wait a moment for state to update, then check for final URL
      await new Promise(resolve => setTimeout(resolve, 100));
      const currentUpload = uploads.find(u => u.id === uploadId);
      if (!currentUpload?.cloudinaryUrl) {
        console.error('No video URL received after all chunks uploaded');
        throw new Error('Upload completed but no video URL received');
      }

      // Update to success
      setUploads(prev => prev.map(u => 
        u.id === uploadId 
          ? { 
              ...u, 
              status: 'success',
              progress: 100,
              uploadedBytes: u.totalBytes
            }
          : u
      ));

      // Clean up - activeUploads is managed locally above
      uploadStartTimes.current.delete(uploadId);
      await persistence.deleteUpload(uploadId);

      toast({
        title: "Видео загружено",
        description: `${upload.file.name} успешно загружен`,
      });

      // Return the current upload data with cloudinary info
      const finalUpload = uploads.find(u => u.id === uploadId);
      return {
        public_id: finalUpload?.publicId || '',
        secure_url: finalUpload?.cloudinaryUrl || '',
        format: 'mp4',
        bytes: upload.file.size,
        duration: 0,
        width: 0,
        height: 0
      };

    } catch (error: any) {
      console.error('Upload failed:', error);
      
      setUploads(prev => prev.map(u => 
        u.id === uploadId 
          ? { 
              ...u, 
              status: 'error',
              error: error.message
            }
          : u
      ));

      // Clean up - activeUploads is managed locally above
      uploadStartTimes.current.delete(uploadId);

      toast({
        title: "Ошибка загрузки",
        description: error.message,
        variant: "destructive"
      });

      throw error;
    }
  };

  // Add files to upload queue
  const addFiles = useCallback((files: File[]) => {
    const newUploads: ChunkedUploadItem[] = [];

    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        toast({
          title: "Ошибка файла",
          description: validation.error,
          variant: "destructive"
        });
        continue;
      }

      const id = crypto.randomUUID();
      const chunks = createChunks(file);
      
      const upload: ChunkedUploadItem = {
        id,
        file,
        orderId,
        status: 'idle',
        progress: 0,
        uploadedBytes: 0,
        totalBytes: file.size,
        chunks
      };

      newUploads.push(upload);
    }

    if (newUploads.length > 0) {
      setUploads(prev => [...prev, ...newUploads]);
      
      // Save to IndexedDB
      newUploads.forEach(upload => {
        persistence.saveUpload(upload).catch(console.error);
      });
    }
  }, [orderId, uploads.length]);

  // Control functions
  const pauseUpload = useCallback((uploadId: string) => {
    const controller = activeUploads.current.get(uploadId);
    if (controller) {
      controller.abort();
      activeUploads.current.delete(uploadId);
    }

    setUploads(prev => prev.map(u => 
      u.id === uploadId 
        ? { ...u, status: 'paused' }
        : u
    ));
  }, []);

  const resumeUpload = useCallback((uploadId: string) => {
    startUpload(uploadId).catch(console.error);
  }, [uploads]);

  const cancelUpload = useCallback(async (uploadId: string) => {
    const controller = activeUploads.current.get(uploadId);
    if (controller) {
      controller.abort();
      activeUploads.current.delete(uploadId);
    }

    setUploads(prev => prev.filter(u => u.id !== uploadId));
    await persistence.deleteUpload(uploadId);
  }, []);

  const retryUpload = useCallback((uploadId: string) => {
    setUploads(prev => prev.map(u => 
      u.id === uploadId 
        ? { 
            ...u, 
            status: 'idle',
            error: undefined,
            chunks: u.chunks.map(c => ({ ...c, retryCount: 0 }))
          }
        : u
    ));
  }, []);

  // Get completed videos for form submission
  const getCompletedVideos = useCallback((): UploadedVideo[] => {
    return uploads
      .filter(u => u.status === 'success' && u.cloudinaryUrl && u.publicId)
      .map(u => ({
        public_id: u.publicId!,
        secure_url: u.cloudinaryUrl!,
        format: u.file.name.split('.').pop() || 'mp4',
        bytes: u.file.size
      }));
  }, [uploads]);

  return {
    uploads,
    isInitialized,
    addFiles,
    startUpload,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    getCompletedVideos
  };
};