/**
 * WebSocket utilities for realtime connection management
 */

export interface WebSocketDiagnostics {
  browserSupport: boolean;
  firefoxDetected: boolean;
  connectionTest?: {
    success: boolean;
    latency?: number;
    error?: string;
  };
}

/**
 * Detect WebSocket support and browser compatibility
 */
export const detectWebSocketSupport = (): WebSocketDiagnostics => {
  const userAgent = navigator.userAgent.toLowerCase();
  const firefoxDetected = userAgent.includes('firefox');
  
  return {
    browserSupport: typeof WebSocket !== 'undefined',
    firefoxDetected,
  };
};

/**
 * Test WebSocket connection to Supabase Realtime
 */
export const testWebSocketConnection = async (url: string): Promise<WebSocketDiagnostics['connectionTest']> => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const testSocket = new WebSocket(url);
    
    const timeout = setTimeout(() => {
      testSocket.close();
      resolve({
        success: false,
        error: 'Connection timeout (10s)'
      });
    }, 10000);
    
    testSocket.onopen = () => {
      clearTimeout(timeout);
      const latency = Date.now() - startTime;
      testSocket.close();
      resolve({
        success: true,
        latency
      });
    };
    
    testSocket.onerror = (error) => {
      clearTimeout(timeout);
      console.error('🔴 WebSocket test error:', error);
      resolve({
        success: false,
        error: 'Connection failed'
      });
    };
    
    testSocket.onclose = (event) => {
      clearTimeout(timeout);
      if (event.code !== 1000) { // Not normal closure
        resolve({
          success: false,
          error: `Connection closed with code: ${event.code}`
        });
      }
    };
  });
};

/**
 * Exponential backoff calculator
 */
export const calculateBackoff = (attempt: number, maxDelay: number = 30000): number => {
  const baseDelay = 1000; // 1 second
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
};

/**
 * Get Firefox-specific WebSocket recommendations
 */
export const getFirefoxRecommendations = (): string[] => {
  return [
    'Check if WebSocket connections are blocked in Firefox settings',
    'Verify network.websocket.enabled is true in about:config',
    'Try disabling Enhanced Tracking Protection for this site',
    'Check if a proxy or firewall is blocking WebSocket connections'
  ];
};