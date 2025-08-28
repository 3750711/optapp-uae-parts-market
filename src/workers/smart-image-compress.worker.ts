// Smart Image Compression Worker with adaptive sizing and time-based targeting
// Two-pass compression to hit specific file size targets

interface SmartCompressionTask {
  id: string;
  file: File;
  baseMaxSide: number;
  baseQuality: number;
  targetSize: number;
  format: 'webp' | 'jpeg';
  networkType: '3g' | '4g' | 'wifi';
}

interface SmartCompressionResult {
  id: string;
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionMs: number;
  passes: number;
  finalMaxSide: number;
  finalQuality: number;
  error?: string;
}

// Check for OffscreenCanvas support
const hasOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';

// EXIF orientation correction (same as before)
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

// Compress with specific settings
const compressWithSettings = async (
  file: File, 
  maxSide: number, 
  quality: number, 
  format: 'webp' | 'jpeg',
  orientation: number
): Promise<Blob> => {
  if (hasOffscreenCanvas) {
    // Use OffscreenCanvas for better performance
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    
    // Calculate new dimensions
    const scale = Math.min(1, maxSide / Math.max(width, height));
    const newWidth = Math.round(width * scale);
    const newHeight = Math.round(height * scale);
    
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
      type: `image/${format}`,
      quality: quality
    });
  } else {
    // Fallback for older browsers
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        
        // Calculate new dimensions
        const scale = Math.min(1, maxSide / Math.max(width, height));
        const newWidth = Math.round(width * scale);
        const newHeight = Math.round(height * scale);
        
        const shouldRotate = orientation >= 5 && orientation <= 8;
        
        // Create canvas
        const canvas = new OffscreenCanvas(
          shouldRotate ? newHeight : newWidth,
          shouldRotate ? newWidth : newHeight
        );
        const ctx = canvas.getContext('2d')!;
        
        // Apply orientation correction
        applyOrientation(ctx, orientation, newWidth, newHeight);
        
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        canvas.convertToBlob({
          type: `image/${format}`,
          quality: quality
        }).then(resolve).catch(reject);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
};

// Smart compression with two-pass optimization
const smartCompress = async (task: SmartCompressionTask): Promise<SmartCompressionResult> => {
  const startTime = performance.now();
  
  try {
    // Get orientation once
    const orientation = await getOrientation(task.file);
    
    // First pass - use base settings
    let currentMaxSide = task.baseMaxSide;
    let currentQuality = task.baseQuality;
    let passes = 1;
    
    let blob = await compressWithSettings(
      task.file, 
      currentMaxSide, 
      currentQuality, 
      task.format,
      orientation
    );
    
    // If file is still too big, do second pass with adjustments
    if (blob.size > task.targetSize && passes < 3) {
      passes++;
      
      const sizeRatio = blob.size / task.targetSize;
      
      if (sizeRatio > 1.4 && currentMaxSide > 1024) {
        // Significantly oversized - reduce dimensions first
        currentMaxSide = Math.round(currentMaxSide * 0.85);
      } else {
        // Slightly oversized - reduce quality
        currentQuality = Math.max(0.68, currentQuality - 0.06);
      }
      
      blob = await compressWithSettings(
        task.file, 
        currentMaxSide, 
        currentQuality, 
        task.format,
        orientation
      );
      
      // Optional third pass if still too big
      if (blob.size > task.targetSize && passes < 3) {
        passes++;
        
        if (currentMaxSide > 1024) {
          currentMaxSide = Math.round(currentMaxSide * 0.9);
        } else {
          currentQuality = Math.max(0.65, currentQuality - 0.05);
        }
        
        blob = await compressWithSettings(
          task.file, 
          currentMaxSide, 
          currentQuality, 
          task.format,
          orientation
        );
      }
    }
    
    const compressionMs = performance.now() - startTime;
    
    return {
      id: task.id,
      blob,
      originalSize: task.file.size,
      compressedSize: blob.size,
      compressionMs: Math.round(compressionMs),
      passes,
      finalMaxSide: currentMaxSide,
      finalQuality: currentQuality
    };
  } catch (error) {
    return {
      id: task.id,
      blob: task.file, // Return original file as fallback
      originalSize: task.file.size,
      compressedSize: task.file.size,
      compressionMs: performance.now() - startTime,
      passes: 0,
      finalMaxSide: task.baseMaxSide,
      finalQuality: task.baseQuality,
      error: error instanceof Error ? error.message : 'Compression failed'
    };
  }
};

// Worker message handler
self.onmessage = async (e: MessageEvent<SmartCompressionTask>) => {
  const task = e.data;
  const result = await smartCompress(task);
  
  // Transfer the ArrayBuffer to avoid copying
  const arrayBuffer = await result.blob.arrayBuffer();
  
  self.postMessage({
    ...result,
    blob: new Blob([arrayBuffer], { type: result.blob.type })
  }, { transfer: [arrayBuffer] });
};