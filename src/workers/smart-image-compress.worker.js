// Smart Image Compression Worker - JavaScript version for Vite compatibility
// Two-pass compression to hit specific file size targets

// Check for OffscreenCanvas support
const hasOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';

// EXIF orientation correction
const getOrientation = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const view = new DataView(e.target?.result);
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
const applyOrientation = (ctx, orientation, width, height) => {
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
const compressWithSettings = async (file, maxSide, quality, format, orientation) => {
  if (hasOffscreenCanvas) {
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
    const ctx = canvas.getContext('2d');
    
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
    // Fallback - return original file if no OffscreenCanvas
    return file;
  }
};

// Optimized single-pass compression (faster approach)
const smartCompress = async (task) => {
  const startTime = performance.now();
  
  try {
    const orientation = await getOrientation(task.file);
    
    // More aggressive initial settings based on target size
    let currentMaxSide = task.baseMaxSide;
    let currentQuality = task.baseQuality;
    
    // Pre-adjust settings based on file size vs target size ratio
    const sizeRatio = task.file.size / task.targetSize;
    
    if (sizeRatio > 3) {
      // Large file - be aggressive immediately
      currentMaxSide = Math.min(currentMaxSide, 1024);
      currentQuality = Math.min(currentQuality, 0.72);
    } else if (sizeRatio > 1.5) {
      // Medium oversizing - moderate compression
      currentQuality = Math.min(currentQuality, 0.78);
    }
    
    // Single optimized pass
    const blob = await compressWithSettings(
      task.file,
      currentMaxSide,
      currentQuality,
      task.format,
      orientation
    );
    
    const compressionMs = performance.now() - startTime;
    
    return {
      id: task.id,
      blob,
      originalSize: task.file.size,
      compressedSize: blob.size,
      compressionMs: Math.round(compressionMs),
      passes: 1,
      finalMaxSide: currentMaxSide,
      finalQuality: currentQuality
    };
  } catch (error) {
    console.warn('Worker compression failed, returning original file:', error);
    return {
      id: task.id,
      blob: task.file,
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
self.onmessage = async (e) => {
  const task = e.data;
  const result = await smartCompress(task);
  
  // Send result back
  self.postMessage(result);
};