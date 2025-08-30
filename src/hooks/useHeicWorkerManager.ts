import HeicWorker from '@/workers/heic-pipeline.worker?worker&inline';

type ConvertOptions = { maxSide?: number; quality?: number; budgetKB?: number; timeoutMs?: number };

export function useHeicWorkerManager() {
  const worker = new HeicWorker();

  // Absolute URLs (IMPORTANT: from main window!)
  const heicLibUrl = new URL('/vendor/heic2any/heic2any.min.js', window.location.origin).href;
  const wasmBaseUrl = new URL('/vendor/heic2any/', window.location.origin).href;

  // Initialize
  worker.postMessage({ type: 'init', heicLibUrl, wasmBaseUrl });

  function convertHeicFile(file: File, opts: ConvertOptions = {}) {
    const taskId = Math.random().toString(36).slice(2, 8);
    const { maxSide = 1600, quality = 0.82, budgetKB = 320, timeoutMs = 60000 } = opts;

    return new Promise<{ blob: Blob; name: string; mime: string }>((resolve, reject) => {
      const onMsg = (e: MessageEvent) => {
        const m = e.data || {};
        if (m.type === 'heic-init-error') {
          worker.removeEventListener('message', onMsg);
          reject(new Error('HEIC init failed: ' + m.error));
        }
        if (m.type === 'heic-done' && m.taskId === taskId) {
          worker.removeEventListener('message', onMsg);
          resolve({ blob: m.blob, name: m.name, mime: m.mime });
        }
        if (m.type === 'heic-failed' && m.taskId === taskId) {
          worker.removeEventListener('message', onMsg);
          reject(new Error(m.error || 'HEIC conversion failed'));
        }
      };
      worker.addEventListener('message', onMsg);
      worker.postMessage({ type: 'convert', taskId, file, maxSide, quality, budgetKB, timeoutMs });
    });
  }

  return { convertHeicFile };
}