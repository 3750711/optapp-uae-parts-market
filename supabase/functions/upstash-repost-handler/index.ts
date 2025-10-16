import { Receiver } from "npm:@upstash/qstash@2";
import { createServiceClient } from '../_shared/client.ts';
import { getLocalTelegramAccounts, getTelegramForDisplay } from "../shared/telegram-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_RETRIES = 5;
const TG_BOT_TOKEN = Deno.env.get('TG_BOT_TOKEN');
const TG_CHAT_ID = Deno.env.get('TG_CHAT_ID');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify QStash signature
    const QSTASH_CURRENT_SIGNING_KEY = Deno.env.get('QSTASH_CURRENT_SIGNING_KEY');
    const QSTASH_NEXT_SIGNING_KEY = Deno.env.get('QSTASH_NEXT_SIGNING_KEY');

    if (!QSTASH_CURRENT_SIGNING_KEY || !QSTASH_NEXT_SIGNING_KEY) {
      console.error('❌ [QStash] Signing keys not configured');
      return new Response('Signing keys not configured', { status: 500 });
    }

    const receiver = new Receiver({
      currentSigningKey: QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: QSTASH_NEXT_SIGNING_KEY,
    });

    const signature = req.headers.get("Upstash-Signature");
    if (!signature) {
      console.error('❌ [QStash] Missing signature');
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.text();
    
    const isValid = await receiver.verify({
      signature,
      body,
    });

    if (!isValid) {
      console.error('❌ [QStash] Invalid signature');
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse the verified body
    const data = JSON.parse(body);
    const { productId, priceChanged, newPrice, oldPrice } = data;

    console.log('📮 [QStash] Processing repost:', { productId });

    if (!TG_BOT_TOKEN || !TG_CHAT_ID) {
      console.error('❌ [QStash] Telegram credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Telegram not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabaseClient = createServiceClient();

    // Get product with images
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select(`
        *,
        product_images (url),
        profiles!products_seller_id_fkey (
          opt_id,
          telegram,
          full_name
        )
      `)
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('❌ [QStash] Product not found:', productError);
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Optimize image URLs for Telegram
    const optimizeImageUrl = (url: string): string => {
      if (!url.includes('cloudinary.com')) return url;
      
      const parts = url.split('/upload/');
      if (parts.length !== 2) return url;
      
      const optimizedUrl = `${parts[0]}/upload/f_webp,q_auto:best,c_limit,w_2048/${parts[1]}`;
      console.log(`🎨 Optimizing image URL:\n   Before: ${url.substring(0, 100)}...\n   After:  ${optimizedUrl.substring(0, 100)}...`);
      
      return optimizedUrl;
    };

    const imageUrls = product.product_images?.map(img => optimizeImageUrl(img.url)) || [];
    console.log('✨ Optimized image URLs for Telegram delivery');

    // Load local telegram accounts for proper display
    const localTelegramAccounts = await getLocalTelegramAccounts();

    // Validate all image URLs
    const validImageUrls: string[] = [];
    for (const url of imageUrls) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          validImageUrls.push(url);
        } else {
          console.warn(`⚠️ [QStash] Invalid image URL (${response.status}): ${url}`);
        }
      } catch (error) {
        console.warn(`⚠️ [QStash] Error validating image URL: ${url}`, error);
      }
    }

    if (validImageUrls.length === 0) {
      console.error('❌ [QStash] No valid images found');
      return new Response(
        JSON.stringify({ error: 'No valid images' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`✅ [QStash] Validated ${validImageUrls.length}/${imageUrls.length} images`);

    // Prepare caption with price change info
    const priceInfo = priceChanged && newPrice && oldPrice
      ? `\n💰 Новая цена: ${newPrice} $ (было ${oldPrice} $)`
      : `\n💰 Цена: ${product.price} $`;

    const caption = `LOT(лот) #${product.lot_number}\n📦 ${product.title}\n${priceInfo}\n🚚 Цена доставки: ${product.delivery_price || 0} $\n🆔 OPT_ID продавца: ${product.profiles?.opt_id || 'N/A'}\n👤 Telegram продавца: ${getTelegramForDisplay(product.profiles?.telegram || '', localTelegramAccounts)}\n\n📊 Статус: Опубликован`;

    // Send to Telegram with retry logic
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`📤 [QStash] Attempt ${attempt}/${MAX_RETRIES} to send to Telegram`);

        // Split images into chunks of 10 (Telegram limit)
        const CHUNK_SIZE = 10;
        const imageChunks: string[][] = [];
        
        for (let i = 0; i < validImageUrls.length; i += CHUNK_SIZE) {
          imageChunks.push(validImageUrls.slice(i, i + CHUNK_SIZE));
        }

        console.log(`Divided ${validImageUrls.length} images into ${imageChunks.length} chunks`);

        // Send first chunk with caption
        const firstChunk = imageChunks[0];
        const mediaGroup = firstChunk.map((url, index) => ({
          type: 'photo',
          media: url,
          ...(index === 0 ? { caption } : {})
        }));

        const response = await fetch(
          `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMediaGroup`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: TG_CHAT_ID,
              media: mediaGroup
            })
          }
        );

        if (!response.ok) {
          // Парсим retry_after из Telegram ответа
          const errorData = await response.json().catch(() => ({}));
          const retryAfter = errorData.retry_after || 0;

          if (response.status === 429) {
            console.warn(`⚠️ [Telegram] Rate limit hit (429) on attempt ${attempt}, retry_after: ${retryAfter}s`);
            
            // Логируем в БД для мониторинга
            try {
              await supabaseClient.from('telegram_notifications_log').insert({
                function_name: 'upstash-repost-handler',
                notification_type: 'repost_rate_limit',
                recipient_type: 'group',
                recipient_identifier: TG_CHAT_ID || 'unknown',
                message_text: `Rate limit for product ${productId}`,
                status: 'failed',
                error_details: { retry_after: retryAfter, attempt, status: response.status },
                related_entity_type: 'product',
                related_entity_id: productId
              });
            } catch (logError) {
              console.error('⚠️ Failed to log rate limit:', logError);
            }
          }

          const errorText = await response.text().catch(() => `Status ${response.status}`);
          throw new Error(`Telegram API error (${response.status}): ${errorText}`);
        }

        console.log(`✅ [QStash] Successfully sent chunk 1 with ${firstChunk.length} images`);

        // Send remaining chunks
        for (let i = 1; i < imageChunks.length; i++) {
          const chunk = imageChunks[i];
          const chunkMediaGroup = chunk.map(url => ({
            type: 'photo',
            media: url
          }));

          const chunkResponse = await fetch(
            `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMediaGroup`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: TG_CHAT_ID,
                media: chunkMediaGroup
              })
            }
          );

          if (!chunkResponse.ok) {
            const errorText = await chunkResponse.text();
            console.warn(`⚠️ [QStash] Failed to send chunk ${i + 1}: ${errorText}`);
          } else {
            console.log(`✅ [QStash] Successfully sent chunk ${i + 1} with ${chunk.length} images`);
          }

          // Small delay between chunks
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`✅ [QStash] Product ${productId} notification sent successfully on attempt ${attempt}`);

        // Update product notification timestamp and status
        try {
          await supabaseClient
            .from('products')
            .update({ 
              last_notification_sent_at: new Date().toISOString(),
              telegram_notification_status: 'sent',
              catalog_position: new Date().toISOString() // обновляем позицию в каталоге
            })
            .eq('id', productId);

          console.log(`✅ [QStash] Updated last_notification_sent_at and catalog_position for product ${productId}`);
        } catch (dbError) {
          console.error('⚠️ [QStash] Failed to update product timestamp:', dbError);
          // Не возвращаем ошибку, так как уведомление было отправлено успешно
        }

        return new Response(
          JSON.stringify({ success: true, attempt }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        lastError = error;
        console.error(`❌ [QStash] Attempt ${attempt} failed:`, error);
        
        if (attempt < MAX_RETRIES) {
          // Извлекаем retry_after из ошибки Telegram если есть
          let retryAfter = 0;
          if (error.message && error.message.includes('retry_after')) {
            try {
              const match = error.message.match(/"retry_after":(\d+)/);
              if (match) retryAfter = parseInt(match[1], 10);
            } catch (parseError) {
              console.warn('Failed to parse retry_after from error:', parseError);
            }
          }

          // Используем retry_after из Telegram или стандартный backoff
          const baseDelay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s, 8s, 16s
          const telegramDelay = retryAfter * 1000;
          const delay = Math.max(telegramDelay, baseDelay, 3000); // Минимум 3 секунды

          console.log(`🔄 [QStash] Retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES}, telegram retry_after: ${retryAfter}s)`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`💥 [QStash] All ${MAX_RETRIES} attempts failed for product ${productId}`);
    return new Response(
      JSON.stringify({ error: 'All retry attempts failed', lastError: lastError?.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );

  } catch (error) {
    console.error('💥 [QStash] Handler error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
