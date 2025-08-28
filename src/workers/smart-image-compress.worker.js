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

    // HEIC/HEIF не декодируется в браузерах → явно сообщаем
    if (type.includes('heic') || type.includes('heif')) {
      return self.postMessage({ ok: false, code: 'UNSUPPORTED_HEIC', message: 'HEIC/HEIF is not supported in browser' });
    }

    const maxSide = clampInt(p.maxSide, 256, 8192, 1600);
    const jpegQuality = clampFloat(p.jpegQuality, 0.5, 0.95, 0.82);
    const prefer = (p.prefer === 'webp') ? 'webp' : 'jpeg';
    const targetBytes = isFiniteNumber(p.targetBytes) ? Math.max(10_000, Math.floor(p.targetBytes)) : null;
    const twoPass = p.twoPass !== false; // по умолчанию включен

    // Прочитаем ArrayBuffer один раз (для EXIF)
    const buf = await file.arrayBuffer().catch(() => null);
    const orientation = buf ? safeReadExifOrientation(buf) : 1;

    // Декодируем в bitmap/img
    const decoded = await decodeImage(file).catch(() => null);
    if (!decoded) throw new Error('DECODE_FAILED');

    // Первая попытка: оценочный энкод с заданным качеством/стороной
    const pass1 = await renderAndEncode(decoded, orientation, { maxSide, prefer, jpegQuality });
    if (!targetBytes || !twoPass) {
      return self.postMessage({ ok: true, ...pass1 });
    }

    // Если целевой размер задан — подгон по размеру (второй проход)
    const tuned = await tuneToTarget(decoded, orientation, pass1, { targetBytes, prefer, jpegQuality, maxSide });
    return self.postMessage({ ok: true, ...tuned });

  } catch (err) {
    postError('PROCESSING_FAILED', err);
  }
};

// ============== helpers ==============

function clampInt(v, min, max, dflt) {
  const n = Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(max, Math.max(min, Math.floor(n)));
}
function clampFloat(v, min, max, dflt) {
  const n = Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(max, Math.max(min, n));
}
function isFiniteNumber(v) { return typeof v === 'number' && Number.isFinite(v); }

function postError(code, err) {
  const msg = (err && err.message) ? err.message : String(err || code);
  self.postMessage({ ok: false, code, message: msg });
}

// ---- EXIF (safe) ----
// Возвращает 1..8 или 1 при любой проблеме. НИКОГДА не бросает исключение.
function safeReadExifOrientation(arrayBuffer) {
  try {
    const view = new DataView(arrayBuffer);
    const len = view.byteLength;
    // JPEG начинается с FFD8
    if (len < 4 || getU16(view, 0, false) !== 0xFFD8) return 1;

    let offset = 2;
    while (offset + 4 <= len) {
      const marker = getU16(view, offset, false); offset += 2;
      if ((marker & 0xFF00) !== 0xFF00) break; // не маркер
      if (offset + 2 > len) break;
      const size = getU16(view, offset, false); offset += 2;
      if (size < 2 || offset + (size - 2) > len) { offset = len; break; }

      if (marker === 0xFFE1 && size >= 10) { // APP1
        const start = offset;
        // 'Exif\0\0'
        if (start + 6 <= len && getU32(view, start, false) === 0x45786966) {
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
                if (tag === 0x0112) { // Orientation
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
  } catch (_) { /* ignore */ }
  return 1;
}
function getU16(view, off, little) {
  if (off + 2 > view.byteLength) throw new RangeError('U16 OOB');
  return view.getUint16(off, little);
}
function getU32(view, off, little) {
  if (off + 4 > view.byteLength) throw new RangeError('U32 OOB');
  return view.getUint32(off, little);
}

// ---- decode with fallbacks ----
async function decodeImage(file) {
  // createImageBitmap может зависнуть в WebView → даём таймаут
  const url = URL.createObjectURL(file);
  try {
    const bmp = await withTimeout(createImageBitmap({ src: url }), 3000).catch(() => null);
    if (bmp) return bmp;
  } finally {
    URL.revokeObjectURL(url);
  }
  // Фолбэк через <img>
  return await decodeViaImg(file);
}
function decodeViaImg(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
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

  // 1) OffscreenCanvas
  if (typeof OffscreenCanvas !== 'undefined') {
    try {
      const canvas = new OffscreenCanvas(outW, outH);
      const ctx = canvas.getContext('2d', { alpha: false });
      drawOriented(ctx, src, orientation, outW, outH);

      const mimes = prefer === 'webp'
        ? ['image/webp', 'image/jpeg', 'image/png']
        : ['image/jpeg', 'image/webp', 'image/png'];

      for (const m of mimes) {
        try {
          const blob = await canvas.convertToBlob({ type: m, quality: m.includes('jpeg') ? jpegQuality : undefined });
          if (blob && blob.size) return buildResult(blob, srcW, srcH, outW, outH, m);
        } catch (_) {}
      }
    } catch (_) {}
  }

  // 2) HTMLCanvasElement fallback
  const canvas = createHtmlCanvas(outW, outH);
  const ctx = canvas.getContext('2d', { alpha: false });
  drawOriented(ctx, src, orientation, outW, outH);

  const mimes = prefer === 'webp'
    ? ['image/webp', 'image/jpeg', 'image/png']
    : ['image/jpeg', 'image/webp', 'image/png'];

  const blob = await toBlobSafe(canvas, mimes, jpegQuality);
  if (!blob) throw new Error('ENCODE_FAILED');

  return buildResult(blob, srcW, srcH, outW, outH, blob.type || (prefer === 'webp' ? 'image/webp' : 'image/jpeg'));
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

function createHtmlCanvas(w, h) {
  // В воркере HTMLCanvasElement может отсутствовать — но мы в этом блоке уже не в воркере OffscreenCanvas
  const c = new OffscreenCanvas ? new OffscreenCanvas(w, h) : (() => {
    const el = new (self.HTMLCanvasElement || OffscreenCanvas)(w, h); return el;
  })();
  if (c.width !== w) c.width = w;
  if (c.height !== h) c.height = h;
  return c;
}

function toBlobSafe(canvas, mimes, jpegQuality) {
  return new Promise(async (resolve) => {
    for (const m of mimes) {
      try {
        if (canvas.convertToBlob) {
          const b = await canvas.convertToBlob({ type: m, quality: m.includes('jpeg') ? jpegQuality : undefined });
          if (b) return resolve(b);
        }
        // Если это настоящий HTMLCanvasElement
        if (typeof canvas.toBlob === 'function') {
          let settled = false;
          const timer = setTimeout(() => { if (!settled) { settled = true; resolve(null); } }, 3000);
          canvas.toBlob((b) => { if (!settled) { settled = true; clearTimeout(timer); resolve(b || null); } }, m, m.includes('jpeg') ? jpegQuality : undefined);
          return; // ждём callback
        }
      } catch (_) {}
    }
    resolve(null);
  });
}

function buildResult(blob, inW, inH, outW, outH, mime) {
  return {
    blob,
    mime,
    width: outW,
    height: outH,
    original: { width: inW, height: inH, size: undefined },
    size: blob.size
  };
}

// ---- two-pass tuning (target size) ----
async function tuneToTarget(src, orientation, firstPass, opts) {
  const { targetBytes, prefer, jpegQuality, maxSide } = opts;
  // Если уже в целевом диапазоне (±15%) — принимаем
  if (within(firstPass.size, targetBytes, 0.15)) return firstPass;

  // Подгоняем качеством и стороной
  let q = jpegQuality;
  let side = maxSide;
  for (let i = 0; i < 3; i++) {
    // если слишком большой → снижаем качество и чуть уменьшаем сторону
    if (firstPass.size > targetBytes) {
      q = Math.max(0.6, q - 0.08);
      side = Math.max(720, Math.round(side * 0.9));
    } else {
      // слишком маленький → чуть поднимаем качество (не выше 0.9)
      q = Math.min(0.9, q + 0.06);
    }
    const pass = await renderAndEncode(src, orientation, { maxSide: side, prefer, jpegQuality: q });
    if (within(pass.size, targetBytes, 0.15)) return pass;
    firstPass = pass;
  }
  return firstPass;
}
function within(value, target, tol) {
  const d = Math.abs(value - target);
  return d <= target * tol;
}