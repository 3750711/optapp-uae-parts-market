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

// Compress with specific settings with transferable optimization
const compressWithSettings = async (file, maxSide, quality, format, orientation) => {
  if (hasOffscreenCanvas) {
    // Create bitmap from file
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
    bitmap.close(); // Free memory immediately
    
    const blob = await canvas.convertToBlob({
      type: `image/${format}`,
      quality: quality
    });
    
    return blob;
  } else {
    // Improved fallback using basic canvas
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate dimensions
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        
        // Apply orientation and draw
        applyOrientation(ctx, orientation, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to blob
        canvas.toBlob(resolve, `image/${format}`, quality);
      };
      img.onerror = () => resolve(file); // Fallback to original
      img.src = URL.createObjectURL(file);
    });
  }
};

// HEIC/HEIF format detection (improved)
function isHeicFormat(file) {
  const heicTypes = ['image/heic', 'image/heif'];
  if (heicTypes.includes(file.type)) return true;
  
  const name = file.name.toLowerCase();
  if (name.endsWith('.heic') || name.endsWith('.heif')) return true;
  
  // Additional MIME type variants
  if (file.type.includes('heic') || file.type.includes('heif')) return true;
  
  return false;
}

// Optimized single-pass compression with HEIC handling
const smartCompress = async (task) => {
  const { id, file, maxSide = 1600, quality = 0.82, format = 'jpeg' } = task;
  const startTime = performance.now();
  
  try {
    // Early HEIC/HEIF detection and rejection
    if (isHeicFormat(file)) {
      console.log(`❌ HEIC/HEIF format detected: ${file.name}`);
      return {
        id,
        ok: false,
        code: 'UNSUPPORTED_HEIC',
        originalSize: file.size,
        compressedSize: 0,
        compressionMs: performance.now() - startTime,
        passes: 0,
        error: 'HEIC/HEIF format not supported in browser'
      };
    }

    const orientation = await getOrientation(file);
    
    // Single optimized pass with aggressive settings
    const blob = await compressWithSettings(
      file,
      maxSide,
      quality,
      format,
      orientation
    );
    
    const compressionMs = performance.now() - startTime;
    
    return {
      id,
      ok: true,
      blob,
      originalSize: file.size,
      compressedSize: blob.size,
      compressionMs: Math.round(compressionMs),
      passes: 1,
      method: 'smart'
    };
  } catch (error) {
    console.error(`❌ Compression failed for ${file.name}:`, error);
    
    return {
      id,
      ok: false,
      originalSize: file.size,
      compressedSize: 0,
      compressionMs: performance.now() - startTime,
      passes: 0,
      method: 'original',
      error: error.message
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