let _worker: Worker | null = null;
let _ready = false;
let _inflightPing: Promise<boolean> | null = null;
let _isFirstFileInSession = true;

function createWorker(): Worker {
  console.log('🔧 Creating worker instance...');
  try {
    const worker = new Worker(
      new URL('./smart-image-compress.worker.js', import.meta.url),
      { type: 'module' }
    );
    console.log('✅ Worker instance created successfully');
    return worker;
  } catch (error) {
    console.error('❌ Failed to create worker:', error);
    throw error;
  }
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

export async function pingWorker(timeoutMs = 10000): Promise<boolean> {
  if (_ready) {
    console.log('✅ Worker already ready, skipping ping');
    return true;
  }
  if (_inflightPing) {
    console.log('⏳ Ping already in progress, awaiting...');
    return _inflightPing;
  }

  console.log(`📤 Starting ping to worker (timeout: ${timeoutMs}ms)`);
  
  _inflightPing = new Promise<boolean>((resolve) => {
    const worker = getWorker();
    const msgId = `ping-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let resolved = false;

    console.log(`📤 Sending ping with msgId: ${msgId}`);

    const onMessage = (e: MessageEvent) => {
      console.log('📥 Worker message received:', e.data);
      
      if (e?.data?.type === 'pong' && e?.data?.msgId === msgId) {
        if (!resolved) {
          console.log(`✅ Received matching pong with msgId: ${msgId}`);
          resolved = true;
          _ready = true;
          worker.removeEventListener('message', onMessage);
          worker.removeEventListener('error', onError);
          resolve(true);
        }
      }
    };

    const onError = (error: ErrorEvent) => {
      console.error('❌ Worker error during ping:', error);
      if (!resolved) {
        resolved = true;
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
        resolve(false);
      }
    };

    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);
    
    try {
      worker.postMessage({ type: 'ping', msgId });
      console.log(`📤 Ping message posted successfully`);
    } catch (error) {
      console.error('❌ Failed to post ping message:', error);
      if (!resolved) {
        resolved = true;
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
        resolve(false);
      }
      return;
    }

    setTimeout(() => {
      if (!resolved) {
        console.warn(`⏰ Ping timeout after ${timeoutMs}ms`);
        resolved = true;
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
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
    const success = await pingWorker(); // Use default 10s timeout
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