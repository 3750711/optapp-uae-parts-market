const RETRY_METHODS = new Set(['GET']);

export async function robustFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const maxRetries = 2;
  const baseDelay = 250;
  const method = (init.method || 'GET').toUpperCase();
  const canRetry = RETRY_METHODS.has(method) && !init.body;
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetch(input, { 
        ...init, 
        cache: 'no-store' 
      });
    } catch (error) {
      lastError = error;
      
      // Don't retry if it's not a retryable method or we're on the last attempt
      if (!canRetry || attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * (2 ** attempt) + Math.random() * 150;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}