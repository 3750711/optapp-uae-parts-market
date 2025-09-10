// Health check для api.partsbay.ae прокси
let proxyHealth: 'unknown' | 'healthy' | 'failing' = 'unknown';
let lastHealthCheck = 0;

const checkProxyHealth = async (): Promise<boolean> => {
  const now = Date.now();
  if (now - lastHealthCheck < 30000 && proxyHealth !== 'unknown') {
    return proxyHealth === 'healthy';
  }
  
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000);
    
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

  // Если прокси недоступен, сразу используем fallback
  if (isProxyUrl && proxyHealth === 'failing') {
    const directUrl = urlString.replace('api.partsbay.ae', 'vfiylfljiixqkjfqubyq.supabase.co');
    console.log('🔄 Proxy known to be failing, using direct Supabase URL:', directUrl);
    return await fetch(directUrl, { ...fetchOptions, credentials: 'omit' });
  }

  try {
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
    // Network/CORS errors для прокси - fallback на прямой URL
    if (isProxyUrl) {
      const directUrl = urlString.replace('api.partsbay.ae', 'vfiylfljiixqkjfqubyq.supabase.co');
      console.log('🔄 Proxy network/CORS error, falling back to direct Supabase URL:', directUrl);
      proxyHealth = 'failing';
      
      try {
        return await fetch(directUrl, { ...fetchOptions, credentials: 'omit' });
      } catch (fallbackError) {
        console.error('❌ Both proxy and direct URLs failed:', { original: error, fallback: fallbackError });
        throw fallbackError;
      }
    }
    throw error;
  }
};