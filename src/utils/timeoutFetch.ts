import { getTimeoutForConnection } from './networkUtils';

export const createTimeoutFetch = () => {
  const originalFetch = global.fetch;

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const { general, auth } = getTimeoutForConnection();
    
    // Determine timeout based on URL
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const isAuthRequest = url.includes('/auth/v1/');
    const timeout = isAuthRequest ? auth : general;
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const response = await originalFetch(input, {
        ...init,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout after ${timeout}ms`);
        timeoutError.name = 'TimeoutError';
        throw timeoutError;
      }
      
      throw error;
    }
  };
};