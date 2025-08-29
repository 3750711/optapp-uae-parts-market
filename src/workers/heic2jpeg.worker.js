/* global self, importScripts, OffscreenCanvas */
let heicReady = false;
console.log('🎯 HEIC Worker: Initializing WASM libraries...');
try {
  // Load UMD + adjacent libheif.wasm (relative path from /vendor/heic2any/)
  importScripts('/vendor/heic2any/heic2any.min.js');
  heicReady = typeof self.heic2any === 'function';
  console.log('✅ HEIC Worker: WASM libraries loaded successfully, heic2any available:', heicReady);
} catch (error) { 
  heicReady = false;
  console.error('❌ HEIC Worker: Failed to load WASM libraries:', error);
}

self.onmessage = async (e) => {
  const startTime = Date.now();
  const { file, maxSide = 1600, quality = 0.82, timeoutMs = 5000 } = e.data || {};
  const taskId = Math.random().toString(36).slice(2, 8);
  
  console.log('📥 HEIC Worker: Received conversion task', {
    taskId,
    fileName: file?.name,
    fileSize: file?.size,
    maxSide,
    quality,
    timeoutMs
  });
  
  const abort = new Promise((_, rej) => 
    setTimeout(() => rej(new Error('HEIC_WASM_TIMEOUT')), timeoutMs)
  );

  try {
    if (!heicReady) {
      console.error('❌ HEIC Worker: WASM not ready for task', taskId);
      throw new Error('HEIC_WASM_NOT_READY');
    }

    // 1) HEIC → JPEG (blob). heic2any calls libheif.wasm internally
    console.log('🔄 HEIC Worker: Starting HEIC→JPEG conversion for task', taskId);
    const convStart = Date.now();
    const conv = self.heic2any({ blob: file, toType: 'image/jpeg', quality });
    const jpegBlob = await Promise.race([conv, abort]);
    const convTime = Date.now() - convStart;
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
      ok: false, 
      code: 'HEIC_WASM_FAIL', 
      message: String(err && err.message || err) 
    });
  }
};