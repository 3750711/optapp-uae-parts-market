import { useRef, useCallback, useEffect } from 'react';
import { logger } from '@/utils/logger';

interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  initialQuality?: number;
  fileType?: string;
}

interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  compressionApplied: boolean;
}

interface CompressionTask {
  id: string;
  file: File;
  resolve: (result: CompressionResult) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: number, stage: string) => void;
}

export interface AsyncCompressionProgress {
  taskId: string;
  progress: number;
  stage: 'starting' | 'compressing' | 'complete';
}

export const useAsyncImageCompression = () => {
  const workerRef = useRef<Worker | null>(null);
  const tasksRef = useRef<Map<string, CompressionTask>>(new Map());
  const isInitializedRef = useRef(false);

  // Initialize worker
  const initializeWorker = useCallback(() => {
    if (isInitializedRef.current && workerRef.current) {
      return workerRef.current;
    }

    try {
      // Create worker from public folder
      const worker = new Worker('/workers/image-compress-worker.js');
      workerRef.current = worker;
      isInitializedRef.current = true;

      // Handle worker messages
      worker.onmessage = (event) => {
        const { type, taskId, result, progress, stage, error } = event.data;
        const task = tasksRef.current.get(taskId);

        if (!task) {
          logger.warn(`Received message for unknown task: ${taskId}`);
          return;
        }

        switch (type) {
          case 'progress':
            if (task.onProgress) {
              task.onProgress(progress, stage);
            }
            break;

          case 'success':
            tasksRef.current.delete(taskId);
            task.resolve(result);
            break;

          case 'error':
            tasksRef.current.delete(taskId);
            task.reject(new Error(error || 'Compression failed'));
            break;

          case 'aborted':
            tasksRef.current.delete(taskId);
            task.reject(new Error('ABORTED'));
            break;

          default:
            logger.warn(`Unknown worker message type: ${type}`);
        }
      };

      // Handle worker errors
      worker.onerror = (error) => {
        logger.error('Worker error:', error);
        // Reject all pending tasks
        tasksRef.current.forEach((task, taskId) => {
          task.reject(new Error('Worker crashed'));
          tasksRef.current.delete(taskId);
        });
      };

      logger.log('🔧 Image compression worker initialized');
      return worker;
    } catch (error) {
      logger.error('Failed to initialize compression worker:', error);
      throw new Error('Failed to initialize image compression worker');
    }
  }, []);

  // Compress single file
  const compressFile = useCallback(async (
    file: File,
    options: CompressionOptions = {},
    onProgress?: (progress: number, stage: string) => void
  ): Promise<CompressionResult> => {
    const worker = initializeWorker();
    const taskId = `compress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return new Promise<CompressionResult>((resolve, reject) => {
      // Store task for tracking
      tasksRef.current.set(taskId, {
        id: taskId,
        file,
        resolve,
        reject,
        onProgress
      });

      // Send compression task to worker
      worker.postMessage({
        type: 'compress',
        file,
        options,
        taskId
      });

      // Set timeout to prevent hanging
      const timeout = setTimeout(() => {
        tasksRef.current.delete(taskId);
        reject(new Error('Compression timeout'));
      }, 30000); // 30 seconds

      // Clear timeout on completion
      const originalResolve = resolve;
      const originalReject = reject;
      
      const wrappedResolve = (result: CompressionResult) => {
        clearTimeout(timeout);
        originalResolve(result);
      };
      
      const wrappedReject = (error: Error) => {
        clearTimeout(timeout);
        originalReject(error);
      };

      // Update task with wrapped callbacks
      const task = tasksRef.current.get(taskId);
      if (task) {
        task.resolve = wrappedResolve;
        task.reject = wrappedReject;
      }
    });
  }, [initializeWorker]);

  // Compress multiple files with concurrency control
  const compressFiles = useCallback(async (
    files: File[],
    options: CompressionOptions = {},
    onProgress?: (completedCount: number, totalCount: number, currentFile?: string) => void,
    maxConcurrent: number = 2
  ): Promise<CompressionResult[]> => {
    if (files.length === 0) return [];

    const results: CompressionResult[] = [];
    let completedCount = 0;

    // Process files in batches to control concurrency
    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (file) => {
        try {
          const result = await compressFile(
            file,
            options,
            (progress, stage) => {
              // Individual file progress could be reported here if needed
              logger.log(`File ${file.name}: ${stage} ${progress}%`);
            }
          );
          
          completedCount++;
          if (onProgress) {
            onProgress(completedCount, files.length, file.name);
          }
          
          return result;
        } catch (error) {
          logger.warn(`Failed to compress ${file.name}:`, error);
          
          // Return original file as fallback
          const fallbackResult: CompressionResult = {
            compressedFile: file,
            originalSize: file.size,
            compressedSize: file.size,
            compressionRatio: 0,
            compressionApplied: false
          };
          
          completedCount++;
          if (onProgress) {
            onProgress(completedCount, files.length, file.name);
          }
          
          return fallbackResult;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }, [compressFile]);

  // Abort all pending compressions
  const abortAll = useCallback(() => {
    if (workerRef.current && isInitializedRef.current) {
      logger.log('🛑 Aborting all compression tasks');
      workerRef.current.postMessage({ type: 'abort' });
      
      // Reject all pending tasks
      tasksRef.current.forEach((task, taskId) => {
        task.reject(new Error('ABORTED'));
        tasksRef.current.delete(taskId);
      });
    }
  }, []);

  // Reset worker state
  const resetWorker = useCallback(() => {
    if (workerRef.current && isInitializedRef.current) {
      workerRef.current.postMessage({ type: 'reset' });
      tasksRef.current.clear();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortAll();
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [abortAll]);

  return {
    compressFile,
    compressFiles,
    abortAll,
    resetWorker,
    isWorkerReady: isInitializedRef.current
  };
};