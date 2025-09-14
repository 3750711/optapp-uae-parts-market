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

export const useChunkedCloudinaryVideoUpload = (orderId: string) => {
  const [uploads, setUploads] = useState<ChunkedUploadItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(true); // Сразу true
  const activeUploads = useRef<Map<string, AbortController>>(new Map());
  const uploadStartTimes = useRef<Map<string, number>>(new Map());

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
    
    console.log('🔐 Received signature:', data.data);
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
        console.log(`📤 Uploading chunk ${chunk.index + 1} (${chunkData.size} bytes)`);

        const formData = new FormData();
        formData.append('file', chunkData);
        formData.append('api_key', signature.api_key);
        formData.append('timestamp', signature.timestamp.toString());
        formData.append('signature', signature.signature);
        formData.append('public_id', signature.public_id);
        formData.append('upload_id', signature.upload_id);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${signature.cloud_name}/video/upload`,
          {
            method: 'POST',
            body: formData,
            headers: {
              'Content-Range': `bytes ${chunk.start}-${chunk.end - 1}/${file.size}`
            },
            signal: abortController.signal
          }
        );

        const responseText = await response.text();
        console.log(`Response status: ${response.status}, body:`, responseText);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${responseText}`);
        }

        const result = JSON.parse(responseText);
        
        if (result.error) {
          throw new Error(result.error.message || 'Chunk upload failed');
        }

        // Обработка последнего чанка
        if (result.secure_url && result.public_id) {
          console.log('✅ Final chunk uploaded, video ready:', result.secure_url);
          setUploads(prev => prev.map(upload => 
            upload.id === uploadId ? {
              ...upload,
              cloudinaryUrl: result.secure_url,
              publicId: result.public_id,
              thumbnail: result.thumbnail_url
            } : upload
          ));
        }

        // Обновление статуса чанка
        setUploads(prev => prev.map(upload => 
          upload.id === uploadId ? {
            ...upload,
            chunks: upload.chunks.map(c => 
              c.index === chunk.index 
                ? { ...c, status: 'completed' as const, etag: result.etag || 'done' }
                : c
            )
          } : upload
        ));

        return result.etag || 'completed';

      } catch (error: any) {
        lastError = error;
        console.error(`Chunk ${chunk.index} upload error:`, error);
        
        if (error.name === 'AbortError' || abortController.signal.aborted) {
          throw new Error('Upload cancelled');
        }

        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_BASE * Math.pow(2, attempt);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
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