export const supabaseFetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
  // Для Supabase НЕ используем cache: 'no-store'
  // Позволяем браузеру кешировать CORS preflight запросы
  const fetchOptions = {
    ...options,
    // Убираем cache: 'no-store' для Supabase
    credentials: 'same-origin' as const,
  };

  try {
    return await fetch(url, fetchOptions);
  } catch (error) {
    // При 502 ошибке прокси - fallback на прямой URL
    const urlString = url.toString();
    if (urlString.includes('api.partsbay.ae')) {
      const directUrl = urlString.replace('api.partsbay.ae', 'vfiylfljiixqkjfqubyq.supabase.co');
      console.log('🔄 Proxy failed, falling back to direct Supabase URL:', directUrl);
      return await fetch(directUrl, fetchOptions);
    }
    throw error;
  }
};