import { createServiceClient } from '../_shared/client.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { logTelegramNotification } from '../shared/telegram-logger.ts';
import { getLocalTelegramAccounts, getTelegramForDisplay } from '../shared/telegram-config.ts';

// Constants
const TG_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const MAX_IMAGES_PER_GROUP = 10;
const DELAY_BETWEEN_CHUNKS = 1000; // ms

/**
 * Transform Cloudinary URL to be Telegram-friendly
 * Adds fl_attachment,f_jpg/ to force file download instead of webpage preview
 */
function makeCloudinaryTelegramFriendly(url: string): string {
  if (!url.includes('res.cloudinary.com')) {
    return url; // Not a Cloudinary URL, return as-is
  }

  // Find /image/upload/ marker
  const uploadMarker = '/image/upload/';
  const uploadIndex = url.indexOf(uploadMarker);
  
  if (uploadIndex === -1) {
    console.warn(`⚠️ [Cloudinary] Could not find /image/upload/ in URL: ${url}`);
    return url;
  }
  
  // Insert transformations right after /upload/
  const beforeUpload = url.substring(0, uploadIndex + uploadMarker.length);
  const afterUpload = url.substring(uploadIndex + uploadMarker.length);
  
  // Check if already has fl_attachment
  if (afterUpload.startsWith('fl_attachment')) {
    console.log(`✅ [Cloudinary] URL already has fl_attachment`);
    return url;
  }
  
  // Add fl_attachment to force file download and f_jpg for format
  const transforms = 'fl_attachment,f_jpg/';
  const newUrl = `${beforeUpload}${transforms}${afterUpload}`;
  
  console.log(`🔄 [Cloudinary] Transformed for Telegram:`);
  console.log(`   Original: ${url.substring(0, 80)}...`);
  console.log(`   Modified: ${newUrl.substring(0, 80)}...`);
  
  return newUrl;
}

/**
 * Simple Telegram send function WITHOUT retry logic
 * Retry is handled by QStash, not here
 */
async function sendToTelegram(
  chatId: string,
  message: string,
  images: string[] = []
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  if (!TG_BOT_TOKEN) {
    return { success: false, error: 'TELEGRAM_BOT_TOKEN not configured' };
  }

  // Transform all images to be Telegram-friendly
  const telegramImages = images.map(makeCloudinaryTelegramFriendly);
  
  // Text-only message
  if (telegramImages.length === 0) {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
          })
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.description };
      }
      
      const result = await response.json();
      return { success: true, messageId: result.result.message_id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Media groups - chunk into groups of 10
  const chunks: string[][] = [];
  for (let i = 0; i < telegramImages.length; i += MAX_IMAGES_PER_GROUP) {
    chunks.push(telegramImages.slice(i, i + MAX_IMAGES_PER_GROUP));
  }
  
  console.log(`📤 Sending ${telegramImages.length} images in ${chunks.length} chunks`);
  
  let firstMessageId: string | undefined;
  
  try {
    for (let i = 0; i < chunks.length; i++) {
      // Delay between chunks
      if (i > 0) {
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_CHUNKS));
      }
      
      const media = chunks[i].map((url, idx) => ({
        type: 'photo',
        media: url,
        // Caption only on first image of first chunk
        ...(i === 0 && idx === 0 ? { caption: message, parse_mode: 'HTML' } : {})
      }));
      
      const response = await fetch(
        `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMediaGroup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, media })
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.description };
      }
      
      // Store first message ID
      if (i === 0) {
        const result = await response.json();
        firstMessageId = result.result?.[0]?.message_id;
      }
    }
    
    return { success: true, messageId: firstMessageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Main handler - routes notifications by type
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Verify QStash signature
    const signature = req.headers.get('Upstash-Signature');
    if (!signature) {
      console.error('❌ Missing QStash signature');
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders 
      });
    }
    
    const data = await req.json();
    const { notificationType, payload } = data;
    
    console.log(`📨 [telegram-queue-handler] Processing: ${notificationType}`);
    console.log(`   Payload:`, JSON.stringify(payload).substring(0, 200));
    
    const supabase = createServiceClient();
    let result: any;
    
    // Route to appropriate handler
    switch (notificationType) {
      case 'product':
        // TODO: Implement in Step 2
        result = { success: false, error: 'Product handler not implemented yet' };
        break;
        
      case 'order':
        // TODO: Implement in Step 3
        result = { success: false, error: 'Order handler not implemented yet' };
        break;
        
      case 'seller_sold':
        // TODO: Implement in Step 4
        result = { success: false, error: 'Seller notification handler not implemented yet' };
        break;
        
      case 'price_offer':
        // TODO: Implement in Step 4
        result = { success: false, error: 'Price offer handler not implemented yet' };
        break;
        
      case 'user_welcome':
        // TODO: Implement in Step 5
        result = { success: false, error: 'User welcome handler not implemented yet' };
        break;
        
      case 'verification':
        // TODO: Implement in Step 5
        result = { success: false, error: 'Verification handler not implemented yet' };
        break;
        
      case 'admin_new_product':
        // TODO: Implement in Step 6
        result = { success: false, error: 'Admin product handler not implemented yet' };
        break;
        
      case 'admin_new_user':
        // TODO: Implement in Step 6
        result = { success: false, error: 'Admin user handler not implemented yet' };
        break;
        
      case 'bulk':
        // TODO: Implement in Step 7
        result = { success: false, error: 'Bulk handler not implemented yet' };
        break;
        
      case 'personal':
        // TODO: Implement in Step 7
        result = { success: false, error: 'Personal message handler not implemented yet' };
        break;
        
      default:
        throw new Error(`Unknown notification type: ${notificationType}`);
    }
    
    // Log to database
    await logTelegramNotification(supabase, {
      function_name: 'telegram-queue-handler',
      notification_type: notificationType,
      recipient_type: 'queue',
      recipient_identifier: 'qstash',
      message_text: 'Queued notification',
      status: result.success ? 'sent' : 'failed',
      telegram_message_id: result.messageId,
      error_details: result.error ? { error: result.error } : null,
      metadata: { payload, result }
    });
    
    console.log(`${result.success ? '✅' : '❌'} [telegram-queue-handler] Result:`, result);
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: result.success ? 200 : 500
      }
    );
  } catch (error) {
    console.error('💥 [telegram-queue-handler] Fatal error:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
