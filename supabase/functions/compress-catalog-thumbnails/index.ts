
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CompressCatalogRequest {
  imageUrl: string
  productId: string
  maxSizeKB?: number
  thumbnailSize?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { imageUrl, productId, maxSizeKB = 20, thumbnailSize = 150 }: CompressCatalogRequest = await req.json()

    console.log(`Creating catalog thumbnail for product ${productId}, target: ${maxSizeKB}KB`)

    // Загружаем оригинальное изображение
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const originalSize = imageBuffer.byteLength

    console.log(`Original image size: ${(originalSize / 1024).toFixed(2)} KB`)

    // Создаем canvas для обработки
    const imageBlob = new Blob([imageBuffer])
    const imageBitmap = await createImageBitmap(imageBlob)
    
    // Вычисляем размеры для мини-превью (квадратное обрезание)
    const size = Math.min(imageBitmap.width, imageBitmap.height)
    const canvas = new OffscreenCanvas(thumbnailSize, thumbnailSize)
    const ctx = canvas.getContext('2d')!

    // Обрезаем до квадрата и уменьшаем
    const offsetX = (imageBitmap.width - size) / 2
    const offsetY = (imageBitmap.height - size) / 2
    
    ctx.drawImage(
      imageBitmap, 
      offsetX, offsetY, size, size,
      0, 0, thumbnailSize, thumbnailSize
    )

    // Функция для сжатия с заданным качеством
    const compressWithQuality = async (targetQuality: number): Promise<Blob> => {
      return await canvas.convertToBlob({
        type: 'image/webp',
        quality: targetQuality
      })
    }

    // Начинаем с низкого качества и итеративно уменьшаем до достижения целевого размера
    let currentQuality = 0.4 // Начинаем с 40%
    let compressedBlob = await compressWithQuality(currentQuality)
    let attempts = 0
    const maxAttempts = 8

    while (compressedBlob.size > maxSizeKB * 1024 && attempts < maxAttempts && currentQuality > 0.1) {
      currentQuality *= 0.85 // Уменьшаем качество на 15%
      compressedBlob = await compressWithQuality(currentQuality)
      attempts++
      console.log(`Attempt ${attempts}: quality ${currentQuality.toFixed(2)}, size ${(compressedBlob.size / 1024).toFixed(2)} KB`)
    }

    const finalSize = compressedBlob.size
    console.log(`Final thumbnail size: ${(finalSize / 1024).toFixed(2)} KB`)

    // Генерируем уникальное имя файла для каталожного превью
    const timestamp = Date.now()
    const fileName = `catalog-thumb-${productId}-${timestamp}.webp`

    // Загружаем в bucket для каталожных превью
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(`catalog-thumbnails/${fileName}`, compressedBlob, {
        contentType: 'image/webp',
        cacheControl: '86400', // 24 часа кэширования
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Получаем публичный URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(`catalog-thumbnails/${fileName}`)

    console.log(`Successfully created catalog thumbnail: ${publicUrl}`)

    return new Response(
      JSON.stringify({
        success: true,
        thumbnailUrl: publicUrl,
        originalSize: originalSize,
        thumbnailSize: finalSize,
        compressionRatio: Math.round((1 - finalSize / originalSize) * 100),
        quality: currentQuality
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Catalog thumbnail creation error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
