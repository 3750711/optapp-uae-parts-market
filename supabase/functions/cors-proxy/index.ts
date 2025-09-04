import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  console.log(`🔄 CORS Proxy: ${req.method} ${req.url}`)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('📋 Handling OPTIONS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Extract path and search parameters from the request URL
    const url = new URL(req.url)
    const targetPath = url.pathname.replace('/functions/v1/cors-proxy', '')
    const targetUrl = `https://vfiylfljiixqkjfqubyq.supabase.co${targetPath}${url.search}`
    
    console.log(`🎯 Proxying to: ${targetUrl}`)
    
    // Forward the request to the original Supabase API
    const headers = new Headers(req.headers)
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined
    })

    console.log(`✅ Response status: ${response.status}`)

    // Get the response body
    const responseBody = await response.text()
    
    // Create response headers combining CORS headers with original headers
    const responseHeaders = new Headers(corsHeaders)
    
    // Copy important headers from the original response
    for (const [key, value] of response.headers.entries()) {
      if (!responseHeaders.has(key)) {
        responseHeaders.set(key, value)
      }
    }

    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    })
    
  } catch (error) {
    console.error('❌ CORS Proxy error:', error)
    
    return new Response(JSON.stringify({ 
      error: 'Proxy error', 
      message: error.message 
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
})