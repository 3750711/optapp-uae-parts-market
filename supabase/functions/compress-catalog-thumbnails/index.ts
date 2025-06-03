
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

    // Проверяем тип содержимого
    const contentType = imageResponse.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      throw new Error(`Invalid content type: ${contentType}`)
    }

    // Создаем Blob с правильным типом
    const imageBlob = new Blob([imageBuffer], { type: contentType })
    
    // Создаем ImageBitmap из Blob
    let imageBitmap: ImageBitmap
    try {
      imageBitmap = await createImageBitmap(imageBlob)
    } catch (error) {
      throw new Error(`Failed to create image bitmap: ${error.message}`)
    }
    
    // Вычисляем размеры для мини-превью (квадратное обрезание)
    const size = Math.min(imageBitmap.width, imageBitmap.height)
    const canvas = new OffscreenCanvas(thumbnailSize, thumbnailSize)
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }

    // Обрезаем до квадрата и уменьшаем
    const offsetX = (imageBitmap.width - size) / 2
    const offsetY = (imageBitmap.height - size) / 2
    
    ctx.drawImage(
      imageBitmap, 
      offsetX, offsetY, size, size,
      0, 0, thumbnailSize, thumbnailSize
    )

    // Освобождаем ресурсы
    imageBitmap.close()

    // Функция для сжатия с заданным качеством в WebP
    const compressWithQuality = async (targetQuality: number): Promise<Blob> => {
      return await canvas.convertToBlob({
        type: 'image/webp',
        quality: targetQuality
      })
    }

    // Начинаем с умеренного качества и итеративно уменьшаем до достижения целевого размера
    let currentQuality = 0.6 // Начинаем с 60%
    let compressedBlob = await compressWithQuality(currentQuality)
    let attempts = 0
    const maxAttempts = 10

    while (compressedBlob.size > maxSizeKB * 1024 && attempts < maxAttempts && currentQuality > 0.1) {
      currentQuality *= 0.8 // Уменьшаем качество на 20%
      compressedBlob = await compressWithQuality(currentQuality)
      attempts++
      console.log(`Attempt ${attempts}: quality ${currentQuality.toFixed(2)}, size ${(compressedBlob.size / 1024).toFixed(2)} KB`)
    }

    const finalSize = compressedBlob.size
    const compressionRatio = Math.round((1 - finalSize / originalSize) * 100)
    
    console.log(`Final thumbnail size: ${(finalSize / 1024).toFixed(2)} KB, compression: ${compressionRatio}%`)

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
        compressionRatio: compressionRatio,
        quality: currentQuality,
        format: 'webp'
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
