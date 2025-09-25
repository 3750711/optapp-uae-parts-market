
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CompressImageRequest {
  imageUrl: string
  orderId: string
  maxSizeKB?: number
  quality?: number
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

    const { imageUrl, orderId, maxSizeKB = 250, quality = 0.8 }: CompressImageRequest = await req.json()

    console.log(`Starting compression for order ${orderId}, image: ${imageUrl}`)

    // Загружаем оригинальное изображение
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const originalSize = imageBuffer.byteLength

    console.log(`Original image size: ${(originalSize / 1024).toFixed(2)} KB`)

    // Создаем canvas для обработки изображения
    const canvas = new OffscreenCanvas(1, 1)
    const ctx = canvas.getContext('2d')!

    // Загружаем изображение в canvas
    const imageBlob = new Blob([imageBuffer])
    const imageBitmap = await createImageBitmap(imageBlob)
    
    // Вычисляем размеры для сжатия (максимум 1920px по большей стороне)
    let { width, height } = imageBitmap
    const maxDimension = 1920
    
    if (width > maxDimension || height > maxDimension) {
      const ratio = Math.min(maxDimension / width, maxDimension / height)
      width = Math.floor(width * ratio)
      height = Math.floor(height * ratio)
    }

    // Устанавливаем размеры canvas
    canvas.width = width
    canvas.height = height

    // Рисуем изображение на canvas
    ctx.drawImage(imageBitmap, 0, 0, width, height)

    // Функция для сжатия с заданным качеством
    const compressWithQuality = async (targetQuality: number): Promise<Blob> => {
      return new Promise((resolve) => {
        canvas.convertToBlob({
          type: 'image/webp',
          quality: targetQuality
        }).then(resolve)
      })
    }

    // Начинаем с заданного качества и уменьшаем при необходимости
    let currentQuality = quality
    let compressedBlob = await compressWithQuality(currentQuality)
    let attempts = 0
    const maxAttempts = 10

    // Итеративно уменьшаем качество, пока размер не станет меньше максимального
    while (compressedBlob.size > maxSizeKB * 1024 && attempts < maxAttempts) {
      currentQuality *= 0.8 // Уменьшаем качество на 20%
      compressedBlob = await compressWithQuality(currentQuality)
      attempts++
      console.log(`Attempt ${attempts}: quality ${currentQuality.toFixed(2)}, size ${(compressedBlob.size / 1024).toFixed(2)} KB`)
    }

    const finalSize = compressedBlob.size
    console.log(`Final compressed size: ${(finalSize / 1024).toFixed(2)} KB (${((1 - finalSize / originalSize) * 100).toFixed(1)}% reduction)`)

    // Генерируем уникальное имя файла
    const timestamp = Date.now()
    const fileName = `compressed-${orderId}-${timestamp}.webp`

    // Загружаем сжатое изображение в Supabase Storage
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

    // Получаем публичный URL
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
        quality: currentQuality
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
