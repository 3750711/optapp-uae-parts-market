/* global self */
let ready = false;
let heic2any = null;

function assert(ok, msg){ if(!ok) throw new Error(msg) }

// Утилита — toBlob для OffscreenCanvas/Canvas
async function toBlob(canvas, type, q){
  if (canvas.convertToBlob) return canvas.convertToBlob({ type, quality: q });
  return new Promise((res, rej)=> (canvas).toBlob(b=> b? res(b) : rej(new Error('toBlob failed')), type, q));
}

self.onmessage = async (ev) => {
  const msg = ev.data || {};
  try {
    if (msg.type === 'init') {
      // ⚠️ только абсолютные URL из главного потока!
      const { heicLibUrl, wasmBaseUrl } = msg;
      assert(heicLibUrl && /^https?:\/\//.test(heicLibUrl), 'bad heicLibUrl');
      assert(wasmBaseUrl && /^https?:\/\//.test(wasmBaseUrl), 'bad wasmBaseUrl');

      // Шим до загрузки UMD
      self.window = self;
      self.HEIC2ANY_WASM_BASE_URL = wasmBaseUrl.endsWith('/') ? wasmBaseUrl : wasmBaseUrl + '/';

      // Проверим, что wasm доступен
      const head = await fetch(self.HEIC2ANY_WASM_BASE_URL + 'libheif.wasm', { method: 'HEAD' });
      assert(head.ok, 'wasm not reachable');

      // Подтягиваем UMD (он повесит себя на window.heic2any)
      importScripts(heicLibUrl);
      heic2any = self.heic2any;
      assert(typeof heic2any === 'function', 'heic2any not loaded');

      ready = true;
      self.postMessage({ type: 'heic-ready' });
      return;
    }

    if (msg.type === 'convert') {
      const { taskId, file, maxSide = 1600, quality = 0.82, budgetKB = 320, timeoutMs = 60000 } = msg;
      assert(ready, 'HEIC_WASM_NOT_READY');

      // 1) HEIC → JPEG (через heic2any) — базовое декодирование
      const baseJpeg = await heic2any({ blob: file, toType: 'image/jpeg', quality: 1.0 });

      // 2) Downscale + финальный encode под бюджет
      const bmp = await createImageBitmap(baseJpeg);
      const { width: w, height: h } = bmp;
      const k = Math.min(1, maxSide / Math.max(w, h));
      let tw = Math.max(1, Math.round(w * k));
      let th = Math.max(1, Math.round(h * k));

      let canvas = new OffscreenCanvas(tw, th);
      let ctx = canvas.getContext('2d', { alpha: false });
      ctx.drawImage(bmp, 0, 0, tw, th);

      let q = quality;
      let out = await toBlob(canvas, 'image/jpeg', q);

      for (let i=0; i<2 && out.size > budgetKB*1024; i++){
        q = Math.max(0.6, q - 0.05);
        tw = Math.max(720, Math.round(tw * 0.9));
        th = Math.max(720, Math.round(th * 0.9));
        const c2 = new OffscreenCanvas(tw, th);
        c2.getContext('2d', { alpha: false }).drawImage(canvas, 0, 0, tw, th);
        canvas = c2;
        out = await toBlob(canvas, 'image/jpeg', q);
      }

      bmp.close?.();
      self.postMessage({
        type: 'heic-done',
        taskId,
        ok: true,
        blob: out,
        name: file.name.replace(/\.\w+$/, '.jpg'),
        mime: 'image/jpeg',
        size: out.size
      }, [out]);
      return;
    }
  } catch (e) {
    const taskId = msg.taskId || 'init';
    self.postMessage({ type: msg.type === 'convert' ? 'heic-failed' : 'heic-init-error', taskId, ok: false, error: String(e && e.message || e) });
  }
};