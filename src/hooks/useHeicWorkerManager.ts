import { useCallback, useRef } from 'react';

interface HeicWorkerResult {
  ok: boolean;
  blob?: Blob;
  width?: number;
  height?: number;
  mime?: string;
  code?: string;
  message?: string;
}

interface HeicWorkerManager {
  convertHeicFile: (file: File, maxSide?: number, quality?: number) => Promise<HeicWorkerResult>;
  isWorkerReady: () => boolean;
}

export const useHeicWorkerManager = (): HeicWorkerManager => {
  const workerRef = useRef<Worker | null>(null);
  const workerReadyRef = useRef<boolean>(false);
  const initPromiseRef = useRef<Promise<void> | null>(null);

  const initializeWorker = useCallback((): Promise<void> => {
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    initPromiseRef.current = new Promise(async (resolve, reject) => {
      try {
        console.log('🔧 HEIC Manager: Initializing HEIC worker...');
        
        // Try inline worker first to avoid network issues
        let worker: Worker;
        try {
          const HeicWorkerCtor = await import('../workers/heic2jpeg.worker.js?worker&inline');
          worker = new HeicWorkerCtor.default();
          console.log('✅ HEIC worker created with inline import');
        } catch (inlineError) {
          console.warn('⚠️ HEIC inline worker failed, trying URL fallback:', inlineError);
          worker = new Worker(new URL('../workers/heic2jpeg.worker.js', import.meta.url));
        }

        let initTimeout: NodeJS.Timeout;
        
        const handleWorkerMessage = (e: MessageEvent) => {
          const { type, error } = e.data;
          
          if (type === 'heic-ready') {
            console.log('✅ HEIC Manager: Worker initialization successful');
            clearTimeout(initTimeout);
            workerReadyRef.current = true;
            worker.removeEventListener('message', handleWorkerMessage);
            resolve();
          } else if (type === 'heic-init-error') {
            console.error('❌ HEIC Manager: Worker initialization failed:', error);
            clearTimeout(initTimeout);
            worker.terminate();
            workerRef.current = null;
            reject(new Error(`HEIC worker init failed: ${error}`));
          }
        };

        worker.addEventListener('message', handleWorkerMessage);
        
        worker.onerror = (error) => {
          console.error('💥 HEIC Manager: Worker error during init:', error);
          clearTimeout(initTimeout);
          worker.terminate();
          workerRef.current = null;
          reject(error);
        };

        // Set 60-second timeout for initialization
        initTimeout = setTimeout(() => {
          console.error('⏰ HEIC Manager: Worker initialization timeout');
          worker.removeEventListener('message', handleWorkerMessage);
          worker.terminate();
          workerRef.current = null;
          reject(new Error('HEIC worker initialization timeout'));
        }, 60000);

        workerRef.current = worker;
        
      } catch (error) {
        console.error('💥 HEIC Manager: Failed to create worker:', error);
        reject(error);
      }
    });

    return initPromiseRef.current;
  }, []);

  const convertHeicFile = useCallback(async (
    file: File, 
    maxSide = 1600, 
    quality = 0.82
  ): Promise<HeicWorkerResult> => {
    try {
      // Ensure worker is initialized
      if (!workerReadyRef.current) {
        await initializeWorker();
      }

      const worker = workerRef.current;
      if (!worker || !workerReadyRef.current) {
        throw new Error('HEIC worker not available');
      }

      const taskId = Math.random().toString(36).slice(2, 8);
      
      console.log('🎯 HEIC Manager: Starting conversion task', {
        taskId,
        fileName: file.name,
        fileSize: file.size,
        maxSide,
        quality
      });

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.error('⏰ HEIC Manager: Conversion timeout for task', taskId);
          resolve({ ok: false, code: 'HEIC_CONVERSION_TIMEOUT' });
        }, 60000); // 60 second timeout

        const handleMessage = (e: MessageEvent) => {
          const { type, taskId: responseTaskId, ok, blob, width, height, mime, code, message } = e.data;
          
          if ((type === 'heic-done' || type === 'heic-failed') && responseTaskId === taskId) {
            clearTimeout(timeout);
            worker.removeEventListener('message', handleMessage);
            
            if (type === 'heic-done' && ok) {
              console.log('✅ HEIC Manager: Conversion successful', {
                taskId,
                width,
                height,
                mime,
                blobSize: blob?.size
              });
              resolve({ ok: true, blob, width, height, mime });
            } else {
              console.warn('⚠️ HEIC Manager: Conversion failed', {
                taskId,
                code,
                message
              });
              resolve({ ok: false, code, message });
            }
          }
        };

        worker.addEventListener('message', handleMessage);

        // Send conversion task
        worker.postMessage({
          file,
          maxSide,
          quality,
          timeoutMs: 60000,
          taskId
        });
      });

    } catch (error) {
      console.error('💥 HEIC Manager: Exception during conversion:', error);
      return { 
        ok: false, 
        code: 'HEIC_MANAGER_ERROR', 
        message: error instanceof Error ? error.message : String(error) 
      };
    }
  }, [initializeWorker]);

  const isWorkerReady = useCallback(() => {
    return workerReadyRef.current;
  }, []);

  return {
    convertHeicFile,
    isWorkerReady
  };
};