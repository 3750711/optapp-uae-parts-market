/* global self, importScripts, OffscreenCanvas */
let heicReady = false;
try {
  // Load UMD + adjacent libheif.wasm (relative path from /vendor/heic2any/)
  importScripts('/vendor/heic2any/heic2any.min.js');
  heicReady = typeof self.heic2any === 'function';
} catch (_) { 
  heicReady = false; 
}

self.onmessage = async (e) => {
  const { file, maxSide = 1600, quality = 0.82, timeoutMs = 5000 } = e.data || {};
  const abort = new Promise((_, rej) => 
    setTimeout(() => rej(new Error('HEIC_WASM_TIMEOUT')), timeoutMs)
  );

  try {
    if (!heicReady) throw new Error('HEIC_WASM_NOT_READY');

    // 1) HEIC → JPEG (blob). heic2any calls libheif.wasm internally
    const conv = self.heic2any({ blob: file, toType: 'image/jpeg', quality });
    const jpegBlob = await Promise.race([conv, abort]);

    // 2) Optionally resize to maxSide
    const bmp = await createImageBitmap(jpegBlob);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));

    let out = jpegBlob;
    if (scale < 1) {
      const canvas = new OffscreenCanvas(w, h);
      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.drawImage(bmp, 0, 0, w, h);
      out = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    }

    self.postMessage({ 
      ok: true, 
      blob: out, 
      width: w, 
      height: h, 
      mime: 'image/jpeg' 
    });
  } catch (err) {
    self.postMessage({ 
      ok: false, 
      code: 'HEIC_WASM_FAIL', 
      message: String(err && err.message || err) 
    });
  }
};