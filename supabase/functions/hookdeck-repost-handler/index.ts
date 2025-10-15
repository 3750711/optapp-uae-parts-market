import { createClient } from 'jsr:@supabase/supabase-js@2';

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const PRODUCT_GROUP_CHAT_ID = Deno.env.get('TELEGRAM_GROUP_CHAT_ID') || '-1002804153717';
const MAX_IMAGES_PER_GROUP = 10;
const MAX_RETRIES = 5;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= Helper Functions =============

/**
 * Wait between API calls to avoid rate limiting
 */
const waitBetweenBatches = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Optimize Cloudinary image URL to use WebP format and compression
 */
function optimizeImageUrl(url: string): string {
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }
  
  if (url.includes('f_webp') || url.includes('q_auto')) {
    console.log(`✅ Image already optimized: ${url.substring(0, 80)}...`);
    return url;
  }
  
  const transformations = 'f_webp,q_auto:best,c_limit,w_2048/';
  const optimizedUrl = url.replace('/upload/', `/upload/${transformations}`);
  
  console.log(`🎨 Optimizing image URL:`);
  console.log(`   Before: ${url.substring(0, 100)}...`);
  console.log(`   After:  ${optimizedUrl.substring(0, 100)}...`);
  
  return optimizedUrl;
}

/**
 * Pre-validate image URL accessibility
 */
async function validateImageUrl(imageUrl: string): Promise<{ valid: boolean; error?: string }> {
  try {
    console.log(`🔍 Validating image: ${imageUrl.substring(0, 80)}...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(imageUrl, {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const error = `HTTP ${response.status}: ${response.statusText}`;
      console.error(`❌ Image validation failed: ${error}`);
      return { valid: false, error };
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.startsWith('image/')) {
      const error = `Invalid content-type: ${contentType}`;
      console.error(`❌ Image validation failed: ${error}`);
      return { valid: false, error };
    }
    
    console.log(`✅ Image validation passed`);
    return { valid: true };
  } catch (error) {
    const errorMsg = error.name === 'AbortError' ? 'Timeout (5s)' : error.message;
    console.error(`❌ Image validation error: ${errorMsg}`);
    return { valid: false, error: errorMsg };
  }
}

/**
 * Get Telegram display format for seller
 */
function getTelegramForDisplay(telegram: string | null): string {
  if (!telegram) return 'N/A';
  
  // Remove @ if present
  const cleanTelegram = telegram.startsWith('@') ? telegram.substring(1) : telegram;
  
  // If it's a URL, extract username
  if (cleanTelegram.includes('t.me/') || cleanTelegram.includes('telegram.me/')) {
    const username = cleanTelegram.split('/').pop() || cleanTelegram;
    return `@${username}`;
  }
  
  return `@${cleanTelegram}`;
}

/**
 * Log notification to telegram_notifications_log
 */
async function logTelegramNotification(
  supabaseClient: any,
  data: {
    function_name: string;
    notification_type: string;
    recipient_type: 'personal' | 'group';
    recipient_identifier: string;
    recipient_name?: string;
    message_text: string;
    status: 'sent' | 'failed' | 'pending';
    telegram_message_id?: string;
    related_entity_type?: string;
    related_entity_id?: string;
    error_details?: any;
    metadata?: any;
  }
): Promise<void> {
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
      });

    if (error) {
      console.error('❌ Failed to log telegram notification:', error);
    } else {
      console.log('✅ Telegram notification logged successfully');
    }
  } catch (error) {
    console.error('💥 Exception while logging telegram notification:', error);
  }
}

// ============= Main Handler =============

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔄 [Hookdeck Repost Handler] Starting request processing...');

  try {
    // Parse request body
    const { productId, priceChanged, newPrice, oldPrice } = await req.json();
    
    console.log(`📦 Processing repost for product: ${productId}`);
    if (priceChanged) {
      console.log(`💰 Price changed: ${oldPrice} → ${newPrice}`);
    }

    // Create Supabase client with Service Role Key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    );

    // Load product with images
    console.log('📂 Loading product data from database...');
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select(`
        *,
        product_images(*)
      `)
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('❌ Product not found:', productError);
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log(`✅ Product loaded: ${product.title} (Lot #${product.lot_number})`);

    // Load seller profile
    console.log('👤 Loading seller profile...');
    const { data: seller } = await supabaseClient
      .from('profiles')
      .select('opt_id, telegram, full_name, location')
      .eq('id', product.seller_id)
      .single();

    console.log(`✅ Seller loaded: ${seller?.full_name || 'Unknown'} (${seller?.opt_id || 'N/A'})`);

    // Get images
    const images = product.product_images || [];
    const imageUrls = images.map((img: any) => img.url);

    if (imageUrls.length === 0) {
      console.error('❌ No images found for product');
      return new Response(
        JSON.stringify({ error: 'No images found for product' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`📸 Found ${imageUrls.length} images`);

    // STEP 1: Optimize all Cloudinary URLs
    console.log('🎨 Step 1: Optimizing Cloudinary URLs for WebP...');
    const optimizedUrls = imageUrls.map((url: string) => optimizeImageUrl(url));
    console.log(`✅ Optimization complete: ${optimizedUrls.length} URLs processed`);

    // STEP 2: Pre-validate all images
    console.log('🔍 Step 2: Pre-validating all optimized images...');
    const validationResults = await Promise.all(
      optimizedUrls.map((url: string) => validateImageUrl(url))
    );

    // Filter out invalid images
    const validImages: string[] = [];
    const problematicImages: string[] = [];
    const allAttempts: any[] = [];

    optimizedUrls.forEach((url: string, index: number) => {
      if (validationResults[index].valid) {
        validImages.push(url);
      } else {
        console.warn(`⚠️ Skipping invalid image ${index + 1}: ${url.substring(0, 80)}...`);
        console.warn(`   Reason: ${validationResults[index].error}`);
        problematicImages.push(url);
        
        allAttempts.push({
          image_url: url,
          image_index: index + 1,
          attempt_number: 0,
          status: 'validation_failed',
          error: validationResults[index].error,
          timestamp: new Date().toISOString()
        });
      }
    });

    if (validImages.length === 0) {
      console.error('❌ No valid images found after validation');
      
      await logTelegramNotification(supabaseClient, {
        function_name: 'hookdeck-repost-handler',
        notification_type: 'repost',
        recipient_type: 'group',
        recipient_identifier: PRODUCT_GROUP_CHAT_ID,
        message_text: `Repost failed for product ${product.lot_number}`,
        status: 'failed',
        related_entity_type: 'product',
        related_entity_id: productId,
        error_details: {
          error_code: 'ALL_IMAGES_INVALID',
          total_images: imageUrls.length,
          problematic_images: problematicImages,
          all_attempts: allAttempts
        }
      });

      await supabaseClient
        .from('products')
        .update({ 
          telegram_notification_status: 'failed',
          telegram_last_error: `All ${imageUrls.length} images failed validation`,
          tg_notify_status: 'failed',
          tg_notify_error: 'ALL_IMAGES_INVALID'
        })
        .eq('id', productId);

      return new Response(
        JSON.stringify({ 
          error: 'All images failed validation',
          problematic_images: problematicImages
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`✅ Validation complete: ${validImages.length}/${imageUrls.length} images valid`);

    // STEP 3: Split into chunks
    const imageChunks = [];
    for (let i = 0; i < validImages.length; i += MAX_IMAGES_PER_GROUP) {
      imageChunks.push(validImages.slice(i, i + MAX_IMAGES_PER_GROUP));
    }
    
    console.log(`📦 Divided ${validImages.length} valid images into ${imageChunks.length} chunks`);

    // STEP 4: Form message text
    const telegramDisplay = getTelegramForDisplay(seller?.telegram);
    
    let messageText = [
      `🔄 <b>ПЕРЕОБЪЯВЛЕНИЕ / REPOST</b>`,
      '',
      `<b>${product.title}</b>`,
      `🏷️ Бренд: ${product.brand}`,
      `📦 Модель: ${product.model || 'N/A'}`,
      `💰 Цена: ${product.price} AED`,
      '',
      `📍 Локация: ${seller?.location || product.product_location || 'Dubai'}`,
      `🆔 Лот: ${product.lot_number}`,
      `🆔 OPT_ID продавца: ${seller?.opt_id || 'N/A'}`,
      `👤 Telegram продавца: ${telegramDisplay}`,
      ''
    ].join('\n');

    if (priceChanged && oldPrice && newPrice) {
      messageText += `\n💸 <b>Цена изменена:</b> ${oldPrice} → ${newPrice} AED\n`;
    }

    // STEP 5: Send all chunks to Telegram
    console.log('📤 Step 5: Sending chunks to Telegram...');
    let allMediaGroupsSuccessful = true;
    let successfulBatches = 0;

    for (let i = 0; i < imageChunks.length; i++) {
      const chunk = imageChunks[i];
      const mediaItems = [];

      // Wait between chunks
      if (i > 0) {
        console.log(`⏳ Waiting 5 seconds before sending chunk ${i+1}...`);
        await waitBetweenBatches(5000);
      }

      // Prepare media items
      for (let j = 0; j < chunk.length; j++) {
        const imageUrl = chunk[j];
        const imageIndex = (i * MAX_IMAGES_PER_GROUP) + j + 1;
        console.log(`📎 Adding image ${imageIndex}/${validImages.length} to chunk ${i + 1}`);

        const isFirstImageOfFirstGroup = i === 0 && j === 0;
        const mediaItem: any = {
          type: 'photo',
          media: imageUrl,
        };

        if (isFirstImageOfFirstGroup && messageText) {
          mediaItem.caption = messageText;
          mediaItem.parse_mode = 'HTML';
        }

        mediaItems.push(mediaItem);
      }

      console.log(`📤 Sending chunk ${i + 1}/${imageChunks.length} with ${chunk.length} images`);

      // Retry logic for each chunk
      let mediaGroupResult = null;
      let retryCount = 0;

      while (retryCount < MAX_RETRIES) {
        const attemptLog = {
          chunk_number: i + 1,
          chunk_size: chunk.length,
          attempt_number: retryCount + 1,
          timestamp: new Date().toISOString()
        };

        try {
          console.log(`🔄 Attempt ${retryCount + 1}/${MAX_RETRIES} for chunk ${i + 1}`);

          const mediaGroupResponse = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: PRODUCT_GROUP_CHAT_ID,
                media: mediaItems,
              }),
            }
          );

          mediaGroupResult = await mediaGroupResponse.json();

          console.log(`📊 Chunk ${i + 1} attempt ${retryCount + 1} result:`, 
            mediaGroupResult.ok ? '✅ SUCCESS' : '❌ FAILED');

          if (!mediaGroupResult.ok) {
            console.error(`🔴 Telegram API Error:`, {
              error_code: mediaGroupResult.error_code,
              description: mediaGroupResult.description,
            });
          }

          Object.assign(attemptLog, {
            status: mediaGroupResult.ok ? 'success' : 'failed',
            error_code: mediaGroupResult.error_code,
            error_description: mediaGroupResult.description,
            telegram_message_id: mediaGroupResult.result?.[0]?.message_id,
          });
          allAttempts.push(attemptLog);

          if (mediaGroupResult.ok) {
            console.log(`✅ Chunk ${i + 1} sent successfully`);
            successfulBatches++;
            break;
          } else {
            const retryAfter = mediaGroupResult.parameters?.retry_after || 10;
            console.error(`❌ Chunk ${i + 1} failed, attempt ${retryCount + 1}`);

            if (mediaGroupResult.error_code === 'WEBPAGE_MEDIA_EMPTY' || 
                mediaGroupResult.description?.includes('media_empty')) {
              console.warn(`⚠️ Image-related error detected`);
              chunk.forEach((url: string) => {
                if (!problematicImages.includes(url)) {
                  problematicImages.push(url);
                }
              });
            }

            retryCount++;

            if (retryCount < MAX_RETRIES) {
              const waitTime = (Math.pow(2, retryCount) * 1000) + (retryAfter * 1000);
              console.log(`⏳ Waiting ${(waitTime/1000).toFixed(1)}s before retry...`);
              await waitBetweenBatches(waitTime);
            }
          }
        } catch (error) {
          console.error(`💥 Network error sending chunk ${i + 1}:`, error);

          Object.assign(attemptLog, {
            status: 'network_error',
            error: error.message
          });
          allAttempts.push(attemptLog);

          retryCount++;

          if (retryCount < MAX_RETRIES) {
            const waitTime = Math.pow(2, retryCount) * 2000;
            console.log(`⏳ Waiting ${(waitTime/1000).toFixed(1)}s before retry...`);
            await waitBetweenBatches(waitTime);
          }
        }
      }

      // Graceful degradation if all retries failed
      if (retryCount >= MAX_RETRIES && chunk.length > 5) {
        console.log(`🔄 Graceful degradation: trying with fewer images...`);
        allMediaGroupsSuccessful = false;

        const smallerChunk = chunk.slice(0, chunk.length > 7 ? 5 : 3);
        const smallerItems = smallerChunk.map((imageUrl: string, index: number) => {
          if (index === 0 && i === 0) {
            return {
              type: 'photo',
              media: imageUrl,
              caption: messageText,
              parse_mode: 'HTML'
            };
          }
          return { type: 'photo', media: imageUrl };
        });

        await waitBetweenBatches(3000);

        try {
          const smallerResponse = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: PRODUCT_GROUP_CHAT_ID,
                media: smallerItems
              }),
            }
          );

          const smallerResult = await smallerResponse.json();
          console.log(`📊 Smaller batch result:`, smallerResult.ok ? '✅ SUCCESS' : '❌ FAILED');

          allAttempts.push({
            chunk_number: i + 1,
            chunk_size: smallerChunk.length,
            attempt_number: 'graceful_degradation',
            status: smallerResult.ok ? 'success' : 'failed',
            error_code: smallerResult.error_code,
            error_description: smallerResult.description,
            timestamp: new Date().toISOString()
          });

          if (smallerResult.ok) {
            console.log(`✅ Graceful degradation successful`);
            successfulBatches++;

            chunk.slice(smallerChunk.length).forEach((url: string) => {
              if (!problematicImages.includes(url)) {
                problematicImages.push(url);
              }
            });
          }
        } catch (error) {
          console.error(`💥 Error during graceful degradation:`, error);
        }
      } else if (retryCount >= MAX_RETRIES) {
        allMediaGroupsSuccessful = false;
      }
    }

    // STEP 6: Final logging and database updates
    console.log('📊 === FINAL SUMMARY ===');
    console.log(`Total images submitted: ${imageUrls.length}`);
    console.log(`Valid images: ${validImages.length}`);
    console.log(`Problematic images: ${problematicImages.length}`);
    console.log(`Successful chunks: ${successfulBatches}/${imageChunks.length}`);

    const finalStatus = allMediaGroupsSuccessful ? 'sent' : 
                       successfulBatches > 0 ? 'partial' : 
                       'failed';

    // Update product status
    await supabaseClient
      .from('products')
      .update({
        last_notification_sent_at: new Date().toISOString(),
        telegram_notification_status: finalStatus,
        tg_notify_status: finalStatus,
        ...(finalStatus === 'failed' && {
          telegram_last_error: `Failed to send repost notification`,
          tg_notify_error: 'REPOST_FAILED'
        })
      })
      .eq('id', productId);

    // Log to telegram_notifications_log
    await logTelegramNotification(supabaseClient, {
      function_name: 'hookdeck-repost-handler',
      notification_type: 'repost',
      recipient_type: 'group',
      recipient_identifier: PRODUCT_GROUP_CHAT_ID,
      message_text: messageText,
      status: finalStatus === 'failed' ? 'failed' : 'sent',
      related_entity_type: 'product',
      related_entity_id: productId,
      metadata: {
        price_changed: priceChanged || false,
        old_price: oldPrice,
        new_price: newPrice,
        total_images: imageUrls.length,
        valid_images: validImages.length,
        successful_batches: successfulBatches,
        total_batches: imageChunks.length,
        problematic_images: problematicImages,
        all_attempts: allAttempts
      }
    });

    // Log to event_logs
    await supabaseClient.from('event_logs').insert({
      entity_type: 'product',
      entity_id: productId,
      user_id: 'hookdeck-system',
      action_type: 'product_repost',
      details: {
        success: finalStatus !== 'failed',
        status: finalStatus,
        notification_type: 'repost',
        lot_number: product.lot_number,
        product_title: product.title,
        price_changed: priceChanged || false,
        new_price: priceChanged ? newPrice : undefined,
        old_price: priceChanged ? oldPrice : undefined,
        source: 'hookdeck',
        successful_batches: successfulBatches,
        total_batches: imageChunks.length
      }
    });

    console.log(`✅ Repost handler completed with status: ${finalStatus}`);

    // Return response
    if (finalStatus === 'failed') {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send notification',
          problematic_images: problematicImages,
          attempts: allAttempts.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: finalStatus === 'sent' 
          ? 'Repost notification sent successfully'
          : 'Repost notification partially sent',
        status: finalStatus,
        successful_batches: successfulBatches,
        total_batches: imageChunks.length,
        problematic_images: problematicImages.length > 0 ? problematicImages : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 [Hookdeck Repost Handler] Fatal error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
