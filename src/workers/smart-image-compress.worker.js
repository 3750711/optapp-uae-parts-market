/* eslint-disable no-restricted-globals */
// === Public API ===
// postMessage({ file, maxSide?: number=1600, jpegQuality?: number=0.82, prefer?: 'jpeg'|'webp'='jpeg',
//               targetBytes?: number, twoPass?: boolean=true })
// Ответ: { ok:true, blob, mime, width, height, original: {width,height,size}, size } | { ok:false, code, message }

self.onmessage = async (e) => {
  const p = e.data || {};
  try {
    const file = p.file;
    if (!file) return postError('NO_FILE', 'No file provided');

    const type = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();
    
    // Skip HEIC files - they should be handled upstream
    const isHeicFile = type.includes('heic') || type.includes('heif') || /\.hei[cf]$/.test(name);
    console.log('🔍 Smart Compress: File analysis', {
      fileName: name,
      fileType: type,
      fileSize: file.size,
      isHeicFile
    });
    
    if (isHeicFile) {
      console.log('⚠️ Smart Compress: HEIC file detected, skipping compression');
      return postError('HEIC_NOT_SUPPORTED', 'HEIC files should be handled upstream');
    }

    const maxSide = clampInt(p.maxSide, 256, 8192, 1600);
    const jpegQuality = clampFloat(p.jpegQuality, 0.5, 0.95, 0.82);
    const prefer = (p.prefer === 'webp') ? 'webp' : 'jpeg';
    const targetBytes = isFiniteNumber(p.targetBytes) ? Math.max(10_000, Math.floor(p.targetBytes)) : null;
    const twoPass = p.twoPass !== false;

    const buf = await file.arrayBuffer().catch(() => null);
    const orientation = buf ? safeReadExifOrientation(buf) : 1;

    const decoded = await decodeImage(file).catch(() => null);
    if (!decoded) throw new Error('DECODE_FAILED');

    const pass1 = await renderAndEncode(decoded, orientation, { maxSide, prefer, jpegQuality });
    if (!targetBytes || !twoPass) {
      return self.postMessage({ ok: true, ...pass1 });
    }

    const tuned = await tuneToTarget(decoded, orientation, pass1, { targetBytes, prefer, jpegQuality, maxSide });
    return self.postMessage({ ok: true, ...tuned });
  } catch (err) {
    postError('PROCESSING_FAILED', err);
  }
};

function clampInt(v, min, max, dflt) { const n = Number(v); if (!Number.isFinite(n)) return dflt; return Math.min(max, Math.max(min, Math.floor(n))); }
function clampFloat(v, min, max, dflt) { const n = Number(v); if (!Number.isFinite(n)) return dflt; return Math.min(max, Math.max(min, n)); }
function isFiniteNumber(v) { return typeof v === 'number' && Number.isFinite(v); }
function postError(code, err) { const msg = (err && err.message) ? err.message : String(err || code); self.postMessage({ ok: false, code, message: msg }); }

// ---- EXIF (safe) ----
function safeReadExifOrientation(arrayBuffer) {
  try {
    const view = new DataView(arrayBuffer);
    const len = view.byteLength;
    if (len < 4 || getU16(view, 0, false) !== 0xFFD8) return 1; // JPEG only
    let offset = 2;
    while (offset + 4 <= len) {
      const marker = getU16(view, offset, false); offset += 2;
      if ((marker & 0xFF00) !== 0xFF00) break;
      if (offset + 2 > len) break;
      const size = getU16(view, offset, false); offset += 2;
      if (size < 2 || offset + (size - 2) > len) { offset = len; break; }
      if (marker === 0xFFE1 && size >= 10) {
        const start = offset;
        if (start + 6 <= len && getU32(view, start, false) === 0x45786966) { // "Exif"
          const tiff = start + 6;
          if (tiff + 8 <= len) {
            const little = (getU16(view, tiff, false) === 0x4949);
            const ifd0 = tiff + getU32(view, tiff + 4, little);
            if (ifd0 + 2 <= len) {
              const entries = getU16(view, ifd0, little);
              for (let i = 0; i < entries; i++) {
                const entry = ifd0 + 2 + i * 12;
                if (entry + 12 > len) break;
                const tag = getU16(view, entry, little);
                if (tag === 0x0112) {
                  const valOff = entry + 8;
                  if (valOff + 2 <= len) {
                    const ori = getU16(view, valOff, little);
                    if (ori >= 1 && ori <= 8) return ori;
                  }
                }
              }
            }
          }
        }
      }
      offset = offset + (size - 2);
    }
  } catch (_) {}
  return 1;
}
function getU16(view, off, little) { if (off + 2 > view.byteLength) throw new RangeError('U16 OOB'); return view.getUint16(off, little); }
function getU32(view, off, little) { if (off + 4 > view.byteLength) throw new RangeError('U32 OOB'); return view.getUint32(off, little); }

// ---- decode with fallbacks ----
async function decodeImage(file) {
  try {
    // Use file directly with createImageBitmap
    const bitmap = await withTimeout(createImageBitmap(file), 3000);
    if (bitmap) return bitmap;
  } catch (err) {
    console.warn('Worker: createImageBitmap failed:', err);
  }
  
  // Fallback to ArrayBuffer method
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bitmap = await withTimeout(createImageBitmap(arrayBuffer), 3000);
    if (bitmap) return bitmap;
  } catch (err) {
    console.warn('Worker: ArrayBuffer decode failed:', err);
  }
  
  throw new Error('DECODE_FAILED');
}

function withTimeout(promise, ms) { 
  return new Promise((res, rej) => { 
    const t = setTimeout(() => rej(new Error('TIMEOUT')), ms); 
    promise.then(v => { clearTimeout(t); res(v); }, e => { clearTimeout(t); rej(e); }); 
  }); 
}

// ---- render & encode ----
async function renderAndEncode(src, orientation, { maxSide, prefer, jpegQuality }) {
  const srcW = src.width, srcH = src.height;
  const rotated = orientation >= 5 && orientation <= 8;
  const inW = rotated ? srcH : srcW;
  const inH = rotated ? srcW : srcH;
  const scale = Math.min(1, maxSide / Math.max(inW, inH));
  const outW = Math.max(1, Math.round(inW * scale));
  const outH = Math.max(1, Math.round(inH * scale));

  if (typeof OffscreenCanvas !== 'undefined') {
    try {
      const canvas = new OffscreenCanvas(outW, outH);
      const ctx = canvas.getContext('2d', { alpha: false });
      drawOriented(ctx, src, orientation, outW, outH);
      const mimes = prefer === 'webp' ? ['image/webp', 'image/jpeg', 'image/png'] : ['image/jpeg', 'image/webp', 'image/png'];
      for (const m of mimes) {
        try {
          const blob = await canvas.convertToBlob({ type: m, quality: m.includes('jpeg') ? jpegQuality : undefined });
          if (blob && blob.size) return buildResult(blob, srcW, srcH, outW, outH, m);
        } catch (_) {}
      }
    } catch (_) {}
  }

  // Fallback without OffscreenCanvas
  throw new Error('ENCODE_FAILED');
}

function drawOriented(ctx, src, orientation, w, h) {
  ctx.save();
  switch (orientation) {
    case 2: ctx.translate(w, 0); ctx.scale(-1, 1); break;
    case 3: ctx.translate(w, h); ctx.rotate(Math.PI); break;
    case 4: ctx.translate(0, h); ctx.scale(1, -1); break;
    case 5: ctx.rotate(0.5 * Math.PI); ctx.scale(1, -1); ctx.translate(0, -w); [w, h] = [h, w]; break;
    case 6: ctx.rotate(0.5 * Math.PI); ctx.translate(0, -h); [w, h] = [h, w]; break;
    case 7: ctx.rotate(0.5 * Math.PI); ctx.translate(w, -h); ctx.scale(-1, 1); [w, h] = [h, w]; break;
    case 8: ctx.rotate(-0.5 * Math.PI); ctx.translate(-w, 0); [w, h] = [h, w]; break;
  }
  ctx.drawImage(src, 0, 0, w, h);
  ctx.restore();
}

function buildResult(blob, inW, inH, outW, outH, mime) {
  return { blob, mime, width: outW, height: outH, original: { width: inW, height: inH, size: undefined }, size: blob.size };
}

// ---- two-pass tuning (target size) ----
async function tuneToTarget(src, orientation, firstPass, opts) {
  const { targetBytes, prefer, jpegQuality, maxSide } = opts;
  if (within(firstPass.size, targetBytes, 0.15)) return firstPass;
  let q = jpegQuality, side = maxSide, cur = firstPass;
  for (let i = 0; i < 3; i++) {
    if (cur.size > targetBytes) { q = Math.max(0.6, q - 0.08); side = Math.max(720, Math.round(side * 0.9)); }
    else { q = Math.min(0.9, q + 0.06); }
    cur = await renderAndEncode(src, orientation, { maxSide: side, prefer, jpegQuality: q });
    if (within(cur.size, targetBytes, 0.15)) break;
  }
  return cur;
}
function within(value, target, tol) { const d = Math.abs(value - target); return d <= target * tol; }