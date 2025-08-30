import HeicWorker from '@/workers/heic-pipeline.worker.js?worker&inline';

type ConvertOptions = { maxSide?: number; quality?: number; budgetKB?: number; timeoutMs?: number };

export function createHeicWorkerManager() {
  const worker = new HeicWorker();

  const heicLibUrl = new URL('/vendor/heic2any/heic2any.min.js', window.location.origin).href;
  const wasmBaseUrl = new URL('/vendor/heic2any/', window.location.origin).href;

  // init (однократно)
  worker.postMessage({ type: 'init', heicLibUrl, wasmBaseUrl });

  function convert(file: File, opts: ConvertOptions = {}) {
    const taskId = Math.random().toString(36).slice(2, 8);
    const payload = { type: 'convert', taskId, file, ...opts };

    return new Promise<{ blob: Blob; name: string; mime: string }>((resolve, reject) => {
      const onMsg = (e: MessageEvent) => {
        const m = e.data || {};
        if (m.type === 'heic-init-error') {
          worker.removeEventListener('message', onMsg);
          reject(new Error(`HEIC init failed: ${m.error}`));
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
      worker.postMessage(payload);
    });
  }

  return { convert };
}

// Backward compatibility
export function useHeicWorkerManager() {
  return createHeicWorkerManager();
}