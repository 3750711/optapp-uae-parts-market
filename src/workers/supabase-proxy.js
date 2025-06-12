
// Cloudflare Worker для прокси Supabase запросов
// Должен быть задеплоен на supabase-proxy.partsbay.workers.dev

const SUPABASE_URL = 'https://vfiylfljiixqkjfqubyq.supabase.co';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, X-Proxy-Target',
    'Access-Control-Max-Age': '86400',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    // Получаем целевой URL из заголовка или используем по умолчанию
    const targetUrl = request.headers.get('X-Proxy-Target') || SUPABASE_URL;
    const url = new URL(request.url);
    
    // Строим URL для Supabase
    const supabaseUrl = `${targetUrl}${url.pathname}${url.search}`;
    
    // Копируем заголовки, исключая проблемные
    const headers = {};
    for (const [key, value] of request.headers.entries()) {
      if (!['host', 'x-proxy-target'].includes(key.toLowerCase())) {
        headers[key] = value;
      }
    }
    
    // Добавляем заголовки Supabase если их нет
    if (!headers['apikey']) {
      headers['apikey'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0';
    }

    // Создаем новый запрос
    const modifiedRequest = new Request(supabaseUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
    });

    // Выполняем запрос к Supabase
    const response = await fetch(modifiedRequest);
    
    // Копируем заголовки ответа
    const responseHeaders = {};
    for (const [key, value] of response.headers.entries()) {
      responseHeaders[key] = value;
    }
    
    // Добавляем CORS заголовки
    Object.assign(responseHeaders, corsHeaders);
    
    // Возвращаем ответ
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
    
  } catch (error) {
    console.error('Proxy error:', error);
    
    return new Response(JSON.stringify({
      error: 'Proxy server error',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}
