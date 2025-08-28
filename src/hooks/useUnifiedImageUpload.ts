import { useState, useCallback, useEffect, useRef } from 'react';
import { compressionManager } from '@/workers/CompressionManager';
import { useNetworkSpeedMeter } from './useNetworkSpeedMeter';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { CompressionResult } from '@/workers/types';

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'compressing' | 'signing' | 'uploading' | 'success' | 'error' | 'cancelled';
  error?: string;
  url?: string;
  publicId?: string;
  compressionResult?: CompressionResult;
  abortController: AbortController;
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

interface UnifiedUploadOptions {
  maxConcurrent?: number;
  disableToast?: boolean;
  onProgress?: (items: UploadItem[]) => void;
  onComplete?: (urls: string[]) => void;
  onError?: (error: string) => void;
}

export const useUnifiedImageUpload = () => {
  const { toast } = useToast();
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const { 
    networkProfile, 
    getCompressionProfile, 
    updateFromUpload, 
    getPerformanceSummary 
  } = useNetworkSpeedMeter();

  const activeUploads = useRef(new Set<string>());
  const semaphore = useRef<Promise<void>>(Promise.resolve());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      uploadQueue.forEach(item => {
        if (item.status === 'compressing' || item.status === 'uploading') {
          item.abortController.abort();
        }
      });
      compressionManager.terminate();
    };
  }, [uploadQueue]);

  // Get Cloudinary signature
  const getSignature = useCallback(async (): Promise<CloudinarySignature> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    const { data, error } = await supabase.functions.invoke('cloudinary-sign-batch', {
      body: JSON.stringify({ count: 1 }),
      headers: {
        'content-type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
      }
    });

    if (error) throw new Error(error.message || 'Failed to get signature');
    if (!data?.success || !data.data?.[0]) throw new Error('Invalid signature response');
    
    return data.data[0];
  }, []);

  // Upload to Cloudinary
  const uploadToCloudinary = useCallback(async (
    blob: Blob,
    signature: CloudinarySignature,
    onProgress: (progress: number) => void,
    abortController: AbortController
  ): Promise<{ url: string; publicId: string }> => {
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
            
            // Update network metrics
            updateFromUpload({
              originalBytes: blob.size,
              compressedBytes: blob.size,
              uploadMs: Math.round(uploadMs),
              bytesPerSec: Math.round(blob.size / (uploadMs / 1000)),
              retries: 0,
              compressionMs: 0,
              signingMs: 0
            });
            
            resolve({
              url: response.secure_url,
              publicId: response.public_id
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
      
      abortController.signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('Upload cancelled'));
      });
      
      xhr.open('POST', signature.upload_url);
      xhr.timeout = 60000;
      xhr.send(formData);
    });
  }, [updateFromUpload]);

  // Process single upload with full pipeline
  const processSingleUpload = useCallback(async (item: UploadItem): Promise<void> => {
    const updateProgress = (updates: Partial<UploadItem>) => {
      setUploadQueue(prev => prev.map(i => 
        i.id === item.id ? { ...i, ...updates } : i
      ));
    };

    try {
      // Step 1: Compression
      updateProgress({ status: 'compressing', progress: 10 });
      
      const compressionProfile = getCompressionProfile();
      const compressionStartTime = performance.now();
      
      const compressionResult = await compressionManager.compress(item.file, compressionProfile);
      
      const compressionMs = performance.now() - compressionStartTime;
      
      if (compressionResult.error) {
        throw new Error(`Compression failed: ${compressionResult.error}`);
      }

      updateProgress({ 
        status: 'signing', 
        progress: 30,
        compressionResult 
      });

      // Update compression metrics
      updateFromUpload({
        originalBytes: item.file.size,
        compressedBytes: compressionResult.compressedSize,
        uploadMs: 0,
        bytesPerSec: 0,
        retries: 0,
        compressionMs: compressionResult.compressionMs,
        signingMs: 0
      });

      // Step 2: Get signature
      const signature = await getSignature();

      updateProgress({ status: 'uploading', progress: 40 });

      // Step 3: Upload
      const uploadResult = await uploadToCloudinary(
        compressionResult.blob,
        signature,
        (progress) => updateProgress({ progress: Math.max(40, progress) }),
        item.abortController
      );

      updateProgress({
        status: 'success',
        progress: 100,
        url: uploadResult.url,
        publicId: uploadResult.publicId
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      updateProgress({
        status: 'error',
        error: errorMessage
      });
      throw error;
    }
  }, [getCompressionProfile, getSignature, uploadToCloudinary, updateFromUpload]);

  // Concurrency control with semaphore
  const acquireSemaphore = useCallback(async (maxConcurrent: number): Promise<() => void> => {
    while (activeUploads.current.size >= maxConcurrent) {
      await semaphore.current;
    }
    
    let resolve: () => void;
    semaphore.current = new Promise(res => { resolve = res; });
    
    return () => {
      activeUploads.current.delete(''); // Will be set properly in upload
      resolve();
    };
  }, []);

  // Main upload function
  const uploadFiles = useCallback(async (
    files: File[], 
    options: UnifiedUploadOptions = {}
  ): Promise<string[]> => {
    if (files.length === 0) return [];

    const {
      maxConcurrent = getCompressionProfile().concurrency,
      disableToast = false,
      onProgress,
      onComplete,
      onError
    } = options;

    setIsUploading(true);

    // Create upload items
    const items: UploadItem[] = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: 'pending',
      abortController: new AbortController()
    }));

    setUploadQueue(items);

    try {
      const results: string[] = [];
      const promises: Promise<void>[] = [];

      for (const item of items) {
        const promise = (async () => {
          const release = await acquireSemaphore(maxConcurrent);
          activeUploads.current.add(item.id);
          
          try {
            await processSingleUpload(item);
            const finalItem = uploadQueue.find(i => i.id === item.id);
            if (finalItem?.url) {
              results.push(finalItem.url);
            }
          } finally {
            activeUploads.current.delete(item.id);
            release();
          }
        })();
        
        promises.push(promise);
      }

      // Wait for all uploads to complete
      await Promise.allSettled(promises);

      const successfulItems = uploadQueue.filter(item => item.status === 'success');
      const failedItems = uploadQueue.filter(item => item.status === 'error');

      if (failedItems.length > 0 && !disableToast) {
        toast({
          variant: "destructive",
          title: "Some uploads failed",
          description: `${failedItems.length} of ${files.length} files failed to upload`
        });
        onError?.(failedItems.map(item => item.error).join(', '));
      } else if (successfulItems.length > 0 && !disableToast) {
        toast({
          title: "Upload successful", 
          description: `${successfulItems.length} files uploaded successfully`
        });
      }

      const successfulUrls = successfulItems.map(item => item.url!);
      onComplete?.(successfulUrls);
      
      return successfulUrls;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      if (!disableToast) {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: errorMessage
        });
      }
      onError?.(errorMessage);
      return [];
    } finally {
      setIsUploading(false);
    }
  }, [getCompressionProfile, acquireSemaphore, processSingleUpload, uploadQueue, toast]);

  // Cancel all uploads
  const cancelUpload = useCallback(() => {
    uploadQueue.forEach(item => {
      if (item.status === 'compressing' || item.status === 'uploading') {
        item.abortController.abort();
      }
    });
    
    setUploadQueue(prev => prev.map(item => 
      ['compressing', 'uploading'].includes(item.status) 
        ? { ...item, status: 'cancelled' as const }
        : item
    ));
    
    setIsUploading(false);
  }, [uploadQueue]);

  // Clear completed uploads
  const clearCompleted = useCallback(() => {
    setUploadQueue(prev => prev.filter(item => 
      !['success', 'error', 'cancelled'].includes(item.status)
    ));
  }, []);

  // Get diagnostics
  const getDiagnostics = useCallback(() => {
    const workerStats = compressionManager.getWorkerStats();
    const compressionMetrics = compressionManager.getMetrics();
    const networkSummary = getPerformanceSummary;
    
    return {
      networkProfile,
      workerStats,
      compressionMetrics,
      networkSummary,
      uploadQueue: uploadQueue.map(({ file, abortController, ...item }) => ({
        ...item,
        fileName: file.name,
        fileSize: file.size
      }))
    };
  }, [networkProfile, getPerformanceSummary, uploadQueue]);

  return {
    uploadFiles,
    cancelUpload,
    clearCompleted,
    uploadQueue,
    isUploading,
    networkProfile,
    getDiagnostics,
    compressionMetrics: compressionManager.getMetrics(),
    workerStats: compressionManager.getWorkerStats()
  };
};