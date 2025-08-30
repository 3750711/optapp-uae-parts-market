/* global self, OffscreenCanvas */

// Unified initialization state
let heicInitPromise = null;
let heic2anyFn = null;
let initializationComplete = false;

// Initialize HEIC libraries with window shim
function initHeic() {
  if (heicInitPromise) return heicInitPromise;
  
  heicInitPromise = (async () => {
    try {
      console.log('🎯 HEIC Worker: Starting initialization with window shim...');
      
      // CRITICAL: Set up window shim BEFORE loading UMD
      if (typeof globalThis.window === 'undefined') {
        console.log('🔧 HEIC Worker: Creating window shim (globalThis.window = globalThis)');
        globalThis.window = globalThis;
      }
      
      // Check if WASM file is accessible
      try {
        const wasmResponse = await fetch('/vendor/heic2any/libheif.wasm', { method: 'HEAD' });
        if (!wasmResponse.ok) {
          throw new Error(`WASM file not accessible: ${wasmResponse.status}`);
        }
        console.log('✅ HEIC Worker: WASM file accessibility verified');
      } catch (wasmError) {
        console.warn('⚠️ HEIC Worker: WASM file check failed:', wasmError);
      }
      
      // Dynamically import heic2any UMD build
      const heicUrl = new URL('/vendor/heic2any/heic2any.min.js', self.location).toString();
      console.log('📦 HEIC Worker: Loading heic2any from:', heicUrl);
      
      await import(/* @vite-ignore */ heicUrl);
      
      // After UMD import, function should be available on globalThis
      heic2anyFn = globalThis.heic2any || globalThis.window?.heic2any;
      
      if (typeof heic2anyFn !== 'function') {
        throw new Error('heic2any function not found after import');
      }
      
      console.log('✅ HEIC Worker: heic2any loaded successfully');
      
      // Test with a minimal call to ensure WASM is ready
      try {
        // Note: We can't test conversion without actual data, but we can verify the function exists
        console.log('🧪 HEIC Worker: heic2any function verified, WASM should be ready');
      } catch (testError) {
        console.warn('⚠️ HEIC Worker: Function test warning:', testError);
      }
      
      initializationComplete = true;
      console.log('🎉 HEIC Worker: Initialization completed successfully');
      
      // Notify main thread that worker is ready
      self.postMessage({ type: 'heic-ready' });
      
    } catch (error) {
      console.error('💥 HEIC Worker: Initialization failed:', error);
      initializationComplete = false;
      heic2anyFn = null;
      
      // Notify main thread of initialization failure
      self.postMessage({ 
        type: 'heic-init-error', 
        error: error.message || String(error) 
      });
      
      throw error;
    }
  })();
  
  return heicInitPromise;
}

self.onmessage = async (e) => {
  const startTime = Date.now();
  const { file, maxSide = 1600, quality = 0.82, timeoutMs = 60000, taskId: providedTaskId } = e.data || {};
  const taskId = providedTaskId || Math.random().toString(36).slice(2, 8);
  
  console.log('📥 HEIC Worker: Received conversion task', {
    taskId,
    fileName: file?.name,
    fileSize: file?.size,
    maxSide,
    quality,
    timeoutMs,
    initializationComplete
  });

  try {
    // Wait for initialization to complete
    if (!initializationComplete) {
      console.log('⏳ HEIC Worker: Waiting for initialization to complete...');
      await initHeic();
    }
    
    if (!heic2anyFn || !initializationComplete) {
      console.error('❌ HEIC Worker: WASM not ready for task', taskId);
      throw new Error('HEIC_WASM_NOT_READY');
    }
    
    // Set up abort timeout
    const abortController = new AbortController();
    const abortTimeout = setTimeout(() => {
      abortController.abort();
    }, timeoutMs);
    
    const abort = new Promise((_, rej) => {
      abortController.signal.addEventListener('abort', () => {
        rej(new Error('HEIC_WASM_TIMEOUT'));
      });
    });

    // 1) HEIC → JPEG (blob). heic2any calls libheif.wasm internally
    console.log('🔄 HEIC Worker: Starting HEIC→JPEG conversion for task', taskId);
    const convStart = Date.now();
    const conv = heic2anyFn({ blob: file, toType: 'image/jpeg', quality });
    const jpegBlob = await Promise.race([conv, abort]);
    const convTime = Date.now() - convStart;
    
    clearTimeout(abortTimeout);
    console.log('✅ HEIC Worker: HEIC→JPEG conversion completed', {
      taskId,
      conversionTime: `${convTime}ms`,
      originalSize: file.size,
      jpegSize: jpegBlob.size,
      compressionRatio: `${Math.round((1 - jpegBlob.size / file.size) * 100)}%`
    });

    // 2) Optionally resize to maxSide
    console.log('🖼️ HEIC Worker: Creating bitmap for resizing, task', taskId);
    const bmp = await createImageBitmap(jpegBlob);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    
    console.log('📐 HEIC Worker: Resize parameters', {
      taskId,
      originalDimensions: `${bmp.width}x${bmp.height}`,
      targetDimensions: `${w}x${h}`,
      scale: scale.toFixed(3),
      willResize: scale < 1
    });

    let out = jpegBlob;
    if (scale < 1) {
      console.log('⚡ HEIC Worker: Resizing image on canvas, task', taskId);
      const resizeStart = Date.now();
      const canvas = new OffscreenCanvas(w, h);
      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.drawImage(bmp, 0, 0, w, h);
      out = await canvas.convertToBlob({ type: 'image/jpeg', quality });
      const resizeTime = Date.now() - resizeStart;
      console.log('✅ HEIC Worker: Resize completed', {
        taskId,
        resizeTime: `${resizeTime}ms`,
        finalSize: out.size
      });
    }

    const totalTime = Date.now() - startTime;
    console.log('🎉 HEIC Worker: Task completed successfully', {
      taskId,
      totalTime: `${totalTime}ms`,
      finalDimensions: `${w}x${h}`,
      finalSize: out.size,
      totalCompressionRatio: `${Math.round((1 - out.size / file.size) * 100)}%`
    });

    self.postMessage({ 
      type: 'heic-done',
      taskId,
      ok: true, 
      blob: out, 
      width: w, 
      height: h, 
      mime: 'image/jpeg' 
    });
  } catch (err) {
    const totalTime = Date.now() - startTime;
    console.error('💥 HEIC Worker: Task failed', {
      taskId,
      error: String(err && err.message || err),
      totalTime: `${totalTime}ms`
    });
    self.postMessage({ 
      type: 'heic-failed',
      taskId,
      ok: false, 
      code: 'HEIC_WASM_FAIL', 
      message: String(err && err.message || err) 
    });
  }
};

// Start initialization immediately when worker loads
initHeic().catch(error => {
  console.error('💥 HEIC Worker: Failed to initialize on startup:', error);
});