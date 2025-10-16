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
    // Basic QStash signature check
    const signature = req.headers.get("Upstash-Signature");
    if (!signature) {
      console.error('❌ [QStash] Missing signature header');
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.text();
    const data = JSON.parse(body);
    const { productId, notificationType = 'repost', priceChanged, newPrice, oldPrice } = data;

    console.log(`📮 [QStash] Processing ${notificationType} notification:`, { productId });

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

    // === SPECIAL CASE: Sold notification (text-only) ===
    if (notificationType === 'sold') {
      console.log('📝 [QStash] Sending sold notification (text-only)');
      
      const titleParts = [product.title, product.brand, product.model].filter(Boolean);
      const fullTitle = titleParts.join(' ').trim();
      
      const textMessage = `😔 Жаль, но Лот #${product.lot_number} ${fullTitle} уже ушел!\nКто-то оказался быстрее... в следующий раз повезет - будь начеку.`;
      
      try {
        const response = await fetch(
          `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: TG_CHAT_ID,
              text: textMessage,
              parse_mode: 'HTML'
            })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Telegram API error: ${errorText}`);
        }

        console.log(`✅ [QStash] Sold notification sent successfully for product ${productId}`);
        
        // Update product and log
        await supabaseClient
          .from('products')
          .update({ 
            last_notification_sent_at: new Date().toISOString(),
            telegram_notification_status: 'sent'
          })
          .eq('id', productId);

        await supabaseClient.from('telegram_notifications_log').insert({
          function_name: 'upstash-repost-handler',
          notification_type: 'sold',
          recipient_type: 'group',
          recipient_identifier: TG_CHAT_ID || 'unknown',
          message_text: textMessage,
          status: 'sent',
          related_entity_type: 'product',
          related_entity_id: productId
        });

        return new Response(
          JSON.stringify({ success: true, type: 'sold' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('❌ [QStash] Failed to send sold notification:', error);
        
        await supabaseClient.from('telegram_notifications_log').insert({
          function_name: 'upstash-repost-handler',
          notification_type: 'sold',
          recipient_type: 'group',
          recipient_identifier: TG_CHAT_ID || 'unknown',
          message_text: textMessage,
          status: 'failed',
          error_details: { error: error.message },
          related_entity_type: 'product',
          related_entity_id: productId
        });

        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // === IMAGE-BASED NOTIFICATIONS (repost, product_published) ===
    
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

    // Validate all image URLs with timeout
    const VALIDATION_TIMEOUT = 3000; // 3 seconds per image
    const validationStart = Date.now();
    const validImageUrls: string[] = [];
    
    for (const url of imageUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), VALIDATION_TIMEOUT);
        
        const response = await fetch(url, { 
          method: 'HEAD',
          signal: controller.signal 
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          validImageUrls.push(url);
        } else {
          console.warn(`⚠️ [QStash] Invalid image URL (${response.status}): ${url}`);
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn(`⚠️ [QStash] Image validation timeout (${VALIDATION_TIMEOUT}ms): ${url}`);
        } else {
          console.warn(`⚠️ [QStash] Error validating image URL: ${url}`, error);
        }
      }
    }

    const validationDuration = Date.now() - validationStart;
    console.log(`⏱️ [QStash] Validation took ${validationDuration}ms for ${imageUrls.length} images`);

    if (validImageUrls.length === 0) {
      console.error('❌ [QStash] No valid images found');
      return new Response(
        JSON.stringify({ error: 'No valid images' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`✅ [QStash] Validated ${validImageUrls.length}/${imageUrls.length} images`);

    // Формируем полный заголовок с брендом и моделью
    const titleParts = [
      product.title,
      product.brand,
      product.model
    ].filter(Boolean);
    const fullTitle = titleParts.join(' ').trim();

    // Проверяем снижение цены
    const isPriceReduced = priceChanged && newPrice && oldPrice && newPrice < oldPrice;

    // Добавляем ❗️SALE❗️ к номеру лота при снижении цены
    const lotNumber = isPriceReduced 
      ? `#${product.lot_number}❗️SALE❗️`
      : `#${product.lot_number}`;

    // Формируем информацию о цене
    const priceInfo = priceChanged && newPrice && oldPrice
      ? `\n💰 Новая цена: ${newPrice} $ (было ${oldPrice} $)`
      : `\n💰 Цена: ${product.price} $`;

    // Добавляем описание, если оно есть (с ограничением в 200 символов)
    const descriptionLine = product.description 
      ? `\n📝 ${product.description.slice(0, 200)}${product.description.length > 200 ? '...' : ''}` 
      : '';

    // Caption зависит от типа уведомления
    const statusLine = notificationType === 'product_published' 
      ? '\n\n📊 Статус: Опубликован'
      : '\n\n📊 Статус: Опубликован';
    
    const caption = `LOT(лот) ${lotNumber}\n📦 ${fullTitle}${priceInfo}\n🚚 Цена доставки: ${product.delivery_price || 0} $\n🆔 OPT_ID продавца: ${product.profiles?.opt_id || 'N/A'}\n👤 Telegram продавца: ${getTelegramForDisplay(product.profiles?.telegram || '', localTelegramAccounts)}${descriptionLine}${statusLine}`;

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
                notification_type: `${notificationType}_rate_limit`,
                recipient_type: 'group',
                recipient_identifier: TG_CHAT_ID || 'unknown',
                message_text: `Rate limit for product ${productId} (${notificationType})`,
                status: 'failed',
                error_details: { retry_after: retryAfter, attempt, status: response.status, notification_type: notificationType },
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
              telegram_notification_status: 'sent'
              // catalog_position уже обновлен на frontend в useProductRepost
            })
            .eq('id', productId);

          console.log(`✅ [QStash] Updated last_notification_sent_at for product ${productId}`);
          
          // Log successful notification to telegram_notifications_log
          await supabaseClient.from('telegram_notifications_log').insert({
            function_name: 'upstash-repost-handler',
            notification_type: notificationType,
            recipient_type: 'group',
            recipient_identifier: TG_CHAT_ID || 'unknown',
            message_text: caption.substring(0, 500), // First 500 chars
            status: 'sent',
            related_entity_type: 'product',
            related_entity_id: productId,
            metadata: {
              attempt,
              image_count: validImageUrls.length,
              price_changed: priceChanged,
              new_price: newPrice,
              old_price: oldPrice,
              notification_type: notificationType
            }
          });
          
          console.log(`✅ [QStash] Logged successful ${notificationType} notification to telegram_notifications_log`);
        } catch (dbError) {
          console.error('⚠️ [QStash] Failed to update product or log repost:', dbError);
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
