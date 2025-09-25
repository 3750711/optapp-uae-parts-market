
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CompressImageRequest {
  imageUrl: string
  maxSizeKB?: number
  quality?: number
  maxWidth?: number
  maxHeight?: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      imageUrl, 
      maxSizeKB = 400, 
      quality = 0.8,
      maxWidth = 1920,
      maxHeight = 1920 
    }: CompressImageRequest = await req.json()

    console.log(`Starting compression for image: ${imageUrl}`)

    // Fetch the original image
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const originalSize = imageBuffer.byteLength

    console.log(`Original image size: ${(originalSize / 1024).toFixed(2)} KB`)

    // Create canvas for image processing
    const canvas = new OffscreenCanvas(1, 1)
    const ctx = canvas.getContext('2d')!

    // Load image into canvas
    const imageBlob = new Blob([imageBuffer])
    const imageBitmap = await createImageBitmap(imageBlob)
    
    // Calculate dimensions for compression
    let { width, height } = imageBitmap
    
    // Scale down if image is too large
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height)
      width = Math.floor(width * ratio)
      height = Math.floor(height * ratio)
    }

    // Set canvas dimensions
    canvas.width = width
    canvas.height = height

    // Draw image on canvas
    ctx.drawImage(imageBitmap, 0, 0, width, height)

    // Function to compress with specified quality
    const compressWithQuality = async (targetQuality: number): Promise<Blob> => {
      return new Promise((resolve) => {
        canvas.convertToBlob({
          type: 'image/webp',
          quality: targetQuality
        }).then(resolve)
      })
    }

    // Start with specified quality and reduce if necessary
    let currentQuality = quality
    let compressedBlob = await compressWithQuality(currentQuality)
    let attempts = 0
    const maxAttempts = 10

    // Iteratively reduce quality until size is under maximum
    while (compressedBlob.size > maxSizeKB * 1024 && attempts < maxAttempts) {
      currentQuality *= 0.8 // Reduce quality by 20%
      compressedBlob = await compressWithQuality(currentQuality)
      attempts++
      console.log(`Attempt ${attempts}: quality ${currentQuality.toFixed(2)}, size ${(compressedBlob.size / 1024).toFixed(2)} KB`)
    }

    const finalSize = compressedBlob.size
    console.log(`Final compressed size: ${(finalSize / 1024).toFixed(2)} KB (${((1 - finalSize / originalSize) * 100).toFixed(1)}% reduction)`)

    // Generate unique filename
    const timestamp = Date.now()
    const fileName = `compressed-${timestamp}.webp`

    // Upload compressed image to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('order-images')
      .upload(fileName, compressedBlob, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('order-images')
      .getPublicUrl(fileName)

    console.log(`Successfully compressed and uploaded: ${publicUrl}`)

    return new Response(
      JSON.stringify({
        success: true,
        compressedUrl: publicUrl,
        originalSize: originalSize,
        compressedSize: finalSize,
        compressionRatio: Math.round((1 - finalSize / originalSize) * 100),
        quality: currentQuality,
        dimensions: { width, height }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Compression error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
