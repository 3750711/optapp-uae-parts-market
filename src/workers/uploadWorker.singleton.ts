let _worker: Worker | null = null;
let _ready = false;
let _inflightPing: Promise<boolean> | null = null;
let _isFirstFileInSession = true;

function createWorker(): Worker {
  return new Worker(
    new URL('./smart-image-compress.worker.js', import.meta.url),
    { type: 'module' }
  );
}

export function getWorker(): Worker {
  if (!_worker) {
    _worker = createWorker();
  }
  return _worker;
}

export function isWorkerReady(): boolean {
  return _ready;
}

export function isFirstFileInSession(): boolean {
  return _isFirstFileInSession;
}

export function markFirstFileProcessed(): void {
  _isFirstFileInSession = false;
}

export async function pingWorker(timeoutMs = 3000): Promise<boolean> {
  if (_ready) return true;
  if (_inflightPing) return _inflightPing;

  _inflightPing = new Promise<boolean>((resolve) => {
    const worker = getWorker();
    const msgId = `ping-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let resolved = false;

    const onMessage = (e: MessageEvent) => {
      if (e?.data?.type === 'pong' && e?.data?.msgId === msgId) {
        if (!resolved) {
          resolved = true;
          _ready = true;
          worker.removeEventListener('message', onMessage);
          resolve(true);
        }
      }
    };

    worker.addEventListener('message', onMessage);
    worker.postMessage({ type: 'ping', msgId });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        worker.removeEventListener('message', onMessage);
        resolve(false);
      }
    }, timeoutMs);
  }).finally(() => {
    _inflightPing = null;
  });

  return _inflightPing;
}

export async function preWarm(opts?: { retries?: number; delayMs?: number }): Promise<boolean> {
  const retries = opts?.retries ?? 3;
  const delayMs = opts?.delayMs ?? 400;
  
  if (_ready) return true;

  for (let i = 0; i < retries; i++) {
    console.log(`🔥 Worker preWarm attempt ${i + 1}/${retries}`);
    const success = await pingWorker(3000);
    if (success) {
      console.log('✅ Worker preWarm successful');
      return true;
    }
    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
    }
  }
  
  console.warn('⚠️ Worker preWarm failed after all retries');
  return false;
}

export function terminate(): void {
  if (_worker) {
    try {
      _worker.terminate();
      console.log('🛑 Worker terminated');
    } catch (error) {
      console.warn('⚠️ Worker termination error:', error);
    } finally {
      _worker = null;
      _ready = false;
      _isFirstFileInSession = true;
      _inflightPing = null;
    }
  }
}

// For testing/development - reset state
export function __resetForTests(): void {
  terminate();
}