import { createServiceClient } from '../_shared/client.ts';
import { getLocalTelegramAccounts, getTelegramForDisplay } from "../shared/telegram-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Извлекает номер проблемного изображения из Telegram ошибки
function parseFailedImageIndex(errorDescription: string): number | null {
  // "Bad Request: failed to send message #3 with the error message \"WEBPAGE_MEDIA_EMPTY\""
  const match = errorDescription.match(/message #(\d+)/);
  return match ? parseInt(match[1], 10) - 1 : null; // -1 т.к. Telegram считает с 1, массив с 0
}

const MAX_RETRIES = 3; // ✅ Уменьшено с 5, т.к. теперь ждём правильные интервалы
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
    
    // Get product images - use original URLs without Cloudinary optimization
    // Telegram performs its own optimization, so additional transformations can cause
    // WEBPAGE_MEDIA_EMPTY errors due to redirects or on-the-fly generation
    const imageUrls = product.product_images?.map(img => img.url) || [];
    console.log(`📷 Using ${imageUrls.length} original image URLs for Telegram delivery`);

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

    // Check caption length (Telegram limit is 1024 chars)
    console.log(`📝 [QStash] Caption length: ${caption.length} chars`);
    if (caption.length > 1024) {
      console.warn(`⚠️ [QStash] Caption exceeds Telegram limit (1024 chars), truncating...`);
      const truncatedCaption = caption.substring(0, 1020) + '...';
      console.log(`📝 [QStash] Truncated to: ${truncatedCaption.length} chars`);
    }

    // Send to Telegram with retry logic
    let lastError: any = null;
    let lastRetryAfter = 0; // ✅ Сохраняем retry_after между попытками
    
    // ✅ Создаём локальную копию для фильтрации, не затрагиваем исходный массив из БД
    let currentImageUrls = [...validImageUrls];
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`📤 [QStash] Attempt ${attempt}/${MAX_RETRIES} to send to Telegram`);

        // Split images into chunks of 10 (Telegram limit)
        const CHUNK_SIZE = 10;
        const imageChunks: string[][] = [];
        
        for (let i = 0; i < currentImageUrls.length; i += CHUNK_SIZE) {
          imageChunks.push(currentImageUrls.slice(i, i + CHUNK_SIZE));
        }

        console.log(`Divided ${currentImageUrls.length} images into ${imageChunks.length} chunks`);

        // Send first chunk with caption
        const firstChunk = imageChunks[0];
        const mediaGroup = firstChunk.map((url, index) => ({
          type: 'photo',
          media: url,
          ...(index === 0 ? { caption } : {})
        }));

        // Log URLs being sent to Telegram for debugging
        console.log(`📸 [QStash] Sending ${mediaGroup.length} images to Telegram:`);
        mediaGroup.forEach((m, i) => {
          console.log(`  [${i}] ${m.media.substring(0, 120)}${m.media.length > 120 ? '...' : ''}`);
        });

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
          lastRetryAfter = retryAfter; // ✅ Сохраняем для использования в retry loop

          // Detailed error logging for debugging
          console.error(`❌ [Telegram] API error ${response.status}:`, {
            status: response.status,
            statusText: response.statusText,
            error_description: errorData.description || 'No description',
            error_code: errorData.error_code,
            parameters: errorData.parameters,
            retry_after: retryAfter,
            full_error: JSON.stringify(errorData)
          });

          // ✅ СПЕЦИАЛЬНАЯ ОБРАБОТКА: WEBPAGE_MEDIA_EMPTY (обрабатываем ПЕРВОЙ)
          if (response.status === 400 && errorData.description?.includes('WEBPAGE_MEDIA_EMPTY')) {
            const failedIndex = parseFailedImageIndex(errorData.description);
            
            console.warn(`⚠️ [Telegram] Image not accessible at index ${failedIndex}`);
            
            if (failedIndex !== null && failedIndex < currentImageUrls.length) {
              const removedUrl = currentImageUrls[failedIndex];
              console.log(`🗑️ [QStash] Removing inaccessible image: ${removedUrl}`);
              
              // ✅ Удаляем только из ЛОКАЛЬНОЙ копии, не из БД
              currentImageUrls.splice(failedIndex, 1);
              
              // Логируем удаление для аналитики
              await supabaseClient.from('telegram_notifications_log').insert({
                function_name: 'upstash-repost-handler',
                notification_type: `${notificationType}_image_skipped`,
                recipient_type: 'system',
                recipient_identifier: 'validation',
                message_text: `Skipped inaccessible image for product ${productId}`,
                status: 'warning',
                error_details: {
                  product_id: productId,
                  skipped_url: removedUrl,
                  failed_index: failedIndex,
                  remaining_images: currentImageUrls.length,
                  original_image_count: validImageUrls.length,
                  error: errorData.description
                },
                related_entity_type: 'product',
                related_entity_id: productId
              });
              
              if (currentImageUrls.length > 0) {
                console.log(`🔄 [QStash] Retrying IMMEDIATELY with ${currentImageUrls.length}/${validImageUrls.length} images`);
                attempt--; // Не засчитываем как попытку
                continue; // ✅ Повторяем СРАЗУ без задержки
              } else {
                throw new Error('No valid images remaining after filtering');
              }
            }
            
            // ✅ Если не удалось обработать, продолжаем с обычной ошибкой
            console.error(`❌ [WEBPAGE_MEDIA_EMPTY] Could not parse failed image index, treating as regular error`);
          }

          // ✅ СПЕЦИАЛЬНАЯ ОБРАБОТКА: Rate limit (429)
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
                error_details: { 
                  retry_after: retryAfter, // ✅ Сохраняем реальное значение
                  attempt, 
                  status: response.status, 
                  notification_type: notificationType,
                  description: errorData.description
                },
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
              image_count: currentImageUrls.length,
              images_original: validImageUrls.length,
              images_skipped: validImageUrls.length - currentImageUrls.length,
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
          // ✅ FIX: Используем сохранённое значение retry_after
          const retryAfter = lastRetryAfter || 0;
          
          // Используем retry_after из Telegram или стандартный backoff
          const baseDelay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
          const telegramDelay = retryAfter * 1000;
          const delay = Math.min(Math.max(telegramDelay, baseDelay), 10000); // Максимум 10 секунд

          console.log(`🔄 [QStash] Retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`);
          console.log(`   - Telegram retry_after: ${retryAfter}s`);
          console.log(`   - Base exponential: ${baseDelay}ms`);
          console.log(`   - Final delay: ${delay}ms`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`💥 [QStash] All ${MAX_RETRIES} attempts exhausted for product ${productId}`);
    
    // ✅ Логируем финальный сбой в telegram_notifications_log
    try {
      await supabaseClient.from('telegram_notifications_log').insert({
        function_name: 'upstash-repost-handler',
        notification_type: `${notificationType}_all_retries_failed`,
        recipient_type: 'group',
        recipient_identifier: TG_CHAT_ID || 'unknown',
        message_text: `All retries exhausted for product ${productId}`,
        status: 'failed',
        error_details: { 
          last_error: lastError?.message || 'Unknown error',
          total_attempts: MAX_RETRIES,
          last_retry_after: lastRetryAfter,
          images_sent: currentImageUrls.length,
          images_original: validImageUrls.length,
          images_skipped: validImageUrls.length - currentImageUrls.length
        },
        related_entity_type: 'product',
        related_entity_id: productId
      });
    } catch (logError) {
      console.error('⚠️ Failed to log final failure:', logError);
    }
    
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
