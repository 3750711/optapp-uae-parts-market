import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error' | 'retrying';
  error?: string;
  url?: string;
  attempt?: number;
  maxRetries?: number;
}

interface UploadOptions {
  productId?: string;
  disableToast?: boolean;
}

export const useSimpleCloudinaryUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-clear completed uploads after delay
  const clearCompletedAfterDelay = useCallback(() => {
    setTimeout(() => {
      setUploadProgress(prev => prev.filter(p => p.status !== 'success' && p.status !== 'error'));
    }, 3000);
  }, []);

  // Check if error is retryable
  const isRetryableError = (error: any, status?: number): boolean => {
    // Network errors
    if (!navigator.onLine) return true;
    if (error?.code === 'NETWORK_ERROR') return true;
    if (error?.message?.includes('network')) return true;
    if (error?.message?.includes('fetch')) return true;
    
    // Temporary server errors
    if (status && status >= 500) return true;
    if (status === 408) return true; // Request Timeout
    if (status === 429) return true; // Too Many Requests
    
    // Permanent errors - don't retry
    if (status === 401 || status === 403 || status === 404) return false;
    
    return true; // Default to retry for unknown errors
  };

  // Upload with retry mechanism
  const uploadWithRetry = async (
    file: File,
    fileId: string,
    options: UploadOptions = {},
    maxRetries = 3
  ): Promise<string> => {
    // Create new AbortController for this upload
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // Check for cancellation before each attempt
      if (controller.signal.aborted) {
        throw new DOMException('Upload cancelled', 'AbortError');
      }
      
      try {
        console.log(`📤 Upload attempt ${attempt}/${maxRetries} for ${file.name}`);
        
        // Update progress with attempt info
        setUploadProgress(prev => prev.map(p => 
          p.fileId === fileId 
            ? { 
                ...p, 
                status: attempt > 1 ? 'retrying' : 'uploading', 
                progress: 0,
                attempt,
                maxRetries
              }
            : p
        ));

        // Perform the actual upload
        const result = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const formData = new FormData();
          
          // ✅ CRITICAL: Link AbortController with XMLHttpRequest
          const abortHandler = () => {
            xhr.abort();
            reject(new DOMException('Upload cancelled', 'AbortError'));
          };
          controller.signal.addEventListener('abort', abortHandler);
          
          // Cleanup function
          const cleanup = () => {
            controller.signal.removeEventListener('abort', abortHandler);
          };
          
          // Append file and metadata
          formData.append('file', file);
          formData.append('name', file.name);
          formData.append('type', file.type);
          formData.append('folder', options.productId ? `products/${options.productId}` : 'uploads');

          // Track upload progress
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 90); // Reserve 10% for server processing
              setUploadProgress(prev => prev.map(p => 
                p.fileId === fileId 
                  ? { ...p, progress, status: 'uploading' }
                  : p
              ));
            }
          });

          // Handle successful response
          xhr.addEventListener('load', () => {
            cleanup();
            try {
              if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                
                if (response.success && response.mainImageUrl) {
                  // Show processing status briefly
                  setUploadProgress(prev => prev.map(p => 
                    p.fileId === fileId 
                      ? { ...p, status: 'processing', progress: 95 }
                      : p
                  ));

                  // Complete after short delay
                  setTimeout(() => {
                    setUploadProgress(prev => prev.map(p => 
                      p.fileId === fileId 
                        ? { 
                            ...p, 
                            status: 'success', 
                            progress: 100,
                            url: response.mainImageUrl
                          }
                        : p
                    ));
                    
                    console.log('✅ XMLHttpRequest upload successful:', response.mainImageUrl);
                    resolve(response.mainImageUrl);
                  }, 300);
                } else {
                  const error = new Error(response.error || 'Upload failed');
                  (error as any).status = xhr.status;
                  reject(error);
                }
              } else {
                const error = new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
                (error as any).status = xhr.status;
                reject(error);
              }
            } catch (error) {
              (error as any).status = xhr.status;
              reject(error);
            }
          });

          // Handle network errors
          xhr.addEventListener('error', () => {
            cleanup();
            const error = new Error('Network error during upload');
            (error as any).code = 'NETWORK_ERROR';
            reject(error);
          });

          // Handle timeout
          xhr.addEventListener('timeout', () => {
            cleanup();
            const error = new Error('Upload timeout');
            (error as any).code = 'TIMEOUT_ERROR';
            reject(error);
          });

          // Set timeout (30 seconds per attempt)
          xhr.timeout = 30000;

          // Open connection and send
          xhr.open('POST', `${supabase.supabaseUrl}/functions/v1/cloudinary-upload`);
          xhr.setRequestHeader('Authorization', `Bearer ${supabase.supabaseKey}`);
          xhr.send(formData);
        });

        return result; // Success - return the result
        
      } catch (error) {
        // Don't retry for cancelled uploads
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Upload cancelled by user');
          throw error;
        }
        
        lastError = error;
        console.error(`❌ Upload attempt ${attempt} failed:`, error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const status = (error as any)?.status;
        
        // Check if we should retry
        if (attempt < maxRetries && isRetryableError(error, status)) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          
          // Show retry status with countdown
          setUploadProgress(prev => prev.map(p => 
            p.fileId === fileId 
              ? { 
                  ...p, 
                  status: 'retrying', 
                  error: `${errorMessage} (попытка ${attempt + 1}/${maxRetries} через ${delay/1000}с)`,
                  attempt: attempt + 1,
                  maxRetries
                }
              : p
          ));
          
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Final failure - update status
          setUploadProgress(prev => prev.map(p => 
            p.fileId === fileId 
              ? { 
                  ...p, 
                  status: 'error', 
                  error: `${errorMessage} (после ${maxRetries} попыток)`
                }
              : p
          ));
          break;
        }
      }
    }
    
    throw new Error(`Upload failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  };

  const uploadSingleFile = useCallback(async (
    file: File,
    fileId: string,
    options: UploadOptions = {}
  ): Promise<string> => {
    return uploadWithRetry(file, fileId, options);
  }, []);

  const uploadFiles = useCallback(async (
    files: File[],
    options: UploadOptions = {}
  ): Promise<string[]> => {
    setIsUploading(true);

    // Initialize progress tracking
    const initialProgress: UploadProgress[] = files.map((file, index) => ({
      fileId: `file-${Date.now()}-${index}`,
      fileName: file.name,
      progress: 0,
      status: 'pending'
    }));
    
    setUploadProgress(initialProgress);

    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (let i = 0; i < files.length; i++) {
        try {
          const fileId = initialProgress[i].fileId;
          const url = await uploadSingleFile(files[i], fileId, options);
          uploadedUrls.push(url);
        } catch (error) {
          errors.push(`${files[i].name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (!options.disableToast) {
        if (uploadedUrls.length > 0) {
          toast({
            title: "Загрузка завершена",
            description: `Успешно загружено ${uploadedUrls.length} из ${files.length} файлов`,
          });
        }

        if (errors.length > 0) {
          toast({
            title: "Ошибки загрузки",
            description: `Не удалось загрузить ${errors.length} файлов`,
            variant: "destructive",
          });
        }
      }

      // Clear completed uploads after delay for better UX
      if (uploadedUrls.length > 0) {
        clearCompletedAfterDelay();
      }

      return uploadedUrls;
    } finally {
      setIsUploading(false);
    }
  }, [uploadSingleFile, clearCompletedAfterDelay]);

  const clearProgress = useCallback(() => {
    setUploadProgress([]);
  }, []);

  // Critical: Cleanup on component unmount (navigation)
  useEffect(() => {
    return () => {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        console.log('🛑 Simple upload component unmounting - cancelling uploads');
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    isUploading,
    uploadProgress,
    uploadFiles,
    clearProgress
  };
};