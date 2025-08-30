// WebWorker for background image compression
// Supports OffscreenCanvas for modern browsers, fallback for older ones

interface CompressionTask {
  id: string;
  file: File;
  maxSide: number;
  quality: number;
  format: 'webp' | 'jpeg';
}

interface CompressionResult {
  id: string;
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  error?: string;
}

// Check for OffscreenCanvas support
const hasOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';

// EXIF orientation is now handled by Cloudinary automatically
// Removed getOrientation and applyOrientation functions to prevent double processing

// Modern compression with OffscreenCanvas
const compressWithOffscreenCanvas = async (task: CompressionTask): Promise<Blob> => {
  const bitmap = await createImageBitmap(task.file);
  const { width, height } = bitmap;
  
  // Calculate new dimensions
  const scale = Math.min(1, task.maxSide / Math.max(width, height));
  const newWidth = Math.round(width * scale);
  const newHeight = Math.round(height * scale);
  
  // Create canvas - Cloudinary will handle orientation automatically
  const canvas = new OffscreenCanvas(newWidth, newHeight);
  const ctx = canvas.getContext('2d')!;
  
  // Draw and compress - no manual rotation needed
  ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);
  bitmap.close();
  
  return await canvas.convertToBlob({
    type: `image/${task.format}`,
    quality: task.quality
  });
};

// Fallback compression for older browsers
const compressWithFallback = async (task: CompressionTask): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      const { width, height } = img;
      
      // Calculate new dimensions
      const scale = Math.min(1, task.maxSide / Math.max(width, height));
      const newWidth = Math.round(width * scale);
      const newHeight = Math.round(height * scale);
      
      // Create canvas - Cloudinary handles orientation
      const canvas = new OffscreenCanvas(newWidth, newHeight);
      const ctx = canvas.getContext('2d')!;
      
      // Draw without manual orientation correction
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      canvas.convertToBlob({
        type: `image/${task.format}`,
        quality: task.quality
      }).then(resolve).catch(reject);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(task.file);
  });
};

// Main compression function
const compressImage = async (task: CompressionTask): Promise<CompressionResult> => {
  try {
    const blob = hasOffscreenCanvas 
      ? await compressWithOffscreenCanvas(task)
      : await compressWithFallback(task);
    
    return {
      id: task.id,
      blob,
      originalSize: task.file.size,
      compressedSize: blob.size
    };
  } catch (error) {
    return {
      id: task.id,
      blob: task.file, // Return original file as blob
      originalSize: task.file.size,
      compressedSize: task.file.size,
      error: error instanceof Error ? error.message : 'Compression failed'
    };
  }
};

// Worker message handler
self.onmessage = async (e: MessageEvent<CompressionTask>) => {
  const task = e.data;
  const result = await compressImage(task);
  
  // Transfer the ArrayBuffer to avoid copying
  const arrayBuffer = await result.blob.arrayBuffer();
  
  self.postMessage({
    ...result,
    blob: new Blob([arrayBuffer], { type: result.blob.type })
  }, { transfer: [arrayBuffer] });
};