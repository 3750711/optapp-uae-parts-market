// Simple diagnostics and monitoring for PWA system
interface DiagnosticInfo {
  timestamp: string;
  userAgent: string;
  isPWA: boolean;
  serviceWorker: {
    registered: boolean;
    active: boolean;
    waiting: boolean;
  };
  storage: {
    localStorage: boolean;
    sessionStorage: boolean;
    indexedDB: boolean;
  };
  network: {
    online: boolean;
    connection?: any;
  };
  performance: {
    loadTime: number;
    domReady: number;
  };
}

class DiagnosticsManager {
  private errors: Array<{ timestamp: string; error: string; stack?: string }> = [];
  private maxErrors = 50;

  constructor() {
    this.setupErrorTracking();
  }

  private setupErrorTracking(): void {
    window.addEventListener('error', (event) => {
      this.logError('Global Error', event.error || event.message);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled Promise Rejection', event.reason);
    });
  }

  public logError(type: string, error: any): void {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      error: `${type}: ${error?.message || error}`,
      stack: error?.stack
    };

    this.errors.push(errorEntry);
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    console.error('🚨 Diagnostic Error:', errorEntry);
  }

  public async getDiagnosticInfo(): Promise<DiagnosticInfo> {
    const swRegistration = await navigator.serviceWorker?.getRegistration();
    
    return {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      isPWA: window.matchMedia('(display-mode: standalone)').matches,
      serviceWorker: {
        registered: !!swRegistration,
        active: !!swRegistration?.active,
        waiting: !!swRegistration?.waiting
      },
      storage: {
        localStorage: this.testStorage('localStorage'),
        sessionStorage: this.testStorage('sessionStorage'),
        indexedDB: 'indexedDB' in window
      },
      network: {
        online: navigator.onLine,
        connection: (navigator as any).connection
      },
      performance: {
        loadTime: performance.now(),
        domReady: document.readyState === 'complete' ? performance.now() : -1
      }
    };
  }

  private testStorage(type: 'localStorage' | 'sessionStorage'): boolean {
    try {
      const storage = window[type];
      const testKey = '__test__';
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  public getRecentErrors(): Array<{ timestamp: string; error: string; stack?: string }> {
    return [...this.errors];
  }

  public clearErrors(): void {
    this.errors = [];
  }

  public async generateReport(): Promise<string> {
    const info = await this.getDiagnosticInfo();
    const errors = this.getRecentErrors();

    return `
=== PWA Diagnostic Report ===
Generated: ${info.timestamp}

## System Info
- User Agent: ${info.userAgent}
- PWA Mode: ${info.isPWA}
- Online: ${info.network.online}
- Load Time: ${info.performance.loadTime.toFixed(2)}ms

## Service Worker
- Registered: ${info.serviceWorker.registered}
- Active: ${info.serviceWorker.active}
- Waiting: ${info.serviceWorker.waiting}

## Storage
- LocalStorage: ${info.storage.localStorage}
- SessionStorage: ${info.storage.sessionStorage}
- IndexedDB: ${info.storage.indexedDB}

## Recent Errors (${errors.length})
${errors.map(e => `[${e.timestamp}] ${e.error}`).join('\n')}

## Connection Info
${JSON.stringify(info.network.connection, null, 2)}
`;
  }
}

export const diagnostics = new DiagnosticsManager();

// Global diagnostic functions
export const runHealthCheck = async (): Promise<boolean> => {
  try {
    const info = await diagnostics.getDiagnosticInfo();
    
    // Basic health checks
    const checks = [
      info.storage.localStorage,
      info.network.online,
      !diagnostics.getRecentErrors().some(e => e.error.includes('CRITICAL'))
    ];

    const isHealthy = checks.every(check => check === true);
    console.log('🏥 Health Check:', isHealthy ? 'PASS' : 'FAIL');
    
    return isHealthy;
  } catch (error) {
    diagnostics.logError('Health Check Failed', error);
    return false;
  }
};

// Export for debugging in console
(window as any).__diagnostics = diagnostics;
(window as any).__healthCheck = runHealthCheck;
