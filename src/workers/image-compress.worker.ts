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

// EXIF orientation correction
const getOrientation = async (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const view = new DataView(e.target?.result as ArrayBuffer);
      if (view.getUint16(0, false) !== 0xFFD8) return resolve(1);
      
      const length = view.byteLength;
      let offset = 2;
      
      while (offset < length) {
        const marker = view.getUint16(offset, false);
        offset += 2;
        
        if (marker === 0xFFE1) {
          const little = view.getUint16(offset + 4, false) === 0x4949;
          offset += view.getUint16(offset, false);
          const tiffOffset = view.getUint32(offset + 4, little) + offset + 4;
          const tags = view.getUint16(tiffOffset, little);
          
          for (let i = 0; i < tags; i++) {
            const tagOffset = tiffOffset + i * 12 + 2;
            if (view.getUint16(tagOffset, little) === 0x0112) {
              return resolve(view.getUint16(tagOffset + 8, little));
            }
          }
        } else if ((marker & 0xFF00) !== 0xFF00) break;
        else offset += view.getUint16(offset, false);
      }
      resolve(1);
    };
    reader.readAsArrayBuffer(file.slice(0, 64 * 1024));
  });
};

// Apply orientation correction to canvas
const applyOrientation = (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, orientation: number, width: number, height: number) => {
  switch (orientation) {
    case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
    case 3: ctx.transform(-1, 0, 0, -1, width, height); break;
    case 4: ctx.transform(1, 0, 0, -1, 0, height); break;
    case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
    case 6: ctx.transform(0, 1, -1, 0, height, 0); break;
    case 7: ctx.transform(0, -1, -1, 0, height, width); break;
    case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
  }
};

// Modern compression with OffscreenCanvas
const compressWithOffscreenCanvas = async (task: CompressionTask): Promise<Blob> => {
  const bitmap = await createImageBitmap(task.file);
  const { width, height } = bitmap;
  
  // Calculate new dimensions
  const scale = Math.min(1, task.maxSide / Math.max(width, height));
  const newWidth = Math.round(width * scale);
  const newHeight = Math.round(height * scale);
  
  // Get orientation
  const orientation = await getOrientation(task.file);
  const shouldRotate = orientation >= 5 && orientation <= 8;
  
  // Create canvas with corrected dimensions
  const canvas = new OffscreenCanvas(
    shouldRotate ? newHeight : newWidth,
    shouldRotate ? newWidth : newHeight
  );
  const ctx = canvas.getContext('2d')!;
  
  // Apply orientation correction
  applyOrientation(ctx, orientation, newWidth, newHeight);
  
  // Draw and compress
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
      
      // Create canvas (this runs in main thread in older browsers)
      const canvas = new OffscreenCanvas(newWidth, newHeight);
      const ctx = canvas.getContext('2d')!;
      
      // Get orientation and apply correction
      const orientation = await getOrientation(task.file);
      applyOrientation(ctx, orientation, newWidth, newHeight);
      
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