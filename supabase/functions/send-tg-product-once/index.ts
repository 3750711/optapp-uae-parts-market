import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

// Telegram API constants
const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const PRODUCT_GROUP_CHAT_ID = Deno.env.get('TELEGRAM_GROUP_CHAT_ID') || '-1002804153717'
const MIN_IMAGES_REQUIRED = 1
const MAX_IMAGES_PER_GROUP = 10

// Telegram logger interface
interface TelegramLogData {
  function_name: string
  notification_type: string
  recipient_type: 'personal' | 'group'
  recipient_identifier: string
  recipient_name?: string
  message_text: string
  status: 'sent' | 'failed' | 'pending'
  telegram_message_id?: string
  related_entity_type?: string
  related_entity_id?: string
  error_details?: any
  metadata?: any
}

// Log telegram notifications
async function logTelegramNotification(supabaseClient: any, data: TelegramLogData): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from('telegram_notifications_log')
      .insert({
        function_name: data.function_name,
        notification_type: data.notification_type,
        recipient_type: data.recipient_type,
        recipient_identifier: data.recipient_identifier,
        recipient_name: data.recipient_name,
        message_text: data.message_text,
        status: data.status,
        telegram_message_id: data.telegram_message_id,
        related_entity_type: data.related_entity_type,
        related_entity_id: data.related_entity_id,
        error_details: data.error_details,
        metadata: data.metadata
      })

    if (error) {
      console.error('❌ Failed to log telegram notification:', error)
    } else {
      console.log('✅ Telegram notification logged successfully')
    }
  } catch (error) {
    console.error('💥 Exception while logging telegram notification:', error)
  }
}

// Get local telegram accounts from database
async function getLocalTelegramAccounts(supabaseClient: any): Promise<string[]> {
  try {
    const { data, error } = await supabaseClient
      .from('telegram_accounts_config')
      .select('telegram_username')
      .eq('is_local', true)

    if (error) {
      console.error('Error fetching local telegram accounts:', error)
      return []
    }

    const accounts = data.map((account: any) => account.telegram_username)
    console.log(`Loaded ${accounts.length} local telegram accounts from database:`, accounts)
    
    return accounts
  } catch (error) {
    console.error('Exception in getLocalTelegramAccounts:', error)
    return []
  }
}

// Get telegram for display
function getTelegramForDisplay(telegram: string, localAccounts: string[]): string {
  if (!telegram) {
    return '@Nastya_PostingLots_OptCargo'
  }
  
  const normalizedTelegram = telegram.toLowerCase().replace('@', '')
  const isLocalAccount = localAccounts.some(account => 
    account.toLowerCase() === normalizedTelegram
  )
  
  if (isLocalAccount) {
    return `@${normalizedTelegram}`
  } else {
    return '@Nastya_PostingLots_OptCargo'
  }
}

// Wait between batches to avoid rate limiting
const waitBetweenBatches = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Send product notification via Telegram
async function sendProductNotification(supabaseClient: any, product: any) {
  try {
    console.log('Starting Telegram notification for product:', product.id)
    
    // Load local telegram accounts
    const localTelegramAccounts = await getLocalTelegramAccounts(supabaseClient)
    
    // Get product images
    const { data: images, error: imagesError } = await supabaseClient
      .from('product_images')
      .select('url')
      .eq('product_id', product.id)
      .order('created_at', { ascending: true })
    
    if (imagesError) {
      console.error('Error fetching product images:', imagesError)
      return { success: false, error: 'Failed to fetch images', status: 500 }
    }
    
    const imageUrls = images?.map((img: any) => img.url) || []
    console.log('Product has', imageUrls.length, 'images')
    
    // Check if there are enough images
    if (imageUrls.length < MIN_IMAGES_REQUIRED) {
      console.log(`Not enough images found for product (${imageUrls.length}/${MIN_IMAGES_REQUIRED}), skipping notification`)
      return { success: false, error: 'Not enough images', status: 400 }
    }
    
    // Format brand and model
    const formatBrandModel = (brand: string | null, model: string | null): string => {
      const brandText = brand || ''
      const modelText = model || ''
      
      if (brandText && modelText) {
        return ` ${brandText} ${modelText}`
      } else if (brandText) {
        return ` ${brandText}`
      } else if (modelText) {
        return ` ${modelText}`
      }
      return ''
    }
    
    // Prepare notification message
    const brandModelText = formatBrandModel(product.brand, product.model)
    const messageData = {
      title: product.title,
      brandModel: brandModelText,
      price: product.price,
      deliveryPrice: product.delivery_price,
      lotNumber: product.lot_number,
      optId: product.optid_created || '',
      telegram: product.telegram_url || '',
      status: product.status
    }
    
    const messageText = [
      `LOT(лот) #${messageData.lotNumber}`,
      `📦 ${messageData.title}${messageData.brandModel}`,
      `💰 Цена: ${messageData.price} $`,
      `🚚 Цена доставки: ${messageData.deliveryPrice} $`,
      `🆔 OPT_ID продавца: ${messageData.optId}`,
      `👤 Telegram продавца: ${getTelegramForDisplay(messageData.telegram, localTelegramAccounts)}`,
      '',
      `📊 Статус: ${messageData.status === 'active' ? 'Опубликован' : 
             messageData.status === 'sold' ? 'Продан' : 'На модерации'}`
    ].join('\n')
    
    console.log('Sending message to Telegram:', messageText)
    
    // Send images in media groups
    if (imageUrls.length > 0) {
      // Split images into chunks
      const imageChunks = []
      for (let i = 0; i < imageUrls.length; i += MAX_IMAGES_PER_GROUP) {
        imageChunks.push(imageUrls.slice(i, i + MAX_IMAGES_PER_GROUP))
      }
      
      console.log('Divided', imageUrls.length, 'images into', imageChunks.length, 'chunks')
      
      // Send each chunk as a media group
      let allMediaGroupsSuccessful = true
      
      for (let i = 0; i < imageChunks.length; i++) {
        const chunk = imageChunks[i]
        const mediaItems = []
        
        // Wait between chunks to avoid rate limits
        if (i > 0) {
          console.log(`Waiting 5 seconds before sending chunk ${i+1} to avoid rate limits...`)
          await waitBetweenBatches(5000)
        }
        
        // Add each image to the group
        for (let j = 0; j < chunk.length; j++) {
          const imageUrl = chunk[j]
          console.log(`Adding image to ${i === 0 ? 'first' : 'next'} group:`, imageUrl)
          
          // Add caption only to the first image of the first group
          const isFirstImageOfFirstGroup = i === 0 && j === 0
          const mediaItem: any = {
            type: 'photo',
            media: imageUrl,
          }
          
          if (isFirstImageOfFirstGroup && messageText) {
            mediaItem.caption = messageText
            mediaItem.parse_mode = 'HTML'
          }
          
          mediaItems.push(mediaItem)
        }
        
        console.log(`Sending ${i === 0 ? 'first' : 'next'} chunk with ${chunk.length} images${i === 0 ? ' and caption' : ''}`)
        
        // Send media group with retry logic
        const maxRetries = 3
        let retryCount = 0
        let mediaGroupResult = null
        
        while (retryCount < maxRetries) {
          try {
            const mediaGroupResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                chat_id: PRODUCT_GROUP_CHAT_ID,
                media: mediaItems,
              }),
            })
            
            mediaGroupResult = await mediaGroupResponse.json()
            console.log(`Media group ${i + 1} attempt ${retryCount + 1} response:`, 
              mediaGroupResult.ok ? 'SUCCESS' : 'FAILED')
            
            if (mediaGroupResult.ok) {
              break // Exit retry loop on success
            } else {
              console.error(`Error sending media group ${i + 1}, attempt ${retryCount + 1}:`, 
                mediaGroupResult.description || 'Unknown error')
              retryCount++
              
              if (retryCount < maxRetries) {
                const waitTime = Math.pow(2, retryCount) * 1000
                console.log(`Waiting ${waitTime/1000} seconds before retry ${retryCount+1}...`)
                await waitBetweenBatches(waitTime)
              }
            }
          } catch (error) {
            console.error(`Network error sending media group ${i + 1}, attempt ${retryCount + 1}:`, error)
            retryCount++
            
            if (retryCount < maxRetries) {
              const waitTime = Math.pow(2, retryCount) * 2000
              console.log(`Waiting ${waitTime/1000} seconds before retry ${retryCount+1}...`)
              await waitBetweenBatches(waitTime)
            }
          }
        }
        
        // Check if we exceeded retry count
        if (retryCount >= maxRetries) {
          console.error(`Failed to send media group ${i + 1} after ${maxRetries} attempts`)
          allMediaGroupsSuccessful = false
        }
        
        // Log successful media group send (for first group with caption)
        if (i === 0 && mediaGroupResult && mediaGroupResult.ok) {
          await logTelegramNotification(supabaseClient, {
            function_name: 'send-tg-product-once',
            notification_type: 'product_published',
            recipient_type: 'group',
            recipient_identifier: PRODUCT_GROUP_CHAT_ID,
            recipient_name: 'Product Group',
            message_text: messageText,
            status: 'sent',
            telegram_message_id: mediaGroupResult.result?.[0]?.message_id?.toString(),
            related_entity_type: 'product',
            related_entity_id: product.id,
            metadata: {
              media_group_size: chunk.length,
              total_images: imageUrls.length,
              chunk_number: i + 1,
              total_chunks: imageChunks.length
            }
          })
        }
      }
      
      if (allMediaGroupsSuccessful) {
        return { success: true, status: 200 }
      } else {
        return { success: false, error: 'Some media groups failed to send', status: 500 }
      }
    } else {
      // No images, send text only
      const textResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: PRODUCT_GROUP_CHAT_ID,
          text: messageText,
          parse_mode: 'HTML'
        }),
      })
      
      const textResult = await textResponse.json()
      
      if (textResult.ok) {
        await logTelegramNotification(supabaseClient, {
          function_name: 'send-tg-product-once',
          notification_type: 'product_published',
          recipient_type: 'group',
          recipient_identifier: PRODUCT_GROUP_CHAT_ID,
          recipient_name: 'Product Group',
          message_text: messageText,
          status: 'sent',
          related_entity_type: 'product',
          related_entity_id: product.id,
          metadata: { message_type: 'text_only' }
        })
        
        return { success: true, status: 200 }
      } else {
        console.error('Error sending text message:', textResult.description)
        return { success: false, error: textResult.description || 'Failed to send message', status: textResult.error_code || 400 }
      }
    }
  } catch (error) {
    console.error('Error in sendProductNotification:', error)
    return { success: false, error: error.message || 'Unknown error', status: 500 }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { productId } = await req.json()
    
    if (!productId) {
      return new Response(
        JSON.stringify({ error: 'Product ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Check product and notification status
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()
    
    if (productError || !product) {
      console.error('Product not found:', productError)
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If not pending, nothing to do
    if (product.tg_notify_status !== 'pending') {
      console.log(`Product ${productId} notification status is ${product.tg_notify_status}, skipping`)
      return new Response(
        JSON.stringify({ message: 'Notification already processed' }),
        { status: 204, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const MAX_ATTEMPTS = Number(Deno.env.get('TG_MAX_ATTEMPTS') ?? '5')
    const RETRY_DELAY_MS = Number(Deno.env.get('TG_RETRY_DELAY_MS') ?? '30000') // 30 seconds default

    let lastError = ''
    
    // Retry logic with exponential backoff
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        console.log(`Telegram notification attempt ${attempt}/${MAX_ATTEMPTS} for product ${productId}`)
        
        // Update attempt count
        await supabase
          .from('products')
          .update({ 
            tg_notify_attempts: attempt,
            tg_notify_error: null 
          })
          .eq('id', productId)

        // Try to send notification
        const result = await sendProductNotification(supabase, product)
        
        if (result.success) {
          // Success - mark as sent
          await supabase
            .from('products')
            .update({ 
              tg_notify_status: 'sent',
              tg_notify_error: null 
            })
            .eq('id', productId)
          
          console.log(`✅ Product ${productId} notification sent successfully on attempt ${attempt}`)
          return new Response(
            JSON.stringify({ success: true, attempt }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          lastError = result.error || 'Unknown error'
          
          // Check if this is a permanent error (400/403)
          if (result.status === 400 || result.status === 403) {
            await supabase
              .from('products')
              .update({ 
                tg_notify_status: 'failed',
                tg_notify_error: `Permanent error (${result.status}): ${lastError}` 
              })
              .eq('id', productId)
            
            console.error(`❌ Product ${productId} notification failed permanently: ${lastError}`)
            return new Response(
              JSON.stringify({ success: false, error: 'Permanent error', details: lastError }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          // Temporary error - retry if not last attempt
          if (attempt < MAX_ATTEMPTS) {
            console.warn(`⚠️ Product ${productId} notification attempt ${attempt} failed, retrying in ${RETRY_DELAY_MS}ms: ${lastError}`)
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
          }
        }
      } catch (error) {
        lastError = error.message || String(error)
        console.error(`💥 Product ${productId} notification attempt ${attempt} threw error: ${lastError}`)
        
        // If not last attempt, wait and retry
        if (attempt < MAX_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
        }
      }
    }
    
    // All attempts failed - mark as failed
    await supabase
      .from('products')
      .update({ 
        tg_notify_status: 'failed',
        tg_notify_error: `Max attempts (${MAX_ATTEMPTS}) reached. Last error: ${lastError}` 
      })
      .eq('id', productId)
    
    console.error(`❌ Product ${productId} notification failed after ${MAX_ATTEMPTS} attempts: ${lastError}`)
    return new Response(
      JSON.stringify({ success: false, error: 'Max attempts reached', details: lastError }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-tg-product-once function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})