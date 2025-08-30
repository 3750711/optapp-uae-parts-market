import type { CompressionTask, CompressionResult, WorkerCapabilities } from './types';

export class WorkerPool {
  private workers: { worker: Worker; busy: boolean; capabilities: string }[] = [];
  private pendingTasks: { task: CompressionTask; resolve: (result: CompressionResult) => void; reject: (error: Error) => void }[] = [];
  private capabilities: WorkerCapabilities;
  private maxWorkers: number;

  constructor(capabilities: WorkerCapabilities) {
    this.capabilities = capabilities;
    // Aggressive limits for Telegram Android and low-end devices
    this.maxWorkers = this.getOptimalWorkerCount();
  }

  private getOptimalWorkerCount(): number {
    if (this.capabilities.isLowEndDevice) return 1;
    if (this.capabilities.isMobile) return Math.min(2, navigator.hardwareConcurrency || 2);
    return Math.min(4, navigator.hardwareConcurrency || 4);
  }

  async initWorker(type: 'smart' | 'stable'): Promise<Worker | null> {
    try {
      let worker: Worker;

      if (type === 'smart') {
        // Try inline worker first to avoid network issues
        try {
          const SmartWorkerCtor = await import('../workers/smart-image-compress.worker.js?worker&inline');
          worker = new SmartWorkerCtor.default();
          console.log('✅ Smart worker created with inline import');
        } catch (inlineError) {
          console.warn('⚠️ Inline worker failed, trying URL fallback:', inlineError);
          worker = new Worker(new URL('../workers/smart-image-compress.worker.js', import.meta.url));
        }
      } else {
        // Stable worker fallback
        try {
          const StableWorkerCtor = await import('../workers/image-compress.worker.ts?worker&inline');
          worker = new StableWorkerCtor.default();
          console.log('✅ Stable worker created with inline import');
        } catch (inlineError) {
          console.warn('⚠️ Inline worker failed, trying URL fallback:', inlineError);
          worker = new Worker(new URL('../workers/image-compress.worker.ts', import.meta.url), { type: 'module' });
        }
      }
      
      // Test worker with timeout
      const isWorking = await this.testWorker(worker, type === 'smart' ? 3000 : 5000);
      
      if (isWorking) {
        console.log(`✅ ${type} worker initialized successfully`);
        return worker;
      } else {
        worker.terminate();
        console.warn(`❌ ${type} worker test failed`);
        return null;
      }
    } catch (error) {
      console.warn(`❌ Failed to initialize ${type} worker:`, error);
      return null;
    }
  }

  private async testWorker(worker: Worker, timeout: number): Promise<boolean> {
    return new Promise((resolve) => {
      const testId = 'test-' + Math.random();
      const timer = setTimeout(() => resolve(false), timeout);
      
      const handler = (e: MessageEvent) => {
        if (e.data?.id === testId) {
          clearTimeout(timer);
          worker.removeEventListener('message', handler);
          resolve(!e.data.error);
        }
      };
      
      worker.addEventListener('message', handler);
      worker.addEventListener('error', () => {
        clearTimeout(timer);
        resolve(false);
      });
      
      // Send test task with minimal data
      worker.postMessage({
        id: testId,
        file: new File([''], 'test.jpg', { type: 'image/jpeg' }),
        maxSide: 100,
        quality: 0.8,
        format: 'webp'
      });
    });
  }

  async getAvailableWorker(type: 'smart' | 'stable'): Promise<Worker | null> {
    // Find available worker of requested type
    const available = this.workers.find(w => !w.busy && w.capabilities === type);
    if (available) {
      available.busy = true;
      return available.worker;
    }

    // Create new worker if under limit
    if (this.workers.length < this.maxWorkers) {
      const worker = await this.initWorker(type);
      if (worker) {
        this.workers.push({ worker, busy: true, capabilities: type });
        return worker;
      }
    }

    return null;
  }

  releaseWorker(worker: Worker): void {
    const workerEntry = this.workers.find(w => w.worker === worker);
    if (workerEntry) {
      workerEntry.busy = false;
      this.processNextTask();
    }
  }

  private processNextTask(): void {
    const availableWorker = this.workers.find(w => !w.busy);
    if (availableWorker && this.pendingTasks.length > 0) {
      const { task, resolve, reject } = this.pendingTasks.shift()!;
      this.executeTask(task, availableWorker.worker, resolve, reject);
    }
  }

  async compress(task: CompressionTask, preferredType: 'smart' | 'stable' = 'smart'): Promise<CompressionResult> {
    return new Promise((resolve, reject) => {
      this.pendingTasks.push({ task, resolve, reject });
      this.tryExecuteTask(task, preferredType, resolve, reject);
    });
  }

  private async tryExecuteTask(
    task: CompressionTask, 
    type: 'smart' | 'stable',
    resolve: (result: CompressionResult) => void,
    reject: (error: Error) => void
  ): Promise<void> {
    const worker = await this.getAvailableWorker(type);
    if (worker) {
      // Remove from pending since we're executing
      const taskIndex = this.pendingTasks.findIndex(t => t.task.id === task.id);
      if (taskIndex >= 0) this.pendingTasks.splice(taskIndex, 1);
      
      this.executeTask(task, worker, resolve, reject);
    }
    // If no worker available, task stays in pending queue
  }

  private executeTask(
    task: CompressionTask,
    worker: Worker,
    resolve: (result: CompressionResult) => void,
    reject: (error: Error) => void
  ): void {
    const timeout = task.targetSize ? 45000 : 30000; // Increased timeouts for stability
    const timer = setTimeout(() => {
      this.releaseWorker(worker);
      reject(new Error('Worker timeout'));
    }, timeout);

    const handler = (e: MessageEvent) => {
      if (e.data?.id === task.id) {
        clearTimeout(timer);
        worker.removeEventListener('message', handler);
        this.releaseWorker(worker);
        
        if (e.data.error) {
          reject(new Error(e.data.error));
        } else {
          resolve(e.data);
        }
      }
    };

    worker.addEventListener('message', handler);
    
    // Use transferable objects for memory efficiency
    const transferList = [];
    if (task.file instanceof File) {
      // Note: File objects cannot be transferred, but we'll optimize the ArrayBuffer transfer in workers
      worker.postMessage(task);
    } else {
      worker.postMessage(task, transferList);
    }
  }

  terminate(): void {
    this.workers.forEach(({ worker }) => worker.terminate());
    this.workers = [];
    this.pendingTasks = [];
  }

  getStats() {
    return {
      totalWorkers: this.workers.length,
      busyWorkers: this.workers.filter(w => w.busy).length,
      pendingTasks: this.pendingTasks.length,
      maxWorkers: this.maxWorkers,
      capabilities: this.capabilities
    };
  }
}
