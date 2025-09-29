/**
 * Web Worker for image compression
 * Runs in background thread to prevent UI blocking
 */

// Import imageCompression from CDN for worker context
importScripts('https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js');

// Worker state
let isProcessing = false;
let shouldAbort = false;

// Compression logic with abort support
async function compressImageInWorker(file, options, taskId) {
  if (shouldAbort) {
    throw new Error('ABORTED');
  }

  isProcessing = true;
  const startTime = Date.now(); // Начало отслеживания времени
  
  try {
    // Send progress updates
    self.postMessage({
      type: 'progress',
      taskId,
      stage: 'starting',
      progress: 0
    });

    if (shouldAbort) throw new Error('ABORTED');

    // Perform compression with periodic abort checks
    const compressionOptions = {
      maxSizeMB: options.maxSizeMB || 1,
      maxWidthOrHeight: options.maxWidthOrHeight || 1920,
      initialQuality: options.initialQuality || 0.8,
      fileType: options.fileType || 'image/webp',
      useWebWorker: false, // We're already in a worker
      preserveExif: false,
      // Add progress callback
      onProgress: (progress) => {
        if (shouldAbort) throw new Error('ABORTED');
        
        self.postMessage({
          type: 'progress',
          taskId,
          stage: 'compressing',
          progress: Math.round(progress * 100)
        });
      }
    };

    console.log(`🔧 Worker compressing: ${file.name}, original size: ${file.size} bytes`);
    
    const compressedFile = await imageCompression(file, compressionOptions);
    
    if (shouldAbort) throw new Error('ABORTED');

    const compressionRatio = Math.round((1 - compressedFile.size / file.size) * 100);
    const compressionMs = Date.now() - startTime; // Вычисление времени сжатия
    
    console.log(`✅ Worker compression complete: ${file.name}`, {
      originalSize: file.size,
      compressedSize: compressedFile.size,
      ratio: compressionRatio + '%',
      compressionMs: compressionMs + 'ms'
    });

    // Send final result
    self.postMessage({
      type: 'success',
      taskId,
      result: {
        compressedFile,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio,
        compressionMs,
        compressionApplied: true
      }
    });

  } catch (error) {
    if (error.message === 'ABORTED' || shouldAbort) {
      console.log(`🛑 Worker compression aborted for: ${file.name}`);
      self.postMessage({
        type: 'aborted',
        taskId
      });
    } else {
      console.warn(`⚠️ Worker compression failed for: ${file.name}, using original`, error);
      // Send original file as fallback
      self.postMessage({
        type: 'success',
        taskId,
        result: {
          compressedFile: file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 0,
          compressionApplied: false
        }
      });
    }
  } finally {
    isProcessing = false;
  }
}

// Handle incoming messages
self.addEventListener('message', async (event) => {
  const { type, file, options, taskId, msgId } = event.data;
  
  switch (type) {
    case 'ping':
      console.log('📥 Worker received ping with msgId:', msgId);
      self.postMessage({
        type: 'pong',
        msgId: msgId
      });
      break;
      
    case 'compress':
      try {
        await compressImageInWorker(file, options, taskId);
      } catch (error) {
        self.postMessage({
          type: 'error',
          taskId,
          error: error.message
        });
      }
      break;
      
    case 'abort':
      console.log('🛑 Worker received abort signal');
      shouldAbort = true;
      if (!isProcessing) {
        self.postMessage({ type: 'aborted', taskId: 'all' });
      }
      break;
      
    case 'reset':
      shouldAbort = false;
      isProcessing = false;
      console.log('🔄 Worker state reset');
      break;
      
    default:
      console.warn('Unknown message type:', type);
  }
});

// Handle worker errors
self.addEventListener('error', (error) => {
  console.error('❌ Worker error:', error);
  self.postMessage({
    type: 'error',
    error: error.message
  });
});

console.log('🔧 Image compression worker initialized');