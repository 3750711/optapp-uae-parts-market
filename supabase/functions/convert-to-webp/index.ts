
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageUrl, quality = 80, width, height } = await req.json()
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Fetch the original image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const imageBuffer = await response.arrayBuffer()
    
    // Simple WebP conversion using Canvas API (for demonstration)
    // In production, you might want to use a more robust image processing library
    const canvas = new OffscreenCanvas(width || 800, height || 600)
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Canvas context not available')
    }

    // Create image from buffer
    const blob = new Blob([imageBuffer])
    const img = await createImageBitmap(blob)
    
    // Calculate dimensions maintaining aspect ratio
    const aspectRatio = img.width / img.height
    let newWidth = width || img.width
    let newHeight = height || img.height
    
    if (width && !height) {
      newHeight = width / aspectRatio
    } else if (height && !width) {
      newWidth = height * aspectRatio
    }
    
    canvas.width = newWidth
    canvas.height = newHeight
    
    // Draw image to canvas
    ctx.drawImage(img, 0, 0, newWidth, newHeight)
    
    // Convert to WebP
    const webpBlob = await canvas.convertToBlob({
      type: 'image/webp',
      quality: quality / 100
    })
    
    const webpBuffer = await webpBlob.arrayBuffer()
    
    return new Response(webpBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/webp',
        'Content-Length': webpBuffer.byteLength.toString(),
      }
    })
    
  } catch (error) {
    console.error('Error converting image:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
