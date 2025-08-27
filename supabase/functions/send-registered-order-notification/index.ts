import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS Headers for API responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

// Telegram API constants
const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const REGISTERED_GROUP_CHAT_ID = Deno.env.get('TELEGRAM_GROUP_CHAT_ID_REGISTERED') || '-2024698284';
const ORDER_BASE_URL = 'https://partsbay.ae/order/';

console.log('🚀 Registered Order Notification Function starting up...');
console.log('Environment variables check:');
console.log('- SUPABASE_URL exists:', !!Deno.env.get('SUPABASE_URL'));
console.log('- SUPABASE_SERVICE_ROLE_KEY exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
console.log('- TELEGRAM_BOT_TOKEN exists:', !!BOT_TOKEN);
console.log('- TELEGRAM_GROUP_CHAT_ID_REGISTERED exists:', !!Deno.env.get('TELEGRAM_GROUP_CHAT_ID_REGISTERED'));
console.log('- REGISTERED_GROUP_CHAT_ID (effective):', REGISTERED_GROUP_CHAT_ID);

serve(async (req) => {
  console.log('=== REGISTERED ORDER NOTIFICATION CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
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
    console.log('Received registered order notification request:', reqData);

    const orderData = reqData.order;
    if (!orderData) {
      return new Response(
        JSON.stringify({ error: 'Missing order data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Processing registered order notification, order #:', orderData.order_number);

    // Helper: normalize telegram username
    const normalizeTelegramUsername = (username: string | null | undefined): string => {
      if (!username) return '';
      let u = String(username).trim();
      u = u.replace(/^https?:\/\/t\.me\//i, '').replace(/^@+/, '');
      if (!u) return '';
      return `@${u}`;
    };

    // Fetch seller telegram from profiles
    let sellerTelegram: string = '';
    try {
      if (orderData.seller_id) {
        const { data: sellerProfile, error: sellerErr } = await supabaseClient
          .from('profiles')
          .select('telegram')
          .eq('id', orderData.seller_id)
          .single();
        if (sellerErr) {
          console.warn('Could not fetch seller telegram from profiles:', sellerErr);
        }
        sellerTelegram = normalizeTelegramUsername(sellerProfile?.telegram);
      }
    } catch (e) {
      console.warn('Exception fetching seller telegram:', e);
    }

    // Fallbacks
    const fallbackSellerTelegram = normalizeTelegramUsername(orderData.telegram_url_order);
    const displayTelegram = sellerTelegram || fallbackSellerTelegram || '';

    // Format order number with leading zero
    const formattedOrderNumber = orderData.order_number.toString().padStart(5, '0');

    // Compose name: title + brand + model in one line
    const nameParts = [orderData.title, orderData.brand, orderData.model].filter((v: string | null | undefined) => !!v && String(v).trim());
    const composedName = nameParts.join(' ').trim();

    // Get delivery method text
    const deliveryMethodText = orderData.delivery_method === 'cargo_rf' ? 'Доставка Cargo РФ' : 
                              orderData.delivery_method === 'self_pickup' ? 'Самовывоз' : 
                              orderData.delivery_method === 'cargo_kz' ? 'Доставка Cargo KZ' : 
                              orderData.delivery_method;

    // Message format exactly as specified
    const messageText = [
      `Номер заказа: ${formattedOrderNumber}`,
      `Статус: Зарегистрирован`,
      displayTelegram,
      ``,
      `🟰🟰🟰🟰🟰🟰`,
      `Наименование: ${composedName}`,
      ``,
      `Количество мест для отправки: ${orderData.place_number || 1}`,
      `Доставка: ${deliveryMethodText}`,
      ``,
      `Дополнительная информация: ${orderData.text_order || 'Не указана'}`,
      ``,
      `🟰🟰🟰🟰🟰🟰`,
      `Цена: ${orderData.price} $`,
      `Цена доставки: ${orderData.delivery_price_confirm || 0} $`,
      ``,
      `===`,
      `${orderData.seller_opt_id || ''}`,
      `${orderData.buyer_opt_id || ''}`
    ].join('\n');

    // Fetch order images
    let orderImages = [];
    
    // Check if order has images directly from the payload
    if (orderData.images && orderData.images.length > 0) {
      console.log('Using images from order data payload:', orderData.images.length, 'images');
      orderImages = orderData.images.map((url: string) => url);
    } else {
      // If no images in payload, fetch them from the database
      console.log('Fetching images from database for order:', orderData.id);
      const { data: imagesData, error: imagesError } = await supabaseClient
        .from('order_images')
        .select('url')
        .eq('order_id', orderData.id);
      
      if (imagesError) {
        console.error('Error fetching order images:', imagesError);
      } else if (imagesData && imagesData.length > 0) {
        console.log('Found', imagesData.length, 'images for order in database');
        orderImages = imagesData.map((img: any) => img.url);
      }
    }

    // Send notification to registered orders group
    await sendRegisteredOrderNotification(orderImages, messageText, orderData);

    return new Response(
      JSON.stringify({ success: true, message: 'Registered order notification sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('=== REGISTERED ORDER NOTIFICATION ERROR ===');
    console.error('Error details:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      name: error?.name || 'Unknown error type'
    });

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error?.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Helper function to wait between API calls
const waitBetweenBatches = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function sendRegisteredOrderNotification(orderImages: string[], messageText: string, orderData: any) {
  console.log(`Sending registered order notification with ${orderImages.length} images`);

  // Determine if we have more than 10 images that need to be split
  const firstBatchImages = orderImages.slice(0, 10);
  const remainingImages = orderImages.slice(10);
  const hasRemainingImages = remainingImages.length > 0;
  
  console.log(`Total images: ${orderImages.length}, First batch: ${firstBatchImages.length}, Remaining: ${remainingImages.length}`);
  
  // If we have images for the first group, send them with the text
  if (firstBatchImages.length > 0) {
    console.log('Sending first batch of images with notification text');
    
    const mediaItems = firstBatchImages.map((imageUrl: string, index: number) => {
      // First image gets the caption
      if (index === 0) {
        return {
          type: 'photo',
          media: imageUrl,
          caption: messageText,
          parse_mode: 'HTML'
        };
      }
      return {
        type: 'photo',
        media: imageUrl
      };
    });
    
    // Send media group with the first 10 images and text
    const mediaGroupResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: REGISTERED_GROUP_CHAT_ID,
        media: mediaItems
      }),
    });
    
    const mediaResult = await mediaGroupResponse.json();
    
    if (!mediaResult.ok) {
      console.error('Error sending first batch of images:', mediaResult.description);
      
      // If sending media group fails, fall back to sending text message
      const textMessageResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: REGISTERED_GROUP_CHAT_ID,
          text: messageText,
          parse_mode: 'HTML'
        }),
      });
      
      const textResult = await textMessageResponse.json();
      
      if (!textResult.ok) {
        console.error('Error sending fallback text message:', textResult.description);
        throw new Error(textResult.description || 'Failed to send registered order notification');
      } else {
        console.log('Fallback text message sent successfully');
      }
    } else {
      console.log('First batch of images sent successfully with notification text');
    }
  } else {
    // If no images, just send text message
    console.log('No images for first batch, sending text only message');
    
    const textMessageResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: REGISTERED_GROUP_CHAT_ID,
        text: messageText,
        parse_mode: 'HTML'
      }),
    });
    
    const textResult = await textMessageResponse.json();
    
    if (!textResult.ok) {
      console.error('Error sending registered order notification message:', textResult.description);
      throw new Error(textResult.description || 'Failed to send registered order notification');
    }
    
    console.log('Registered order notification text sent successfully');
  }
  
  // If we have remaining images (more than 10), send them in additional groups
  if (hasRemainingImages) {
    console.log(`Sending remaining ${remainingImages.length} images in additional message(s)`);
    
    // Format order number with leading zero for remaining images caption
    const formattedOrderNumber = orderData.order_number.toString().padStart(5, '0');
    const remainingCaption = `К заказу номер ${formattedOrderNumber}`;
    
    // Split remaining images into chunks of 10 for media groups
    const remainingChunks = [];
    for (let i = 0; i < remainingImages.length; i += 10) {
      remainingChunks.push(remainingImages.slice(i, i + 10));
    }
    
    console.log(`Split remaining images into ${remainingChunks.length} chunks`);
    
    // Send each chunk of remaining images with delay between attempts
    for (let i = 0; i < remainingChunks.length; i++) {
      const chunk = remainingChunks[i];
      
      // Wait 5 seconds between chunks to avoid rate limits
      if (i > 0) {
        console.log(`Waiting 5 seconds before sending next chunk to avoid rate limits...`);
        await waitBetweenBatches(5000);
      }
      
      const mediaItems = chunk.map((imageUrl: string, index: number) => {
        // First image of each group gets the caption
        if (index === 0) {
          return {
            type: 'photo',
            media: imageUrl,
            caption: remainingCaption
          };
        }
        return {
          type: 'photo',
          media: imageUrl
        };
      });
      
      console.log(`Sending remaining images chunk ${i+1} with ${chunk.length} images`);
      
      // Retry media group sending up to 5 times in case of failure
      let mediaGroupResult = null;
      let retryCount = 0;
      const maxRetries = 5;
      
      while (retryCount < maxRetries) {
        try {
          const mediaGroupResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: REGISTERED_GROUP_CHAT_ID,
              media: mediaItems
            }),
          });
          
          mediaGroupResult = await mediaGroupResponse.json();
          console.log(`Remaining images chunk ${i+1}, attempt ${retryCount+1} response:`, 
            mediaGroupResult.ok ? 'SUCCESS' : 'FAILED');
          
          if (mediaGroupResult.ok) {
            break; // Exit retry loop on success
          } else {
            const retryAfter = mediaGroupResult.parameters?.retry_after || 10;
            console.error(`Error sending remaining images chunk ${i+1}, attempt ${retryCount+1}:`, 
              mediaGroupResult.description || 'Unknown error', 
              `Retry after: ${retryAfter} seconds`);
            retryCount++;
            
            if (retryCount < maxRetries) {
              // Wait longer between retries (exponential backoff + retry_after)
              const waitTime = (Math.pow(2, retryCount) * 1000) + (retryAfter * 1000);
              console.log(`Waiting ${waitTime/1000} seconds before retry ${retryCount+1}...`);
              await waitBetweenBatches(waitTime);
              console.log(`Retrying remaining images chunk ${i+1}, attempt ${retryCount+1}...`);
            }
          }
        } catch (error) {
          console.error(`Network error sending remaining images chunk ${i+1}, attempt ${retryCount+1}:`, error);
          retryCount++;
          
          if (retryCount < maxRetries) {
            // Wait longer between retries for network errors
            const waitTime = Math.pow(2, retryCount) * 2000;
            console.log(`Waiting ${waitTime/1000} seconds before retry ${retryCount+1}...`);
            await waitBetweenBatches(waitTime);
          }
        }
      }
      
      // Check if we exceeded retry count
      if (retryCount >= maxRetries) {
        console.error(`Failed to send remaining images chunk ${i+1} after ${maxRetries} attempts`);
      }
    }
  }
}