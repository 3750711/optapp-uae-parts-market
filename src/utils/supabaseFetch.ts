// Full circuit breaker for api.partsbay.ae прокси
let proxyHealth: 'unknown' | 'healthy' | 'failing' = 'unknown';
let lastHealthCheck = 0;
let circuitBreakerFailures = 0;
let circuitBreakerOpenUntil = 0;

const checkProxyHealth = async (): Promise<boolean> => {
  const now = Date.now();
  
  // Circuit breaker: if too many failures, skip health check for 1 minute
  if (circuitBreakerFailures >= 3 && now < circuitBreakerOpenUntil) {
    return false;
  }
  
  // Cache health check for 5 minutes
  if (now - lastHealthCheck < 5 * 60 * 1000 && proxyHealth !== 'unknown') {
    return proxyHealth === 'healthy';
  }
  
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://api.partsbay.ae/rest/v1/', {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'cors'
    });
    
    const isHealthy = response.ok;
    proxyHealth = isHealthy ? 'healthy' : 'failing';
    lastHealthCheck = now;
    
    if (isHealthy) {
      // Reset circuit breaker on success
      circuitBreakerFailures = 0;
      circuitBreakerOpenUntil = 0;
    } else {
      circuitBreakerFailures++;
      if (circuitBreakerFailures >= 3) {
        circuitBreakerOpenUntil = now + 60000; // 1 minute timeout
      }
    }
    
    return isHealthy;
  } catch {
    proxyHealth = 'failing';
    lastHealthCheck = now;
    circuitBreakerFailures++;
    
    if (circuitBreakerFailures >= 3) {
      circuitBreakerOpenUntil = now + 60000; // 1 minute timeout
    }
    
    return false;
  }
};

export const supabaseFetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
  const urlString = url.toString();
  const isProxyUrl = urlString.includes('api.partsbay.ae');
  
  // Base fetch options without global controller
  const baseFetchOptions = {
    ...options,
    credentials: isProxyUrl ? 'omit' : (options?.credentials || 'same-origin'),
    mode: 'cors' as const,
  };

  // Jittered exponential backoff retry logic with 2 max attempts
  const maxRetries = 2;
  let lastError: Error;
  
  // Helper function to create fetch with timeout and individual controller
  const createFetchWithTimeout = (fetchUrl: RequestInfo | URL, timeout: number = 25000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const fetchPromise = fetch(fetchUrl, {
      ...baseFetchOptions,
      signal: controller.signal,
      credentials: fetchUrl.toString().includes('api.partsbay.ae') ? 'omit' : baseFetchOptions.credentials
    }).finally(() => clearTimeout(timeoutId));
    
    return fetchPromise;
  };
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Circuit breaker: if proxy is known to be failing, use fallback immediately
      if (isProxyUrl && attempt === 0 && (proxyHealth === 'failing' || circuitBreakerFailures >= 3)) {
        const directUrl = urlString.replace('api.partsbay.ae', 'vfiylfljiixqkjfqubyq.supabase.co');
        console.log('🔄 Circuit breaker active or proxy failing, using direct Supabase URL:', directUrl);
        return await createFetchWithTimeout(directUrl);
      }

      const response = await createFetchWithTimeout(url);
      
      // Update proxy health status
      if (isProxyUrl && response.status !== 502) {
        proxyHealth = 'healthy';
        lastHealthCheck = Date.now();
        // Reset circuit breaker on success
        circuitBreakerFailures = 0;
        circuitBreakerOpenUntil = 0;
      }
      
      // Handle 502 proxy errors
      if (response.status === 502 && isProxyUrl) {
        const directUrl = urlString.replace('api.partsbay.ae', 'vfiylfljiixqkjfqubyq.supabase.co');
        console.log('🔄 Proxy returned 502, falling back to direct Supabase URL:', directUrl);
        proxyHealth = 'failing';
        circuitBreakerFailures++;
        return await createFetchWithTimeout(directUrl);
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      
      // Update circuit breaker for network errors
      if (isProxyUrl) {
        circuitBreakerFailures++;
        if (circuitBreakerFailures >= 3) {
          circuitBreakerOpenUntil = Date.now() + 60000; // 1 minute timeout
        }
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) break;
      
      // Jittered exponential backoff: 1s, 2s, 4s (max 10s with jitter)
      const baseDelay = Math.min(1000 * Math.pow(2, attempt), 10000);
      const jitter = Math.random() * 1000; // Up to 1s jitter
      const delay = baseDelay + jitter;
      
      await new Promise(resolve => setTimeout(resolve, delay));
      console.warn(`🔄 Request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms:`, error);
    }
  }
  
  // Final fallback for proxy URLs
  if (isProxyUrl) {
    const directUrl = urlString.replace('api.partsbay.ae', 'vfiylfljiixqkjfqubyq.supabase.co');
    console.log('🔄 All proxy attempts failed, falling back to direct Supabase URL:', directUrl);
    proxyHealth = 'failing';
    
    try {
      // Only 1 retry for fallback URL to prevent excessive requests
      return await createFetchWithTimeout(directUrl);
    } catch (fallbackError) {
      console.error('❌ Both proxy and direct URLs failed:', { original: lastError, fallback: fallbackError });
      throw new Error(`NetworkError when attempting to fetch resource. Proxy: ${lastError.message}, Direct: ${(fallbackError as Error).message}`);
    }
  }
  throw lastError;
};