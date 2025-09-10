/**
 * Pure JavaScript React Dispatcher Readiness Checker
 * Does not use any React hooks to avoid circular dependency
 */
import { runReactDiagnostics } from './reactDiagnostics';

export interface DispatcherWaitResult {
  ready: boolean;
  error?: string;
  diagnostics?: any;
  timeoutReached?: boolean;
}

/**
 * Wait for React dispatcher to be ready using pure JavaScript (no hooks)
 * @param timeoutMs Maximum time to wait in milliseconds (default: 5000)
 * @returns Promise that resolves when dispatcher is ready or timeout is reached
 */
export const waitForReactDispatcher = async (timeoutMs: number = 5000): Promise<DispatcherWaitResult> => {
  const startTime = Date.now();
  const checkInterval = 50; // Check every 50ms

  return new Promise((resolve) => {
    const checkDispatcher = () => {
      try {
        const diagnostics = runReactDiagnostics();
        
        // Check if dispatcher is ready
        if (diagnostics.internalState === 'ready' && diagnostics.dispatcherExists) {
          console.log('✅ [DispatcherWait] React dispatcher is ready', diagnostics);
          resolve({
            ready: true,
            diagnostics
          });
          return;
        }

        // Check timeout
        const elapsed = Date.now() - startTime;
        if (elapsed >= timeoutMs) {
          console.error('❌ [DispatcherWait] Timeout reached, dispatcher not ready', diagnostics);
          resolve({
            ready: false,
            error: `Timeout after ${timeoutMs}ms`,
            diagnostics,
            timeoutReached: true
          });
          return;
        }

        // Continue checking
        setTimeout(checkDispatcher, checkInterval);
        
      } catch (error) {
        console.error('❌ [DispatcherWait] Error checking dispatcher:', error);
        resolve({
          ready: false,
          error: `Check failed: ${error}`,
          diagnostics: null
        });
      }
    };

    // Start checking
    checkDispatcher();
  });
};

/**
 * Show native loading screen while waiting for React
 */
export const showNativeLoadingScreen = (rootElement: HTMLElement) => {
  rootElement.innerHTML = `
    <div style="
      min-height: 100vh; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-family: system-ui;
      background: #f8fafc;
      color: #334155;
    ">
      <div style="text-align: center; max-width: 400px; padding: 24px;">
        <div style="
          width: 40px; 
          height: 40px; 
          border: 3px solid #e2e8f0; 
          border-top: 3px solid #3b82f6; 
          border-radius: 50%; 
          animation: spin 1s linear infinite;
          margin: 0 auto 16px auto;
        "></div>
        <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
          Инициализация React...
        </h2>
        <p style="margin: 0; font-size: 14px; color: #64748b;">
          Подготовка диспетчера компонентов
        </p>
      </div>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
};

/**
 * Show error screen when React fails to initialize
 */
export const showReactErrorScreen = (rootElement: HTMLElement, error: string) => {
  rootElement.innerHTML = `
    <div style="
      min-height: 100vh; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-family: system-ui;
      background: #fef2f2;
      color: #991b1b;
    ">
      <div style="text-align: center; max-width: 500px; padding: 24px;">
        <div style="
          width: 40px; 
          height: 40px; 
          border: 3px solid #fca5a5; 
          border-radius: 50%; 
          margin: 0 auto 16px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: bold;
        ">
          ✕
        </div>
        <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600;">
          Ошибка инициализации React
        </h2>
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #7f1d1d;">
          ${error}
        </p>
        <button onclick="window.location.reload()" style="
          background: #dc2626; 
          color: white; 
          padding: 12px 24px; 
          border: none; 
          border-radius: 6px; 
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        ">
          Перезагрузить страницу
        </button>
      </div>
    </div>
  `;
};