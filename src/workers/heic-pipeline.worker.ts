// IMPORTANT: this is a module worker, connect as ?worker&inline

// Message types
type InitMsg = { type: 'init'; heicLibUrl: string; wasmBaseUrl: string };
type ConvertMsg = { type: 'convert'; taskId: string; file: File; maxSide?: number; quality?: number; budgetKB?: number; timeoutMs?: number };
type AnyMsg = InitMsg | ConvertMsg;

let heicReady = false;
let heic2anyFn: any = null;

// util: toBlob with promise
const canvasToBlob = (canvas: OffscreenCanvas, type: string, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    // @ts-ignore
    canvas.convertToBlob ? canvas.convertToBlob({ type, quality }).then(resolve, reject)
      : (canvas as any).toBlob((b: Blob | null) => b ? resolve(b) : reject(new Error('toBlob failed')), type, quality);
  });

async function initHeic(heicLibUrl: string, wasmBaseUrl: string) {
  if (heicReady) return;
  // SHIM "window" for UMD
  (self as any).window = self;
  // Set base where to load wasm/js libheif from
  (self as any).HEIC2ANY_WASM_BASE_URL = wasmBaseUrl.endsWith('/') ? wasmBaseUrl : wasmBaseUrl + '/';

  // Check that wasm is accessible (early fail)
  const head = await fetch((self as any).HEIC2ANY_WASM_BASE_URL + 'libheif.wasm', { method: 'HEAD' });
  if (!head.ok) throw new Error('WASM not reachable at ' + (self as any).HEIC2ANY_WASM_BASE_URL + 'libheif.wasm');

  // Load UMD bundle (dynamically, after shim)
  // In module worker we can't use importScripts, so use dynamic import with absolute URL
  await import(/* @vite-ignore */ heicLibUrl);

  heic2anyFn = (self as any).heic2any;
  if (typeof heic2anyFn !== 'function') throw new Error('heic2any not loaded');
  heicReady = true;
  // Tell manager (optional)
  (self as any).postMessage({ type: 'heic-ready' });
}

// HEIC decode (to JPEG-blob, without final resize/quality)
async function heicToJpegBlob(src: Blob, quality = 1.0): Promise<Blob> {
  // heic2any returns Blob of target type
  const out: Blob = await heic2anyFn({ blob: src, toType: 'image/jpeg', quality });
  return out;
}

// Universal downscale + final encoding to JPEG
async function downscaleAndEncodeJPEG(input: Blob, maxSide = 1600, quality = 0.82, budgetKB = 320) {
  const bmp = await createImageBitmap(input);
  // Calculate dimensions
  const { width: w, height: h } = bmp;
  const k = Math.min(1, maxSide / Math.max(w, h));
  const targetW = Math.max(1, Math.round(w * k));
  const targetH = Math.max(1, Math.round(h * k));

  const canvas = new OffscreenCanvas(targetW, targetH);
  const ctx = canvas.getContext('2d', { alpha: false })!;
  ctx.drawImage(bmp, 0, 0, targetW, targetH);

  let q = quality;
  let blob = await canvasToBlob(canvas, 'image/jpeg', q);

  // Budget in 2 iterations: reduce quality and slightly reduce side
  for (let i = 0; i < 2 && blob.size > budgetKB * 1024; i++) {
    q = Math.max(0.6, q - 0.05);
    const s = 0.9; // -10%
    const w2 = Math.max(720, Math.round(canvas.width * s));
    const h2 = Math.max(720, Math.round(canvas.height * s));
    if (w2 !== canvas.width || h2 !== canvas.height) {
      const c2 = new OffscreenCanvas(w2, h2);
      const x2 = c2.getContext('2d', { alpha: false })!;
      x2.drawImage(canvas, 0, 0, w2, h2);
      (canvas as any) = c2;
    }
    blob = await canvasToBlob(canvas, 'image/jpeg', q);
  }

  bmp.close?.();
  return blob;
}

self.addEventListener('message', async (e: MessageEvent<AnyMsg>) => {
  const msg = e.data;
  if (msg.type === 'init') {
    try {
      await initHeic(msg.heicLibUrl, msg.wasmBaseUrl);
    } catch (err) {
      (self as any).postMessage({ type: 'heic-init-error', error: String(err) });
    }
    return;
  }

  if (msg.type === 'convert') {
    const { taskId, file, maxSide = 1600, quality = 0.82, budgetKB = 320, timeoutMs = 60000 } = msg;
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);

    try {
      if (!heicReady) throw new Error('HEIC_WASM_NOT_READY');

      // 1) HEIC → JPEG (no quality loss here, only decode→codec)
      const jpegDecoded = await heicToJpegBlob(file, 1.0);

      // 2) Downscale + final encode to JPEG according to budget
      const finalBlob = await downscaleAndEncodeJPEG(jpegDecoded, maxSide, quality, budgetKB);

      clearTimeout(timer);
      (self as any).postMessage({
        type: 'heic-done',
        taskId,
        ok: true,
        blob: finalBlob,
        name: file.name.replace(/\.\w+$/, '.jpg'),
        mime: 'image/jpeg',
        size: finalBlob.size
      }, [finalBlob as any]);
    } catch (err) {
      clearTimeout(timer);
      (self as any).postMessage({ type: 'heic-failed', taskId, ok: false, error: String(err) });
    }
  }
});