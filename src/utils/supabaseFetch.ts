// Health check для api.partsbay.ae прокси (optimized caching)
let proxyHealth: 'unknown' | 'healthy' | 'failing' = 'unknown';
let lastHealthCheck = 0;

const checkProxyHealth = async (): Promise<boolean> => {
  const now = Date.now();
  // Cache health check for 5 minutes instead of 30 seconds
  if (now - lastHealthCheck < 5 * 60 * 1000 && proxyHealth !== 'unknown') {
    return proxyHealth === 'healthy';
  }
  
  try {
    const controller = new AbortController();
    // Increased timeout for better reliability
    setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://api.partsbay.ae/rest/v1/', {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'cors'
    });
    
    proxyHealth = response.ok ? 'healthy' : 'failing';
    lastHealthCheck = now;
    return proxyHealth === 'healthy';
  } catch {
    proxyHealth = 'failing';
    lastHealthCheck = now;
    return false;
  }
};

export const supabaseFetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
  const urlString = url.toString();
  const isProxyUrl = urlString.includes('api.partsbay.ae');
  
  // Правильные CORS настройки для cross-origin запросов
  const fetchOptions = {
    ...options,
    // НЕ используем credentials: 'same-origin' для cross-origin запросов
    credentials: isProxyUrl ? 'omit' : (options?.credentials || 'same-origin'),
    // Кешируем preflight запросы
    mode: 'cors' as const,
  };

  // Exponential backoff retry logic with 2 max attempts
  const maxRetries = 2;
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Если прокси недоступен, сразу используем fallback (only check on first attempt)
      if (isProxyUrl && attempt === 0 && proxyHealth === 'failing') {
        const directUrl = urlString.replace('api.partsbay.ae', 'vfiylfljiixqkjfqubyq.supabase.co');
        console.log('🔄 Proxy known to be failing, using direct Supabase URL:', directUrl);
        return await fetch(directUrl, { ...fetchOptions, credentials: 'omit' });
      }

      const response = await fetch(url, fetchOptions);
      
      // Если прокси отвечает корректно, отмечаем как здоровый
      if (isProxyUrl && response.status !== 502) {
        proxyHealth = 'healthy';
        lastHealthCheck = Date.now();
      }
      
      // При 502 ошибке прокси - fallback на прямой URL
      if (response.status === 502 && isProxyUrl) {
        const directUrl = urlString.replace('api.partsbay.ae', 'vfiylfljiixqkjfqubyq.supabase.co');
        console.log('🔄 Proxy returned 502, falling back to direct Supabase URL:', directUrl);
        proxyHealth = 'failing';
        return await fetch(directUrl, { ...fetchOptions, credentials: 'omit' });
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) break;
      
      // Exponential backoff: 250ms, 500ms
      const delay = 250 * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.warn(`🔄 Request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, error);
    }
  }
  
  // Network/CORS errors для прокси - fallback на прямой URL
  if (isProxyUrl) {
    const directUrl = urlString.replace('api.partsbay.ae', 'vfiylfljiixqkjfqubyq.supabase.co');
    console.log('🔄 All proxy attempts failed, falling back to direct Supabase URL:', directUrl);
    proxyHealth = 'failing';
    
    try {
      return await fetch(directUrl, { ...fetchOptions, credentials: 'omit' });
    } catch (fallbackError) {
      console.error('❌ Both proxy and direct URLs failed:', { original: lastError, fallback: fallbackError });
      throw new Error(`NetworkError when attempting to fetch resource. Proxy: ${lastError.message}, Direct: ${(fallbackError as Error).message}`);
    }
  }
  throw lastError;
};