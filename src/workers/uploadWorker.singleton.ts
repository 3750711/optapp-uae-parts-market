let _worker: Worker | null = null;
let _ready = false;
let _initPromise: Promise<boolean> | null = null;

function createWorker(): Worker {
  console.log('🔧 Creating worker instance...');
  const worker = new Worker('/workers/image-compress-worker.js');
  console.log('✅ Worker created');
  return worker;
}

async function ensureReady(): Promise<boolean> {
  if (_ready && _worker) {
    return true;
  }
  
  if (_initPromise) {
    return _initPromise;
  }
  
  _initPromise = new Promise<boolean>((resolve) => {
    try {
      if (!_worker) {
        _worker = createWorker();
      }
      
      const msgId = `ping-${Date.now()}`;
      let resolved = false;
      
      const onMessage = (e: MessageEvent) => {
        if (e?.data?.type === 'pong' && e?.data?.msgId === msgId) {
          if (!resolved) {
            resolved = true;
            _ready = true;
            _worker!.removeEventListener('message', onMessage);
            _initPromise = null;
            console.log('✅ Worker ready');
            resolve(true);
          }
        }
      };
      
      _worker.addEventListener('message', onMessage);
      _worker.postMessage({ type: 'ping', msgId });
      
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          _worker?.removeEventListener('message', onMessage);
          _initPromise = null;
          console.warn('⚠️ Worker ping timeout');
          resolve(false);
        }
      }, 5000);
      
    } catch (error) {
      console.error('❌ Worker init failed:', error);
      _initPromise = null;
      resolve(false);
    }
  });
  
  return _initPromise;
}

export async function getWorker(): Promise<Worker | null> {
  const ready = await ensureReady();
  return ready ? _worker : null;
}

export function isWorkerReady(): boolean {
  return _ready;
}

export function terminate(): void {
  if (_worker) {
    _worker.terminate();
    _worker = null;
    _ready = false;
    _initPromise = null;
    console.log('🛑 Worker terminated');
  }
}