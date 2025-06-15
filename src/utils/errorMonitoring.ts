
import { prodError, devError } from '@/utils/logger';

// Error monitoring and chunk load error detection
interface ErrorMetrics {
  chunkLoadErrors: number;
  networkErrors: number;
  jsErrors: number;
  lastChunkError: Date | null;
}

class ErrorMonitor {
  private metrics: ErrorMetrics = {
    chunkLoadErrors: 0,
    networkErrors: 0,
    jsErrors: 0,
    lastChunkError: null
  };

  private readonly STORAGE_KEY = 'error_metrics';
  private readonly MAX_CHUNK_ERRORS = 3;
  private readonly CHUNK_ERROR_WINDOW = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.loadMetrics();
    this.setupErrorListeners();
  }

  private loadMetrics() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.metrics = {
          ...parsed,
          lastChunkError: parsed.lastChunkError ? new Date(parsed.lastChunkError) : null
        };
      }
    } catch (error) {
      devError('Failed to load error metrics:', error);
    }
  }

  private saveMetrics() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.metrics));
    } catch (error) {
      devError('Failed to save error metrics:', error);
    }
  }

  private setupErrorListeners() {
    // Listen for unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message));
    });

    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(event.reason));
    });

    // Listen for critical errors from our logger
    window.addEventListener('critical-error', ((event: CustomEvent) => {
      const { message, stack, context } = event.detail;
      this.handleCriticalError({ message, stack }, context);
    }) as EventListener);
  }

  private isChunkLoadError(error: Error): boolean {
    return error.message.includes('loading dynamically imported module') ||
           error.message.includes('Failed to fetch dynamically imported module') ||
           error.message.includes('Loading chunk') ||
           error.name === 'ChunkLoadError';
  }

  private isNetworkError(error: Error): boolean {
    return error.message.includes('fetch') ||
           error.message.includes('network') ||
           error.message.includes('connection') ||
           error.message.includes('Failed to fetch');
  }

  handleError(error: Error) {
    if (this.isChunkLoadError(error)) {
      this.metrics.chunkLoadErrors++;
      this.metrics.lastChunkError = new Date();
      
      prodError('Chunk load error detected', {
        count: this.metrics.chunkLoadErrors,
        timestamp: this.metrics.lastChunkError,
        message: error.message
      });

      // Auto-recovery for frequent chunk errors
      if (this.shouldTriggerRecovery()) {
        devError('Triggering automatic recovery...');
        this.triggerRecovery();
      }
    } else if (this.isNetworkError(error)) {
      this.metrics.networkErrors++;
      prodError('Network error detected', { message: error.message });
    } else {
      this.metrics.jsErrors++;
      devError('JavaScript error:', error);
    }

    this.saveMetrics();
  }

  handleCriticalError(error: { message: string; stack?: string }, context?: Record<string, any>) {
    // Send critical errors to monitoring service
    prodError(error.message, context);
    
    // Additional critical error handling
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: true,
        custom_map: context
      });
    }
  }

  private shouldTriggerRecovery(): boolean {
    if (!this.metrics.lastChunkError) return false;
    
    const timeSinceLastError = Date.now() - this.metrics.lastChunkError.getTime();
    return this.metrics.chunkLoadErrors >= this.MAX_CHUNK_ERRORS && 
           timeSinceLastError < this.CHUNK_ERROR_WINDOW;
  }

  private async triggerRecovery() {
    try {
      devError('Clearing caches for recovery...');
      
      // Clear service worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Clear browser storage
      localStorage.removeItem(this.STORAGE_KEY);
      sessionStorage.clear();
      
      // Force reload with cache bypass
      window.location.reload();
    } catch (error) {
      prodError('Recovery failed', { error });
      // Fallback: normal reload
      window.location.reload();
    }
  }

  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  resetMetrics() {
    this.metrics = {
      chunkLoadErrors: 0,
      networkErrors: 0,
      jsErrors: 0,
      lastChunkError: null
    };
    this.saveMetrics();
  }
}

// Initialize error monitor
export const errorMonitor = new ErrorMonitor();

// Export utilities
export const reportError = (error: Error) => errorMonitor.handleError(error);
export const getErrorMetrics = () => errorMonitor.getMetrics();
export const resetErrorMetrics = () => errorMonitor.resetMetrics();
