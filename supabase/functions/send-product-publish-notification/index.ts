
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logTelegramNotification } from '../shared/telegram-logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '7251106221:AAE3UaXbAejz1SzkhknDTrsASjpe-glhL0s';
const PRODUCT_GROUP_CHAT_ID = '-4623601047';
const MIN_IMAGES_REQUIRED = 1;
const MAX_IMAGES_PER_GROUP = 10;

console.log('Product publish notification function ready');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? "",
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    );

    // Parse request body
    const reqData = await req.json();
    console.log('Received request data:', reqData);

    const { productId } = reqData;

    if (!productId) {
      console.log('Missing required parameter: productId');
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: productId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing publish notification for product ID: ${productId}`);
    
    // Fetch complete product details including images
    const { data: product, error } = await supabaseClient
      .from('products')
      .select(`
        *,
        product_images(*)
      `)
      .eq('id', productId)
      .maybeSingle();

    if (error || !product) {
      console.log('Error fetching product:', error);
      return new Response(
        JSON.stringify({ error: error?.message || 'Product not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log('Successfully fetched product:', product.title, 'status:', product.status);
    
    // Check if there are any images for this product
    const images = product.product_images || [];
    console.log('Product has', images.length, 'images');
    
    // Don't send notification if there are not enough images
    if (images.length < MIN_IMAGES_REQUIRED) {
      console.log(`Not enough images found for product (${images.length}/${MIN_IMAGES_REQUIRED}), skipping notification`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Notification skipped - not enough images found (${images.length}/${MIN_IMAGES_REQUIRED})` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Helper function to format brand and model
    const formatBrandModel = (brand: string | null, model: string | null): string => {
      const brandText = brand || '';
      const modelText = model || '';
      
      if (brandText && modelText) {
        return ` ${brandText} ${modelText}`;
      } else if (brandText) {
        return ` ${brandText}`;
      } else if (modelText) {
        return ` ${modelText}`;
      }
      return '';
    };

    // List of local Telegram accounts that should show their real username
    const localTelegramAccounts = [
      'OptSeller_Anton',
      'OptSeller_Georgii',
      'IgorD_OptSeller',
      'OptSeller_IgorK',
      'Pavel_optuae',
      'SanSanichUAE',
      'dmotrii_st',
      'OptSeller_Vlad',
      'LocalSeller_Ali',
      'Faruknose', 
      'faiznose',
      'LocalSeller_Jahangir',
      'LocalSeller_Pochemy',
      'LocalSeller_Rakib',
      'LocalSeller_Sharif',
      'LocalSeller_Younus'
    ];

    // Function to determine which Telegram to display in notifications
    const getTelegramForDisplay = (telegram: string) => {
      if (!telegram) return 'Для заказа пересылайте лот @Nastya_PostingLots_OptCargo';
      
      // Remove @ symbol if present for comparison
      const cleanTelegram = telegram.replace('@', '');
      
      if (localTelegramAccounts.includes(cleanTelegram)) {
        return `@${cleanTelegram}`;
      }
      return 'Для заказа пересылайте лот @Nastya_PostingLots_OptCargo';
    };

    // Create notification message for product publication
    const brandModelText = formatBrandModel(product.brand, product.model);
    
    const messageText = [
      `LOT(лот) #${product.lot_number}`,
      `📦 ${product.title}${brandModelText}`,
      `💰 Цена: ${product.price} $`,
      `🚚 Цена доставки: ${product.delivery_price} $`,
      `🆔 OPT_ID продавца: ${product.optid_created || ''}`,
      `👤 Telegram продавца: ${getTelegramForDisplay(product.telegram_url || '')}`,
      '',
      `📊 Статус: Опубликован`
    ].join('\n');
    
    console.log('Sending message to Telegram:', messageText);
    
    // Send images with message
    const imageUrls = images.map((image: any) => image.url);
    const sendResult = await sendImageMediaGroups(imageUrls, messageText, supabaseClient, productId);
    
    const success = sendResult.success;
    
    if (success) {
      // Update the notification timestamp
      const { error: updateError } = await supabaseClient
        .from('products')
        .update({ last_notification_sent_at: new Date().toISOString() })
        .eq('id', productId);
        
      if (updateError) {
        console.error('Error updating notification timestamp:', updateError);
      }
      
      return new Response(
        JSON.stringify({ success: true, message: 'Product publish notification sent successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to send product publish notification' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Function to send images in media groups
async function sendImageMediaGroups(
  imageUrls: string[], 
  messageText: string, 
  supabaseClient: any, 
  productId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (imageUrls.length === 0) {
      console.log('No images to send');
      
      // Log text-only notification
      try {
        await logTelegramNotification(supabaseClient, {
          function_name: 'send-product-publish-notification',
          notification_type: 'product_published',
          recipient_type: 'group',
          recipient_identifier: PRODUCT_GROUP_CHAT_ID,
          recipient_name: 'Product Group',
          message_text: messageText,
          status: 'failed',
          related_entity_type: 'product',
          related_entity_id: productId,
          error_details: { error: 'No images available' },
          metadata: {
            images_count: 0,
            chunks_count: 0,
            chunk_number: 0
          }
        });
      } catch (logError) {
        console.error('❌ Failed to log no images notification:', logError);
      }
      
      return { success: false, error: 'No images available' };
    }

    console.log(`Preparing to send ${imageUrls.length} images in media group(s)`);
    
    // Split images into chunks of MAX_IMAGES_PER_GROUP
    const chunks = [];
    for (let i = 0; i < imageUrls.length; i += MAX_IMAGES_PER_GROUP) {
      chunks.push(imageUrls.slice(i, i + MAX_IMAGES_PER_GROUP));
    }
    
    console.log(`Divided ${imageUrls.length} images into ${chunks.length} chunks`);
    
    // Send first chunk with caption
    const firstChunk = chunks[0];
    console.log(`Sending first chunk with ${firstChunk.length} images and caption`);
    
    const media = firstChunk.map((url, index) => ({
      type: 'photo',
      media: url,
      caption: index === 0 ? messageText : undefined
    }));
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: PRODUCT_GROUP_CHAT_ID,
        media: media
      }),
    });
    
    const result = await response.json();
    
    if (!result.ok) {
      console.error('Error sending first media group:', result.description);
      
      // Log failed first chunk
      try {
        await logTelegramNotification(supabaseClient, {
          function_name: 'send-product-publish-notification',
          notification_type: 'product_published',
          recipient_type: 'group',
          recipient_identifier: PRODUCT_GROUP_CHAT_ID,
          recipient_name: 'Product Group',
          message_text: messageText,
          status: 'failed',
          related_entity_type: 'product',
          related_entity_id: productId,
          error_details: { 
            telegram_error: result.description,
            error_code: result.error_code,
            chunk_number: 1
          },
          metadata: {
            images_count: imageUrls.length,
            chunks_count: chunks.length,
            chunk_number: 1,
            chunk_size: firstChunk.length
          }
        });
      } catch (logError) {
        console.error('❌ Failed to log failed first chunk:', logError);
      }
      
      return { success: false, error: result.description };
    }
    
    console.log('First media group sent successfully');
    
    // Log successful first chunk
    try {
      const telegramMessageId = result.result?.[0]?.message_id;
      await logTelegramNotification(supabaseClient, {
        function_name: 'send-product-publish-notification',
        notification_type: 'product_published',
        recipient_type: 'group',
        recipient_identifier: PRODUCT_GROUP_CHAT_ID,
        recipient_name: 'Product Group',
        message_text: messageText,
        status: 'sent',
        telegram_message_id: telegramMessageId?.toString(),
        related_entity_type: 'product',
        related_entity_id: productId,
        metadata: {
          images_count: imageUrls.length,
          chunks_count: chunks.length,
          chunk_number: 1,
          chunk_size: firstChunk.length,
          has_caption: true
        }
      });
    } catch (logError) {
      console.error('❌ Failed to log successful first chunk:', logError);
    }
    
    // Send remaining chunks if any
    for (let i = 1; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Sending additional chunk ${i + 1} with ${chunk.length} images`);
      
      const media = chunk.map((url) => ({
        type: 'photo',
        media: url
      }));
      
      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: PRODUCT_GROUP_CHAT_ID,
          media: media
        }),
      });
      
      const result = await response.json();
      
      if (!result.ok) {
        console.error(`Error sending media group ${i + 1}:`, result.description);
        
        // Log failed additional chunk
        try {
          await logTelegramNotification(supabaseClient, {
            function_name: 'send-product-publish-notification',
            notification_type: 'product_published',
            recipient_type: 'group',
            recipient_identifier: PRODUCT_GROUP_CHAT_ID,
            recipient_name: 'Product Group',
            message_text: `Additional images chunk ${i + 1}`,
            status: 'failed',
            related_entity_type: 'product',
            related_entity_id: productId,
            error_details: { 
              telegram_error: result.description,
              error_code: result.error_code,
              chunk_number: i + 1
            },
            metadata: {
              images_count: imageUrls.length,
              chunks_count: chunks.length,
              chunk_number: i + 1,
              chunk_size: chunk.length,
              has_caption: false
            }
          });
        } catch (logError) {
          console.error('❌ Failed to log failed additional chunk:', logError);
        }
        
        return { success: false, error: result.description };
      }
      
      console.log(`Media group ${i + 1} sent successfully`);
      
      // Log successful additional chunk
      try {
        const telegramMessageId = result.result?.[0]?.message_id;
        await logTelegramNotification(supabaseClient, {
          function_name: 'send-product-publish-notification',
          notification_type: 'product_published',
          recipient_type: 'group',
          recipient_identifier: PRODUCT_GROUP_CHAT_ID,
          recipient_name: 'Product Group',
          message_text: `Additional images chunk ${i + 1}`,
          status: 'sent',
          telegram_message_id: telegramMessageId?.toString(),
          related_entity_type: 'product',
          related_entity_id: productId,
          metadata: {
            images_count: imageUrls.length,
            chunks_count: chunks.length,
            chunk_number: i + 1,
            chunk_size: chunk.length,
            has_caption: false
          }
        });
      } catch (logError) {
        console.error('❌ Failed to log successful additional chunk:', logError);
      }
      
      // Add delay between chunks to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error sending media groups:', error);
    
    // Log exception error
    try {
      await logTelegramNotification(supabaseClient, {
        function_name: 'send-product-publish-notification',
        notification_type: 'product_published',
        recipient_type: 'group',
        recipient_identifier: PRODUCT_GROUP_CHAT_ID,
        recipient_name: 'Product Group',
        message_text: messageText,
        status: 'failed',
        related_entity_type: 'product',
        related_entity_id: productId,
        error_details: { 
          exception: error.message,
          stack: error.stack 
        },
        metadata: {
          images_count: imageUrls.length,
          error_type: 'exception'
        }
      });
    } catch (logError) {
      console.error('❌ Failed to log exception error:', logError);
    }
    
    return { success: false, error: error.message };
  }
}
