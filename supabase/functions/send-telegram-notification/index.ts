
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Telegram API constants
const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '7251106221:AAE3UaXbAejz1SzkhknDTrsASjpe-glhL0s';
const GROUP_CHAT_ID = Deno.env.get('TELEGRAM_GROUP_CHAT_ID') || '-4623601047';

// Maximum number of images per media group
const MAX_IMAGES_PER_GROUP = 10;

console.log('Environment:', {
  BOT_TOKEN_EXISTS: !!BOT_TOKEN,
  GROUP_CHAT_ID_EXISTS: !!GROUP_CHAT_ID
});

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

    // Validate required parameters
    if (!reqData.productId) {
      console.log('Missing required parameter: productId');
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: productId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Processing simplified product notification request for ID:', reqData.productId);
    
    // Fetch complete product details including images and videos
    const { data: product, error } = await supabaseClient
      .from('products')
      .select(`
        *,
        product_images(*),
        product_videos(*)
      `)
      .eq('id', reqData.productId)
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
    const videos = product.product_videos || [];
    
    console.log('Product has', images.length, 'images and', videos.length, 'videos');
    
    // Don't send notification if there are no images
    if (images.length === 0) {
      console.log('No images found for product, skipping notification');
      
      // Reset the notification timestamp to allow another attempt later
      const { error: updateError } = await supabaseClient
        .from('products')
        .update({ last_notification_sent_at: null })
        .eq('id', reqData.productId);
      
      if (updateError) {
        console.log('Error resetting notification timestamp:', updateError);
      }
      
      return new Response(
        JSON.stringify({ message: 'Notification skipped - no images found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Prepare the notification message
    const messageData = {
      title: product.title,
      price: product.price,
      deliveryPrice: product.delivery_price,
      lotNumber: product.lot_number,
      optId: product.optid_created || '',
      telegram: product.telegram_url || '',
      status: product.status
    };
    
    console.log('Successfully fetched and attached product data for ID:', reqData.productId);

    // Create message text
    const messageText = [
      `LOT(лот) #${messageData.lotNumber}`,
      `📦 ${messageData.title}`,
      `💰 Цена: ${messageData.price} $`,
      `🚚 Цена доставки: ${messageData.deliveryPrice} $`,
      `🆔 OPT_ID продавца: ${messageData.optId}`,
      `👤 Telegram продавца: @${messageData.telegram}`,
      '',
      `📊 Статус: ${messageData.status === 'active' ? 'Опубликован' : 'На модерации'}`
    ].join('\n');

    console.log('Sending message to Telegram:', messageText);
    
    // Use Bot Token and Chat ID
    console.log('Using BOT_TOKEN:', BOT_TOKEN);
    console.log('Using GROUP_CHAT_ID:', GROUP_CHAT_ID);

    // First, send text message without images
    const textMessageResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: GROUP_CHAT_ID,
        text: messageText,
        parse_mode: 'HTML',
      }),
    });

    const textMessageResult = await textMessageResponse.json();
    console.log('Telegram API response:', JSON.stringify(textMessageResult));
    console.log('Text message response:', textMessageResult);

    // Sort images to ensure the primary image comes first
    let sortedImages = [...images].sort((a, b) => {
      // Primary images first
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      // Then by creation date
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    
    const primaryImageFirst = sortedImages.length > 0 && sortedImages[0].is_primary;
    console.log('Sorted images. Primary image is first:', primaryImageFirst);

    // URLs for all images
    const imageUrls = sortedImages.map(image => image.url);
    
    console.log('Preparing to send', imageUrls.length, 'images in media group(s)');
    
    // Split images into chunks of MAX_IMAGES_PER_GROUP (10) for media groups
    const imageChunks = [];
    for (let i = 0; i < imageUrls.length; i += MAX_IMAGES_PER_GROUP) {
      imageChunks.push(imageUrls.slice(i, i + MAX_IMAGES_PER_GROUP));
    }
    
    console.log('Divided', imageUrls.length, 'images into', imageChunks.length, 'chunks');
    
    // Send each chunk as a media group
    for (let i = 0; i < imageChunks.length; i++) {
      const chunk = imageChunks[i];
      const mediaItems = [];
      
      // Add each image to the group
      for (let j = 0; j < chunk.length; j++) {
        const imageUrl = chunk[j];
        console.log(`Adding image to ${i === 0 ? 'first' : 'next'} group:`, imageUrl);
        
        // Add caption only to the first image of the first group
        const isFirstImageOfFirstGroup = i === 0 && j === 0;
        const mediaItem = {
          type: 'photo',
          media: imageUrl,
        };
        
        if (isFirstImageOfFirstGroup) {
          mediaItem.caption = messageText;
          mediaItem.parse_mode = 'HTML';
        }
        
        mediaItems.push(mediaItem);
      }
      
      console.log(`Sending ${i === 0 ? 'first' : 'next'} chunk with ${chunk.length} images${i === 0 ? ' and caption' : ''}`);
      
      // Send the media group
      const mediaGroupResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: GROUP_CHAT_ID,
          media: mediaItems,
        }),
      });
      
      const mediaGroupResult = await mediaGroupResponse.json();
      console.log('Calling Telegram API sendMediaGroup with data:', JSON.stringify({
        chat_id: GROUP_CHAT_ID,
        media: mediaItems,
      }));
      console.log('Telegram API response:', JSON.stringify(mediaGroupResult));
      
      if (i === 0) {
        console.log('First media group response:', mediaGroupResult);
      }
    }
    
    // Return success response
    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing request:', error);

    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
