import imageCompression from 'browser-image-compression';
import { WorkerPool } from './WorkerPool';
import type { 
  CompressionTask, 
  CompressionResult, 
  WorkerCapabilities, 
  CompressionProfile,
  CompressionMetrics 
} from './types';

export class CompressionManager {
  private workerPool: WorkerPool;
  private capabilities: WorkerCapabilities;
  private metrics: CompressionMetrics;
  private smartWorkerAvailable = false;
  private stableWorkerAvailable = false;

  constructor() {
    this.capabilities = this.detectCapabilities();
    this.workerPool = new WorkerPool(this.capabilities);
    this.metrics = this.initializeMetrics();
    this.testWorkerAvailability();
  }

  private detectCapabilities(): WorkerCapabilities {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isLowEndDevice = this.detectLowEndDevice();
    
    return {
      hasOffscreenCanvas: typeof OffscreenCanvas !== 'undefined',
      hasWebGPU: 'gpu' in navigator,
      maxMemory: (navigator as any).deviceMemory || 4,
      isMobile,
      isLowEndDevice
    };
  }

  private detectLowEndDevice(): boolean {
    const memory = (navigator as any).deviceMemory;
    const cores = navigator.hardwareConcurrency || 2;
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Detect known low-end devices and conditions
    const isLowMemory = memory && memory <= 2;
    const isLowCores = cores <= 2;
    const isTelegramAndroid = userAgent.includes('telegram') && userAgent.includes('android');
    
    return isLowMemory || (isLowCores && isTelegramAndroid);
  }

  private initializeMetrics(): CompressionMetrics {
    return {
      totalFiles: 0,
      successfulCompressions: 0,
      averageCompressionRatio: 0,
      averageCompressionTime: 0,
      methodSuccessRates: {
        smart: { attempts: 0, successes: 0 },
        stable: { attempts: 0, successes: 0 },
        browser: { attempts: 0, successes: 0 },
        original: { attempts: 0, successes: 0 }
      },
      networkProfile: this.getNetworkType(),
      deviceProfile: this.getDeviceProfile()
    };
  }

  private async testWorkerAvailability(): Promise<void> {
    try {
      // Test smart worker (with timeout for problematic environments)
      const smartWorker = await this.workerPool.initWorker('smart');
      this.smartWorkerAvailable = !!smartWorker;
      if (smartWorker) smartWorker.terminate();

      // Test stable worker
      const stableWorker = await this.workerPool.initWorker('stable');
      this.stableWorkerAvailable = !!stableWorker;
      if (stableWorker) stableWorker.terminate();

      console.log('Worker availability:', {
        smart: this.smartWorkerAvailable,
        stable: this.stableWorkerAvailable,
        capabilities: this.capabilities
      });
    } catch (error) {
      console.warn('Worker availability test failed:', error);
    }
  }

  getCompressionProfile(networkType?: string): CompressionProfile {
    const network = networkType || this.getNetworkType();
    const { isLowEndDevice, isMobile } = this.capabilities;

    // Aggressive optimization for low-end devices and Telegram Android
    if (isLowEndDevice) {
      return {
        maxSide: 1024,
        quality: 0.7,
        targetSize: 300 * 1024, // 300KB max
        concurrency: 1,
        timeout: 5000,
        method: this.stableWorkerAvailable ? 'stable' : 'browser'
      };
    }

    if (network === '3g' || network === '2g') {
      return {
        maxSide: 1280,
        quality: 0.72,
        targetSize: 500 * 1024, // 500KB max
        concurrency: isMobile ? 1 : 2,
        timeout: 8000,
        method: this.smartWorkerAvailable ? 'smart' : 'stable'
      };
    }

    // 4G and better
    return {
      maxSide: 1600,
      quality: 0.8,
      targetSize: 800 * 1024, // 800KB max
      concurrency: isMobile ? 2 : 3,
      timeout: 10000,
      method: this.smartWorkerAvailable ? 'smart' : 'stable'
    };
  }

  private getNetworkType(): string {
    const connection = (navigator as any).connection;
    return connection?.effectiveType || '4g';
  }

  private getDeviceProfile(): string {
    const { isLowEndDevice, isMobile, maxMemory } = this.capabilities;
    if (isLowEndDevice) return 'low-end';
    if (isMobile && maxMemory <= 4) return 'mobile-limited';
    if (isMobile) return 'mobile';
    return 'desktop';
  }

  async compress(file: File, options: Partial<CompressionProfile> = {}): Promise<CompressionResult> {
    const startTime = performance.now();
    const profile = { ...this.getCompressionProfile(), ...options };
    
    this.metrics.totalFiles++;
    
    const task: CompressionTask = {
      id: crypto.randomUUID(),
      file,
      maxSide: profile.maxSide,
      quality: profile.quality,
      format: 'webp',
      targetSize: profile.targetSize,
      networkType: this.getNetworkType()
    };

    // Skip compression for very small files
    if (file.size < 100 * 1024) { // 100KB
      return this.createResult(task, file, 'original', performance.now() - startTime);
    }

    // Intelligent fallback chain: Smart → Stable → Browser → Original
    try {
      // Method 1: Smart Worker (two-pass optimization)
      if (this.smartWorkerAvailable && profile.method === 'smart') {
        const result = await this.trySmartCompression(task);
        if (result) return result;
      }

      // Method 2: Stable Worker (reliable single-pass)
      if (this.stableWorkerAvailable && (profile.method === 'stable' || profile.method === 'smart')) {
        const result = await this.tryStableCompression(task);
        if (result) return result;
      }

      // Method 3: Browser Library Compression
      const result = await this.tryBrowserCompression(task);
      if (result) return result;

      // Method 4: Return original file as last resort
      return this.createResult(task, file, 'original', performance.now() - startTime);

    } catch (error) {
      console.error('All compression methods failed:', error);
      return this.createResult(task, file, 'original', performance.now() - startTime, error as Error);
    }
  }

  private async trySmartCompression(task: CompressionTask): Promise<CompressionResult | null> {
    try {
      this.metrics.methodSuccessRates.smart.attempts++;
      const result = await this.workerPool.compress(task, 'smart');
      this.metrics.methodSuccessRates.smart.successes++;
      this.updateMetrics(result);
      return result;
    } catch (error) {
      console.warn('Smart compression failed:', error);
      this.smartWorkerAvailable = false; // Disable for future attempts
      return null;
    }
  }

  private async tryStableCompression(task: CompressionTask): Promise<CompressionResult | null> {
    try {
      this.metrics.methodSuccessRates.stable.attempts++;
      const result = await this.workerPool.compress(task, 'stable');
      this.metrics.methodSuccessRates.stable.successes++;
      this.updateMetrics(result);
      return result;
    } catch (error) {
      console.warn('Stable compression failed:', error);
      this.stableWorkerAvailable = false; // Disable for future attempts
      return null;
    }
  }

  private async tryBrowserCompression(task: CompressionTask): Promise<CompressionResult | null> {
    try {
      this.metrics.methodSuccessRates.browser.attempts++;
      const startTime = performance.now();
      
      const compressedFile = await imageCompression(task.file, {
        maxSizeMB: task.targetSize ? task.targetSize / (1024 * 1024) : 1,
        maxWidthOrHeight: task.maxSide,
        useWebWorker: false, // Disable to avoid conflicts
        initialQuality: task.quality,
        fileType: `image/${task.format}`
      });
      
      const result = this.createResult(
        task, 
        compressedFile, 
        'browser', 
        performance.now() - startTime
      );
      
      this.metrics.methodSuccessRates.browser.successes++;
      this.updateMetrics(result);
      return result;
    } catch (error) {
      console.warn('Browser compression failed:', error);
      return null;
    }
  }

  private createResult(
    task: CompressionTask, 
    result: File | Blob, 
    method: CompressionResult['method'],
    duration: number,
    error?: Error
  ): CompressionResult {
    return {
      id: task.id,
      blob: result,
      originalSize: task.file.size,
      compressedSize: result.size,
      compressionMs: Math.round(duration),
      passes: method === 'smart' ? 2 : method === 'original' ? 0 : 1,
      method,
      error: error?.message
    };
  }

  private updateMetrics(result: CompressionResult): void {
    if (!result.error) {
      this.metrics.successfulCompressions++;
      
      const compressionRatio = (result.originalSize - result.compressedSize) / result.originalSize;
      this.metrics.averageCompressionRatio = 
        (this.metrics.averageCompressionRatio * (this.metrics.successfulCompressions - 1) + compressionRatio) / 
        this.metrics.successfulCompressions;
      
      this.metrics.averageCompressionTime = 
        (this.metrics.averageCompressionTime * (this.metrics.successfulCompressions - 1) + result.compressionMs) / 
        this.metrics.successfulCompressions;
    }
  }

  getMetrics(): CompressionMetrics {
    return { ...this.metrics };
  }

  getWorkerStats() {
    return {
      ...this.workerPool.getStats(),
      smartAvailable: this.smartWorkerAvailable,
      stableAvailable: this.stableWorkerAvailable,
      capabilities: this.capabilities
    };
  }

  terminate(): void {
    this.workerPool.terminate();
  }
}

// Global instance
export const compressionManager = new CompressionManager();